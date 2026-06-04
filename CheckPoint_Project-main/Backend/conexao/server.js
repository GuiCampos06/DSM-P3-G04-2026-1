const express = require('express');
const path = require('path');
const session = require('express-session');

// Conecta ao MongoDB Atlas
require('./conexao'); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importação dos Controllers
const UserController = require('../LinkSQL/Controllers/userController'); 
const EventController = require('../LinkSQL/Controllers/eventController');
const GastosController = require('../LinkSQL/Controllers/gastosController');
const FriendController = require('../LinkSQL/Controllers/friendController'); 


function protegerRota(req, res, next) {
    if (!req.session.usuarioLogado) {
        return res.status(403).json({ ok: false, msg: "Usuário não está logado" });
    }
    next();
}

app.use(session({
    secret: 'chave-secreta-do-checkpoint',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// Configuração de Pasta Estática
const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

// --- ROTAS DE USUÁRIOS ---
app.post('/users/cadastro', UserController.cadastrar);
app.post('/users/login', UserController.login);
app.post('/users/recuperar', UserController.recuperar);
app.post('/users/verificar', UserController.verificar);
app.post('/users/editar_perfil', protegerRota, UserController.editar_perfil);
app.post('/users/saldo', protegerRota, UserController.saldo);
app.get('/users/sessao', (req, res) => {
    res.json(req.session.usuarioLogado ? { logado: true, usuario: req.session.usuarioLogado } : { logado: false });
});
app.get('/users/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/index.html');
});
app.post("/events/participante", protegerRota, EventController.gerenciarParticipante);
app.post("/events/divisao-manual", protegerRota, EventController.salvarDivisaoManual);
app.post("/events/responder", protegerRota, EventController.responderConvite);
// --- ROTAS SOCIAIS (AMIGOS) ---
app.get('/friends/search', protegerRota, FriendController.buscarUsuarios);
app.post('/friends/request', protegerRota, FriendController.enviarSolicitacao);
app.get('/friends/list', protegerRota, FriendController.listarMeusAmigos);
app.post('/friends/accept', protegerRota, FriendController.aceitarAmizade);

// --- ROTAS DE EVENTOS ---
app.post("/events/criar", protegerRota, EventController.criar);
app.post("/events/excluir", protegerRota, EventController.excluir);
app.get("/events", protegerRota, EventController.listarEventos);
app.get("/events/quantidade", protegerRota, EventController.quantidade);
app.get("/events/:id", protegerRota, EventController.buscarEvento);

// --- ROTAS DE GASTOS ---
app.post('/gastos/novo', protegerRota, GastosController.novoGasto);
app.get('/gastos/listar', protegerRota, GastosController.listar);
app.post('/gastos/deletar', protegerRota, GastosController.deletar);
app.post('/gastos/editar', protegerRota, GastosController.editar);

app.set('port', 4000);

module.exports = app;