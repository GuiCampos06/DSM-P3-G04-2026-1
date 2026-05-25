window.addEventListener('load', () => {
    carregarEventos();
});

function carregarEventos() {
    fetch("/events")
        .then(r => r.json())
        .then(data => {
            const lista = document.getElementById("lista-eventos");
            if (!lista) return;
            lista.innerHTML = "";

            if (!data.ok || !data.eventos || data.eventos.length === 0) {
                lista.innerHTML = "<p style='color:#ccc; text-align:center; font-size:1.2rem;'>Nenhum rolê marcado. Bora marcar um?</p>";
                return;
            }

            data.eventos.forEach(ev => {
                const card = document.createElement("div");
                card.classList.add("card-role");

                // USANDO ev._id EM VEZ DE pk_idEvento
                card.innerHTML = `
                    <div class="card-header">
                        <span>${ev.nomeEvento}</span>
                        <span class="seta-icon">▼</span>
                    </div>
                    <div class="card-body" style="display:none;">
                        <p class="loading">Carregando detalhes...</p>
                    </div>
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
                        // PASSA O _id PARA A FUNÇÃO
                        buscarDetalhes(ev._id, body); 
                    }
                };

                lista.appendChild(card);
            });
        })
        .catch(err => console.error("Erro ao carregar lista:", err));
}

function buscarDetalhes(id, container) {
    fetch(`/events/${id}`)
        .then(r => r.json())
        .then(info => {
            if (!info.ok) {
                container.innerHTML = "<p>Erro ao carregar detalhes.</p>";
                return;
            }

            const ev = info.evento;
            const gasto = info.gasto;

            // Formatação de Data vinda do MongoDB
            let dataTexto = "Data a definir";
            if (ev.dataEvento) {
                const d = new Date(ev.dataEvento);
                dataTexto = d.toLocaleDateString('pt-BR') + " às " + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            }

            const custo = parseFloat(gasto?.valorGasto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            container.innerHTML = `
                <p><strong>📅 Quando:</strong> ${dataTexto}</p>
                <p><strong>📍 Onde:</strong> ${ev.localEvento || 'Não informado'}</p>
                <p><strong>👥 Galera:</strong> ${ev.QuantParticipantes || 0} pessoas</p>
                <p><strong>💰 Investimento:</strong> ${custo}</p>
                
                <div style="text-align: right; margin-top: 15px;">
                    <button onclick="excluirRole('${ev._id}')" style="background:#ff4444; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">
                        Cancelar Rolê
                    </button>
                </div>
            `;
        })
        .catch(err => console.error("Erro detalhes:", err));
}

function excluirRole(id) {
    if(!confirm("Tem certeza que vai cancelar?")) return;

    fetch('/events/excluir', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: id })
    })
    .then(r => r.json())
    .then(data => {
        if(data.ok) {
            alert("Cancelado!");
            carregarEventos();
        } else {
            alert("Erro: " + data.msg);
        }
    });
}