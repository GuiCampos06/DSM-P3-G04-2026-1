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
    fetch(`/events/${ev._id}`)
        .then(r => r.json())
        .then(data => {
            const eventoFull = data.evento;
            const valorTotal = data.valorTotal;
            const todosParticipantes = [eventoFull.fk_idUsuario, ...eventoFull.confirmados, ...eventoFull.convidados];

            let htmlParticipantes = "";
            todosParticipantes.forEach(p => {
                const isDono = p._id === eventoFull.fk_idUsuario._id;
                const isPendente = eventoFull.convidados.some(c => c._id === p._id);
                const valorSalvo = eventoFull.divisaoManual.find(d => d.usuarioId === p._id)?.valor || (valorTotal / (eventoFull.confirmados.length + 1));

                htmlParticipantes += `
                    <div class="pagador-row">
                        <div class="user-meta">
                            <span>${p.Nick} ${isDono ? '👑' : ''} ${isPendente ? '<small>(Pendente)</small>' : ''}</span>
                            ${souDono && !isDono ? `<button class="btn-mini-remover" onclick="alterarParticipante('${ev._id}', '${p._id}', 'remover')">Remover</button>` : ''}
                        </div>
                        ${souDono 
                            ? `<input type="number" class="input-divisao" data-id="${p._id}" value="${valorSalvo.toFixed(2)}" oninput="validarSoma(${valorTotal}, '${ev._id}')">`
                            : `<strong>R$ ${valorSalvo.toFixed(2)}</strong>`
                        }
                    </div>
                `;
            });

            container.innerHTML = `
                <div class="sessao-divisao">
                    <h4>👥 Participantes e Gastos (Total: R$ ${valorTotal.toFixed(2)})</h4>
                    <div class="lista-divisao-manual">${htmlParticipantes}</div>
                    
                    ${souDono ? `
                        <div id="status-soma-${ev._id}" class="status-soma"></div>
                        <button onclick="salvarDivisao('${ev._id}')" class="btn-salvar-divisao">Salvar Divisão de Gastos</button>
                        <div class="invite-extra">
                            <button onclick="abrirSeletorAmigos('${ev._id}')" class="btn-convidar-mais">+ Convidar mais amigos</button>
                        </div>
                    ` : ''}
                </div>

                <div style="margin-top: 20px; text-align: right;">
                    ${souDono ? `<button onclick="excluirRole('${ev._id}')" class="btn-excluir">Cancelar Rolê</button>` : ''}
                    ${convitePendente ? `
                        <button onclick="responder('${ev._id}', 'aceitar')" class="btn-aceitar">Aceitar</button>
                        <button onclick="responder('${ev._id}', 'recusar')" class="btn-recusar">Recusar</button>
                    ` : ''}
                </div>
            `;
            if(souDono) validarSoma(valorTotal, ev._id);
        });
}

function salvarDivisao(idEvento) {
    const inputs = document.querySelectorAll('.input-divisao');
    const distribuicao = Array.from(inputs).map(i => ({ usuarioId: i.dataset.id, valor: parseFloat(i.value) || 0 }));

    fetch('/events/divisao-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEvento, distribuicao })
    }).then(res => res.json()).then(data => data.ok ? alert("Salvo!") : alert("Erro"));
}

// Função que abre a lista de amigos dentro do card para convidar
function abrirSeletorAmigos(idEvento) {
    const container = document.querySelector(`.sessao-divisao`);
    
    // Busca os amigos aceitos
    fetch('/friends/list')
        .then(r => r.json())
        .then(data => {
            const amigos = data.amigos.filter(a => a.status === 'aceito');
            
            if (amigos.length === 0) {
                alert("Você ainda não tem amigos aceitos para convidar.");
                return;
            }

            // Cria um "Mini-Modal" ou lista flutuante
            let htmlLista = `
                <div id="seletor-amigos-rolê" class="seletor-flutuante">
                    <h5>Convidar para este Rolê</h5>
                    <div class="lista-scroll">
                        ${amigos.map(a => `
                            <div class="item-amigo-convite">
                                <span>${a.usuarioId.Nick}</span>
                                <button onclick="alterarParticipante('${idEvento}', '${a.usuarioId._id}', 'convidar')" class="btn-pode-convidar">Convidar</button>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="this.parentElement.remove()" class="btn-fechar-seletor">Fechar</button>
                </div>
            `;

            // Remove se já houver um aberto para não duplicar
            const antigo = document.getElementById("seletor-amigos-rolê");
            if(antigo) antigo.remove();

            // Insere no container de divisão
            container.insertAdjacentHTML('beforeend', htmlLista);
        });
}

// Função para enviar o convite ou remover (Backend já está pronto para isso)
function alterarParticipante(idEvento, idUsuario, acao) {
    fetch('/events/participante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEvento, idUsuario, acao })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            // Se for convite, podemos fechar a lista e atualizar o card
            const seletor = document.getElementById("seletor-amigos-rolê");
            if(seletor) seletor.remove();
            
            alert(acao === 'convidar' ? "Convite enviado!" : "Participante removido.");
            carregarEventos(); // Recarrega para mostrar o novo nome na lista
        } else {
            alert("Erro ao processar ação.");
        }
    });
}

function validarSoma(total, id) {
    const inputs = document.querySelectorAll('.input-divisao');
    let soma = 0;
    inputs.forEach(i => soma += parseFloat(i.value) || 0);
    const diff = total - soma;
    const el = document.getElementById(`status-soma-${id}`);
    el.innerHTML = Math.abs(diff) < 0.01 ? `<span style="color:#00ff88">Conta fechada!</span>` : `<span style="color:#ff3b3b">Diferença: R$ ${diff.toFixed(2)}</span>`;
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