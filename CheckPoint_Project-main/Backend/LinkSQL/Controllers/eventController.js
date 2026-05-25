const Event = require('../Models/Event');
const Gasto = require('../Models/Gasto');

module.exports = {
    criar: async (req, res) => {
        try {
            const { nomeEvento, valorEvento, dataEvento, localEvento, QuantParticipantes } = req.body;
            const idUser = req.session.usuarioLogado._id;

            const novoEvento = new Event({
                fk_idUsuario: idUser,
                nomeEvento,
                dataEvento,
                localEvento,
                QuantParticipantes: QuantParticipantes || 1
            });
            const salvo = await novoEvento.save();

            // Limpeza de valor para o Gasto
            let valorLimpo = 0;
            if (valorEvento) {
                valorLimpo = parseFloat(String(valorEvento).replace("R$", "").replace(/\./g, "").replace(",", "."));
            }

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
            const eventos = await Event.find({ fk_idUsuario: req.session.usuarioLogado._id }).sort({ dataEvento: -1 });
            res.json({ ok: true, eventos });
        } catch (err) {
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
            const evento = await Event.findById(id);
            if (!evento) return res.status(404).json({ ok: false, msg: "Não encontrado" });

            const gasto = await Gasto.findOne({ fk_idEvento: id });
            res.json({ ok: true, evento, gasto: gasto || { valorGasto: 0 } });
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