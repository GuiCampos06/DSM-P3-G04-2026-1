
const Event = require('../Models/Event');
const Gasto = require('../Models/Gasto');

module.exports = {
    criar: async (req, res) => {
        try {
            // Agora recebemos 'convidados' do corpo da requisição
            const { nomeEvento, valorEvento, dataEvento, localEvento, QuantParticipantes, convidados } = req.body;
            const idUser = req.session.usuarioLogado._id;

            const novoEvento = new Event({
                fk_idUsuario: idUser,
                nomeEvento,
                dataEvento,
                localEvento,
                QuantParticipantes: QuantParticipantes || 1,
                convidados: convidados || [] // Salva o array de IDs
            });
            
            const salvo = await novoEvento.save();

            let valorLimpo = parseFloat(String(valorEvento).replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
            
            await new Gasto({
                fk_idUsuario: idUser,
                fk_idEvento: salvo._id,
                valorGasto: valorLimpo,
                categoria: 'eventos',
                descricao: `Rolê: ${nomeEvento}`
            }).save();

            res.json({ ok: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, msg: "Erro ao criar evento." });
        }
    },

    listarEventos: async (req, res) => {
        try {
            const meuId = req.session.usuarioLogado._id;

            const eventos = await Event.find({
                $or: [
                    { fk_idUsuario: meuId }, // Eu criei
                    { convidados: meuId },   // Fui convidado
                    { confirmados: meuId }   // Já confirmei
                ]
            }).sort({ dataEvento: -1 });

            res.json({ ok: true, eventos, meuId });
        } catch (err) { res.status(500).json({ ok: false }); }
    },

    // Nova função para aceitar ou recusar
    responderConvite: async (req, res) => {
        try {
            const meuId = req.session.usuarioLogado._id;
            const { idEvento, acao } = req.body;

            console.log(`Usuário ${meuId} tentando ${acao} o evento ${idEvento}`);

            if (acao === 'aceitar') {
                // Remove dos convidados e coloca nos confirmados
                await Event.findByIdAndUpdate(idEvento, {
                    $pull: { convidados: meuId },
                    $addToSet: { confirmados: meuId }
                });
            } else {
                // Apenas remove de ambas as listas
                await Event.findByIdAndUpdate(idEvento, {
                    $pull: { convidados: meuId },
                    $pull: { confirmados: meuId }
                });
            }

            res.json({ ok: true });
        } catch (err) {
            console.error("Erro ao responder convite:", err);
            res.status(500).json({ ok: false });
        }
    },


    quantidade: async (req, res) => {
        try {
            const total = await Event.countDocuments({ fk_idUsuario: req.session.usuarioLogado._id });
            res.json({ ok: true, total });
        } catch (err) {
            res.status(500).json({ ok: false, total: 0 });
        }
    },

    buscarEvento: async (req, res) => {
        try {
            const id = req.params.id;
            // O populate('confirmados') traz o Nick e Nome de quem aceitou
            const evento = await Event.findById(id)
                .populate('fk_idUsuario', 'Nick')
                .populate('confirmados', 'Nick Nome');

            if (!evento) return res.status(404).json({ ok: false });

            // Busca o gasto original criado junto com o evento
            const gasto = await Gasto.findOne({ fk_idEvento: id });
            
            res.json({ 
                ok: true, 
                evento, 
                valorTotal: gasto ? gasto.valorGasto : 0 
            });
        } catch (err) {
            res.status(500).json({ ok: false });
        }
    },
    excluir: async (req, res) => {
        try {
            const id = req.body.id;
            await Event.findByIdAndDelete(id);
            // Também removemos o gasto associado para não sujar o financeiro
            await Gasto.deleteMany({ fk_idEvento: id });
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ ok: false });
        }
    }
};
