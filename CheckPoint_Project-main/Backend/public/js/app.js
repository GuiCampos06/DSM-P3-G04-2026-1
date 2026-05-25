window.addEventListener('load', () => {
    const paginaAtual = window.location.pathname;
    verificarSessao();
    
    if (paginaAtual.includes('menu_inicial.html')) {
        carregarDadosSemaforo();
        atualizarContagemRoles();
    }
});

// === MENU DE PERFIL (DROPDOWN) ===
function alternarMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById("menuUsuario");
    if (menu) {
        menu.classList.toggle("mostrar");
    }
}

// Fecha o menu se clicar em qualquer outro lugar da tela
window.addEventListener('click', (e) => {
    const menu = document.getElementById("menuUsuario");
    if (menu && !e.target.closest('.area-usuario')) {
        menu.classList.remove('mostrar');
    }
});

// === SESSÃO ===
function verificarSessao() {
    fetch('/users/sessao')
        .then(response => response.json())
        .then(data => {
            if (data.logado) {
                const elNome = document.getElementById('nome-usuario');
                if (elNome) elNome.innerText = data.usuario.Nick;
                
                const elValor = document.getElementById('textoSaldo');
                if (elValor && data.usuario.Valor) {
                    elValor.innerText = parseFloat(data.usuario.Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
            } else {
                if (!window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
}

// === LÓGICA DO SEMÁFORO ===
function carregarDadosSemaforo() {
    fetch('/gastos/listar')
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                const gasto = parseFloat(data.total) || 0;
                const meta = parseFloat(data.renda) || 0;
                let porcentagem = meta > 0 ? (gasto / meta) * 100 : (gasto > 0 ? 100 : 0);
                atualizarSemaforo(porcentagem);
            }
        });
}

function atualizarSemaforo(porcentagem) {
    const luzVermelha = document.getElementById("luz-vermelha");
    const luzAmarela = document.getElementById("luz-amarela");
    const luzVerde = document.getElementById("luz-verde");
    const textoMsg = document.getElementById("texto-status");

    if (!luzVermelha || !textoMsg) return;

    luzVermelha.classList.remove("aceso");
    luzAmarela.classList.remove("aceso");
    luzVerde.classList.remove("aceso");

    if (porcentagem < 80) {
        luzVerde.classList.add("aceso");
        textoMsg.innerText = "Tudo tranquilo! Gastos sob controle.";
        textoMsg.className = "msg-verde"; 
    } else if (porcentagem < 100) {
        luzAmarela.classList.add("aceso");
        textoMsg.innerText = "Atenção! Você está perto do limite.";
        textoMsg.className = "msg-amarela"; 
    } else {
        luzVermelha.classList.add("aceso");
        textoMsg.innerText = "Cuidado! Orçamento estourado!";
        textoMsg.className = "msg-vermelha"; 
    }
}

// === MODAL SALDO (Meta Mensal) ===
function abrirModalSaldo(event) {
    if(event) event.preventDefault();
    const modal = document.getElementById("modalSaldo");
    if(modal) modal.classList.add("mostrar-modal");
}

function fecharModalSaldo() {
    const modal = document.getElementById("modalSaldo");
    if(modal) modal.classList.remove("mostrar-modal");
}

function salvarNovoSaldo() {
    const input = document.getElementById("input-novo-saldo");
    let valorLimpo = input.value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    const valorFinal = parseFloat(valorLimpo);

    if (isNaN(valorFinal)) return alert("Valor inválido.");

    fetch('/users/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Valor: valorFinal })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            fecharModalSaldo();
            location.reload(); // Recarrega para atualizar tudo
        }
    });
}

function atualizarContagemRoles() {
    const elementoQtd = document.getElementById("qtd-roles");
    if (elementoQtd) {
        fetch("/events/quantidade")
            .then(res => res.json())
            .then(data => {
                if (data.ok) elementoQtd.textContent = data.total;
            });
    }
}

// Formatação de moeda universal
function formatarMoeda(elemento) {
    let valor = elemento.value.replace(/\D/g, "");
    valor = (valor / 100).toFixed(2) + "";
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    valor = valor.replace(/(\d)(\d{3}),/g, "$1.$2,");
    elemento.value = "R$ " + valor;
}

// public/js/app.js

window.addEventListener('load', () => {
    verificarSessao();
});

// Função para abrir/fechar o menu do perfil
function alternarMenu(event) {
    if (event) {
        event.stopPropagation(); // Impede o clique de fechar o menu na mesma hora
    }
    const menu = document.getElementById("menuUsuario");
    if (menu) {
        menu.classList.toggle("mostrar");
        console.log("Menu alternado!"); // Debug para você ver no F12
    } else {
        console.error("Erro: Elemento #menuUsuario não encontrado no HTML!");
    }
}

// Fecha o menu se o usuário clicar em qualquer outro lugar da tela
window.onclick = function(event) {
    if (!event.target.closest('.area-usuario')) {
        const menu = document.getElementById("menuUsuario");
        if (menu && menu.classList.contains('mostrar')) {
            menu.classList.remove('mostrar');
        }
    }
    
    // Fecha o modal de saldo se clicar fora dele (usado na home)
    const modalSaldo = document.getElementById("modalSaldo");
    if (event.target == modalSaldo) {
        fecharModalSaldo();
    }
}

function verificarSessao() {
    fetch('/users/sessao')
        .then(res => res.json())
        .then(data => {
            if (data.logado) {
                const elNome = document.getElementById('nome-usuario');
                if (elNome) elNome.innerText = data.usuario.Nick;
                
                const elValor = document.getElementById('textoSaldo');
                if (elValor && data.usuario.Valor) {
                    elValor.innerText = parseFloat(data.usuario.Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
            } else {
                // Se não estiver na index, redireciona para login
                if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                    window.location.href = 'index.html';
                }
            }
        });
}

// Funções do Modal de Saldo (Home)
function abrirModalSaldo(event) {
    if(event) event.preventDefault();
    document.getElementById("modalSaldo").classList.add("mostrar-modal");
}

function fecharModalSaldo() {
    document.getElementById("modalSaldo").classList.remove("mostrar-modal");
}