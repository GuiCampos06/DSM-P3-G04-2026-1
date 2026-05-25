let chartLinhaInstance = null; 
let chartPizzaInstance = null; 
let idGastoEmEdicao = null;

window.addEventListener('load', () => {
    verificarSessao();
    carregarDadosFinanceiros();

    // Lógica para o botão "Adicionar Gastos"
    const btnAdd = document.querySelector(".btn-add");
    if (btnAdd) {
        btnAdd.onclick = () => {
            idGastoEmEdicao = null; // Garante que é um novo gasto
            document.querySelector(".modal h2").innerText = "Novo Gasto";
            document.getElementById("descGasto").value = "";
            document.getElementById("valorGasto").value = "";
            document.getElementById("modalGasto").style.display = "flex";
        };
    }

    // Fecha o modal ao clicar fora dele
    window.onclick = event => {
        const modal = document.getElementById("modalGasto");
        if (event.target === modal) fecharModal();
    };
});

function fecharModal() {
    const modal = document.getElementById("modalGasto");
    if (modal) modal.style.display = "none";
}

function verificarSessao() {
    fetch('/users/sessao')
        .then(r => r.json())
        .then(data => {
            if (!data.logado) return (window.location.href = "index.html");
            const elNome = document.getElementById("nome-usuario");
            if (elNome) elNome.innerText = data.usuario.Nick;
        });
}

function formatarMoeda(elemento) {
    let v = elemento.value.replace(/\D/g, "");
    v = (v / 100).toFixed(2).replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/, "$1.$2,");
    elemento.value = "R$ " + v;
}

function salvarGasto() {
    const descricao = document.getElementById("descGasto").value;
    const categoria = document.getElementById("categoriaGasto")?.value || "outros";
    let valor = document.getElementById("valorGasto").value;

    valor = valor.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
    valor = parseFloat(valor);

    if (!descricao || isNaN(valor) || valor <= 0) return alert("Preencha os campos corretamente.");

    const corpo = { descricao, valor, categoria };
    let url = idGastoEmEdicao ? "/gastos/editar" : "/gastos/novo";
    if (idGastoEmEdicao) corpo.idDespesa = idGastoEmEdicao;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    })
    .then(r => r.json())
    .then(data => {
        if (!data.ok) return alert("Erro ao salvar.");
        fecharModal();
        carregarDadosFinanceiros();
        idGastoEmEdicao = null;
    });
}

function carregarDadosFinanceiros() {
    fetch('/gastos/listar')
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;
            renderizarLista(data.gastos);
            atualizarCards(data.total, data.renda);
            renderizarGrafico(data.dadosGrafico);
            renderizarPizza(data.dadosPizza);
        });
}

function renderizarLista(lista) {
    const div = document.getElementById("lista-gastos");
    if (!div) return;
    div.innerHTML = "";

    if (!lista || lista.length === 0) {
        div.innerHTML = "<p class='msg-vazio'>Nenhum gasto recente.</p>";
        return;
    }

    lista.forEach(item => {
        const valorF = parseFloat(item.valorGasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const linha = document.createElement("div");
        linha.classList.add("item-gasto");
        linha.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; text-align:left;">
                <span class="desc">${item.descricao}</span>
                <span style="font-size:0.8rem; color:#aaa;">${item.categoria}</span>
            </div>
            <span class="data">${item.dataFormatada}</span>
            <span class="valor-gasto" style="color:#ff5555; font-weight:bold; margin: 0 15px;">- ${valorF}</span>
            <div class="acoes-item">
                <button class="btn-icon" onclick="prepararEdicao('${item._id}', '${item.descricao}', ${item.valorGasto}, '${item.categoria}')">✏️</button>
                <button class="btn-icon" onclick="deletarGasto('${item._id}')">🗑️</button>
            </div>
        `;
        div.appendChild(linha);
    });
}

function atualizarCards(total, renda) {
    const gasto = parseFloat(total);
    const rendaNum = parseFloat(renda);
    const economia = rendaNum - gasto;
    const cards = document.querySelectorAll('.card-info .valor');
    if (cards[0]) cards[0].innerText = gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (cards[1]) {
        cards[1].innerText = economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        cards[1].style.color = economia < 0 ? '#ff5555' : '#4caf50';
    }
}

function deletarGasto(id) {
    if (!confirm("Apagar este gasto permanentemente?")) return;
    fetch('/gastos/deletar', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDespesa: id })
    }).then(() => carregarDadosFinanceiros());
}

function prepararEdicao(id, desc, valor, categoria) {
    idGastoEmEdicao = id;
    document.querySelector(".modal h2").innerText = "Editar Gasto";
    document.getElementById("descGasto").value = desc;
    document.getElementById("categoriaGasto").value = categoria;
    document.getElementById("valorGasto").value = "R$ " + parseFloat(valor).toFixed(2).replace(".", ",");
    document.getElementById("modalGasto").style.display = "flex";
}

function renderizarGrafico(dados) {
    const ctx = document.getElementById("graficoLinha");
    if (!ctx || !dados) return;
    const mesesLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const labels = dados.map(d => mesesLabels[d.mes - 1]);
    const valores = dados.map(d => d.total);
    if (chartLinhaInstance) chartLinhaInstance.destroy();
    chartLinhaInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{ label: 'Gastos', data: valores, borderColor: '#4a09ff', tension: 0.3, fill: true }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function renderizarPizza(dados) {
    const ctx = document.getElementById("graficoPizza");
    if (!ctx || !dados) return;
    const labels = dados.map(d => d.categoria);
    const valores = dados.map(d => d.total);
    if (chartPizzaInstance) chartPizzaInstance.destroy();
    chartPizzaInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ data: valores, backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#FF5733','#C70039','#C9CBCF'] }]
        },
        options: { responsive: true, plugins: { legend: { position: "right", labels: { color: "white" } } } }
    });
}