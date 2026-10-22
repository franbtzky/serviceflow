
import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

const tiposValidos = ["Receita", "Despesa"];
const statusValidos = ["Pendente", "Pago"];

function validarLancamento(dados: any) {
  const {
    descricao,
    tipo,
    categoria,
    valor,
    data_vencimento,
    status
  } = dados;

  if (
    typeof descricao !== "string" ||
    !descricao.trim() ||
    !tiposValidos.includes(tipo) ||
    typeof categoria !== "string" ||
    !categoria.trim() ||
    valor === "" ||
    valor === null ||
    valor === undefined ||
    !Number.isFinite(Number(valor)) ||
    Number(valor) <= 0 ||
    typeof data_vencimento !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data_vencimento) ||
    !statusValidos.includes(status)
  ) {
    return false;
  }

  return true;
}

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        descricao,
        tipo,
        categoria,
        valor,
        DATE_FORMAT(data_vencimento, '%Y-%m-%d') AS data_vencimento,
        status,
        data_criacao
      FROM financeiro
      ORDER BY data_vencimento DESC, id DESC
    `);

    res.json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao listar lançamentos financeiros"
    });
  }
});

router.post("/", async (req, res) => {
  if (!validarLancamento(req.body)) {
    res.status(400).json({
      erro: "Preencha corretamente os campos obrigatórios"
    });
    return;
  }

  const {
    descricao,
    tipo,
    categoria,
    valor,
    data_vencimento,
    status
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO financeiro
       (descricao, tipo, categoria, valor, data_vencimento, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        descricao.trim(),
        tipo,
        categoria.trim(),
        Number(valor),
        data_vencimento,
        status
      ]
    );

    res.status(201).json(result);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao cadastrar lançamento"
    });
  }
});

router.put("/:id", async (req, res) => {
  if (!validarLancamento(req.body)) {
    res.status(400).json({
      erro: "Preencha corretamente os campos obrigatórios"
    });
    return;
  }

  const {
    descricao,
    tipo,
    categoria,
    valor,
    data_vencimento,
    status
  } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE financeiro
       SET descricao = ?, tipo = ?, categoria = ?,
           valor = ?, data_vencimento = ?, status = ?
       WHERE id = ?`,
      [
        descricao.trim(),
        tipo,
        categoria.trim(),
        Number(valor),
        data_vencimento,
        status,
        req.params.id
      ]
    );

    res.json(result);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao atualizar lançamento"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM financeiro WHERE id = ?",
      [req.params.id]
    );

    res.json(result);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao excluir lançamento"
    });
  }
});

router.get("/resumo/totais", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(
          CASE WHEN tipo = 'Receita' AND status = 'Pago'
          THEN valor ELSE 0 END
        ), 0) AS receitas_recebidas,

        COALESCE(SUM(
          CASE WHEN tipo = 'Despesa' AND status = 'Pago'
          THEN valor ELSE 0 END
        ), 0) AS despesas_pagas,

        COALESCE(SUM(
          CASE WHEN tipo = 'Receita' AND status = 'Pendente'
          THEN valor ELSE 0 END
        ), 0) AS receitas_pendentes,

        COALESCE(SUM(
          CASE WHEN tipo = 'Despesa' AND status = 'Pendente'
          THEN valor ELSE 0 END
        ), 0) AS despesas_pendentes
      FROM financeiro
    `);

    const dados = (rows as any[])[0];

    res.json({
      ...dados,
      saldo:
        Number(dados.receitas_recebidas) -
        Number(dados.despesas_pagas)
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao calcular resumo financeiro"
    });
  }
});

export default router;
