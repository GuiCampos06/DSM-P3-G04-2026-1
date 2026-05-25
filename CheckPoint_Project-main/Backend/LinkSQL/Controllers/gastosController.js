const Gasto = require('../Models/Gasto');
const mongoose = require('mongoose');

module.exports = {
    // 1. Criar novo gasto
    novoGasto: async (req, res) => {
        try {
            const { valor, categoria, descricao } = req.body;
            const novo = new Gasto({
                fk_idUsuario: req.session.usuarioLogado._id,
                valorGasto: valor,
                categoria,
                descricao
            });
            await novo.save();
            res.json({ ok: true, msg: "Gasto registrado!" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, msg: "Erro ao salvar." });
        }
    },

    // 2. Listar gastos + Totais + Gráficos (Dashboard)
    listar: async (req, res) => {
        try {
            const idUser = new mongoose.Types.ObjectId(req.session.usuarioLogado._id);
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            // A. Lista dos últimos 20 gastos
            const listaGastos = await Gasto.find({ fk_idUsuario: idUser })
                .sort({ dataGasto: -1 })
                .limit(20);

            // B. Total gasto no mês atual (Soma)
            const totalMesAgg = await Gasto.aggregate([
                { $match: { fk_idUsuario: idUser, dataGasto: { $gte: inicioMes } } },
                { $group: { _id: null, total: { $sum: "$valorGasto" } } }
            ]);

            // C. Gráfico de Pizza (Soma por Categoria)
            const pizzaAgg = await Gasto.aggregate([
                { $match: { fk_idUsuario: idUser } },
                { $group: { _id: "$categoria", total: { $sum: "$valorGasto" } } }
            ]);

            // D. Gráfico de Linha (Soma por Mês - Últimos 6 meses)
            const linhaAgg = await Gasto.aggregate([
                { $match: { fk_idUsuario: idUser } },
                {
                    $group: {
                        _id: { mes: { $month: "$dataGasto" }, ano: { $year: "$dataGasto" } },
                        total: { $sum: "$valorGasto" }
                    }
                },
                { $sort: { "_id.ano": 1, "_id.mes": 1 } },
                { $limit: 6 }
            ]);

            res.json({
                ok: true,
                gastos: listaGastos.map(g => ({
                    _id: g._id,
                    valorGasto: g.valorGasto,
                    categoria: g.categoria,
                    descricao: g.descricao,
                    dataFormatada: g.dataGasto.toLocaleDateString('pt-BR')
                })),
                total: totalMesAgg[0]?.total || 0,
                renda: req.session.usuarioLogado.Valor || 0,
                dadosPizza: pizzaAgg.map(p => ({ categoria: p._id, total: p.total })),
                dadosGrafico: linhaAgg.map(l => ({ mes: l._id.mes, total: l.total }))
            });

        } catch (err) {
            console.error("Erro na Dashboard:", err);
            res.status(500).json({ ok: false, msg: "Erro interno no servidor" });
        }
    },
    
    deletar: async (req, res) => {
        try {
            await Gasto.findByIdAndDelete(req.body.idDespesa);
            res.json({ ok: true, msg: "Removido!" });
        } catch (err) {
            res.status(500).json({ ok: false });
        }
    },

    editar: async (req, res) => {
        try {
            const { idDespesa, valor, categoria, descricao } = req.body;
            await Gasto.findByIdAndUpdate(idDespesa, {
                valorGasto: valor,
                categoria,
                descricao
            });
            res.json({ ok: true, msg: "Atualizado!" });
        } catch (err) {
            res.status(500).json({ ok: false });
        }
    }
};