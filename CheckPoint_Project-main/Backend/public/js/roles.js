window.addEventListener('load', () => {
    carregarEventos();
});

// public/js/roles.js

function carregarEventos() {
    fetch("/events")
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById("lista-eventos");
            const meuId = data.meuId.toString(); // Garante que o ID é texto
            lista.innerHTML = "";

            data.eventos.forEach(ev => {
                const card = document.createElement("div");
                card.classList.add("card-role");

                // Transformamos os arrays de IDs em strings para comparar
                const convidadosStr = ev.convidados.map(id => id.toString());
                const confirmadosStr = ev.confirmados.map(id => id.toString());

                const souDono = ev.fk_idUsuario.toString() === meuId;
                const convitePendente = convidadosStr.includes(meuId);
                const jaConfirmado = confirmadosStr.includes(meuId);

                card.innerHTML = `
                    <div class="card-header ${convitePendente ? 'convite-destaque' : ''}">
                        <span>${ev.nomeEvento} ${convitePendente ? '<b style="color:var(--roxo-brilhante)"> (NOVO CONVITE)</b>' : ''}</span>
                        <span class="seta-icon">▼</span>
                    </div>
                    <div class="card-body" style="display:none;"></div>
                `;

                const header = card.querySelector(".card-header");
                const body = card.querySelector(".card-body");

                header.onclick = () => {
                    const estaAberto = card.classList.contains("aberto");
                    document.querySelectorAll(".card-role").forEach(c => {
                        c.classList.remove("aberto");
                        c.querySelector(".card-body").style.display = "none";
                    });

                    if (!estaAberto) {
                        card.classList.add("aberto");
                        body.style.display = "block";
                        renderizarDetalhes(ev, body, souDono, convitePendente, jaConfirmado);
                    }
                };

                lista.appendChild(card);
            });
        });
}

function renderizarDetalhes(ev, container, souDono, convitePendente, jaConfirmado) {
    // 1. Primeiro, buscamos os dados completos do evento (confirmados e valor)
    fetch(`/events/${ev._id}`)
        .then(r => r.json())
        .then(data => {
            const eventoFull = data.evento;
            const valorTotal = data.valorTotal;
            const confirmados = eventoFull.confirmados || [];
            
            // O total de pessoas é: Quem confirmou + o Dono
            const totalPessoas = confirmados.length + 1;
            const valorPorPessoa = valorTotal / totalPessoas;

            const dataF = new Date(ev.dataEvento).toLocaleString('pt-BR');
            
            // HTML dos botões de ação (Aceitar/Recusar/Cancelar)
            let botoesHtml = "";
            if (souDono) {
                botoesHtml = `<button onclick="excluirRole('${ev._id}')" class="btn-excluir">Cancelar Rolê</button>`;
            } else if (convitePendente) {
                botoesHtml = `
                    <div class="acoes-convite">
                        <button onclick="responder('${ev._id}', 'aceitar')" class="btn-aceitar">Aceitar</button>
                        <button onclick="responder('${ev._id}', 'recusar')" class="btn-recusar">Recusar</button>
                    </div>`;
            } else if (jaConfirmado) {
                botoesHtml = `<span class="status-confirmado">Presença Confirmada ✓</span>`;
            }

            // Interface de Divisão de Gastos
            container.innerHTML = `
                <div class="info-geral">
                    <p><strong>📅 Quando:</strong> ${dataF}</p>
                    <p><strong>📍 Onde:</strong> ${ev.localEvento || 'A combinar'}</p>
                </div>

                <div class="sessao-divisao">
                    <h4>💰 Divisão de Gastos</h4>
                    <div class="card-split">
                        <div class="split-item">
                            <span>Total do Rolê:</span>
                            <strong>${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                        <div class="split-item">
                            <span>Pessoas confirmadas:</span>
                            <strong>${totalPessoas}</strong>
                        </div>
                        <div class="split-line"></div>
                        <div class="split-item destaque">
                            <span>Cada um paga:</span>
                            <strong class="valor-individual">${valorPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                    </div>
                    
                    <div class="lista-pagadores">
                        <small>Quem está no racha:</small>
                        <ul>
                            <li>👑 ${eventoFull.fk_idUsuario.Nick} (Organizador)</li>
                            ${confirmados.map(p => `<li>👤 ${p.Nick}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: right;">
                    ${botoesHtml}
                </div>
            `;
        });
}

function responder(id, acao) {
    // Adicionamos um alert para você saber que o clique funcionou
    fetch('/events/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEvento: id, acao })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            alert(acao === 'aceitar' ? "Presença confirmada!" : "Convite recusado.");
            carregarEventos(); // Recarrega a lista para sumir o botão
        } else {
            alert("Erro ao responder convite.");
        }
    })
    .catch(err => console.error("Erro no fetch:", err));
}

function responder(id, acao) {
    fetch('/events/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEvento: id, acao })
    }).then(() => carregarEventos());
}

function excluirRole(id) {
    if(!confirm("Deseja cancelar o rolê?")) return;
    fetch('/events/excluir', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id })
    }).then(() => carregarEventos());
}