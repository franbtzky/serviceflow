
import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, c.nome AS cliente_nome
      FROM orcamentos o
      JOIN clientes c ON c.id = o.cliente_id
      ORDER BY o.id DESC
    `);

    res.json(rows);
  } catch {
    res.status(500).json({ erro: "Erro ao listar orçamentos" });
  }
});

router.post("/", async (req, res) => {
  const { cliente_id, titulo, descricao, valor, status } = req.body;

  if (!cliente_id || typeof titulo !== "string" || !titulo.trim()) {
    res.status(400).json({
      erro: "Cliente e título são obrigatórios"
    });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO orcamentos
       (cliente_id, titulo, descricao, valor, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente_id,
        titulo.trim(),
        descricao || "",
        valor ?? 0,
        status || "Pendente"
      ]
    );

    res.status(201).json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao cadastrar orçamento" });
  }
});

router.put("/:id", async (req, res) => {
  const { cliente_id, titulo, descricao, valor, status } = req.body;

  if (!cliente_id || typeof titulo !== "string" || !titulo.trim()) {
    res.status(400).json({
      erro: "Cliente e título são obrigatórios"
    });
    return;
  }

  try {
    const [result] = await pool.execute(
      `UPDATE orcamentos
       SET cliente_id = ?, titulo = ?, descricao = ?,
           valor = ?, status = ?
       WHERE id = ?`,
      [
        cliente_id,
        titulo.trim(),
        descricao || "",
        valor ?? 0,
        status || "Pendente",
        req.params.id
      ]
    );

    res.json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao atualizar orçamento" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM orcamentos WHERE id = ?",
      [req.params.id]
    );

    res.json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir orçamento" });
  }
});

export default router;
