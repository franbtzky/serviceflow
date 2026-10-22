
import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT os.*, c.nome AS cliente_nome
      FROM ordens_servico os
      JOIN clientes c ON c.id = os.cliente_id
      ORDER BY os.id DESC
    `);

    res.json(rows);
  } catch {
    res.status(500).json({ erro: "Erro ao listar ordens" });
  }
});

router.post("/", async (req, res) => {
  const { cliente_id, titulo, descricao, valor, status } = req.body;

  if (!cliente_id || !titulo?.trim()) {
    res.status(400).json({ erro: "Cliente e título são obrigatórios" });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO ordens_servico
       (cliente_id, titulo, descricao, valor, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente_id,
        titulo,
        descricao || "",
        valor ?? 0,
        status || "Pendente"
      ]
    );

    res.status(201).json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao cadastrar ordem" });
  }
});

router.put("/:id", async (req, res) => {
  const { cliente_id, titulo, descricao, valor, status } = req.body;

  if (!cliente_id || !titulo?.trim()) {
    res.status(400).json({ erro: "Cliente e título são obrigatórios" });
    return;
  }

  try {
    const [result] = await pool.execute(
      `UPDATE ordens_servico
       SET cliente_id = ?, titulo = ?, descricao = ?,
           valor = ?, status = ?
       WHERE id = ?`,
      [
        cliente_id,
        titulo,
        descricao || "",
        valor ?? 0,
        status || "Pendente",
        req.params.id
      ]
    );

    res.json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao atualizar ordem" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM ordens_servico WHERE id = ?",
      [req.params.id]
    );

    res.json(result);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir ordem" });
  }
});

export default router;
