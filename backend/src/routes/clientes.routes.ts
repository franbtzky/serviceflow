
import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

function cpfValido(valor: string): boolean {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  for (let posicao = 9; posicao <= 10; posicao++) {
    let soma = 0;

    for (let i = 0; i < posicao; i++) {
      soma += Number(cpf[i]) * (posicao + 1 - i);
    }

    const resto = (soma * 10) % 11;
    const digito = resto === 10 ? 0 : resto;

    if (digito !== Number(cpf[posicao])) {
      return false;
    }
  }

  return true;
}

function cnpjValido(valor: string): boolean {
  const cnpj = somenteNumeros(valor);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce(
        (total, numero, indice) =>
          total + Number(numero) * pesos[indice],
        0
      );

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  const segundo = calcularDigito(
    cnpj.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return (
    primeiro === Number(cnpj[12]) &&
    segundo === Number(cnpj[13])
  );
}

function validarCliente(dados: any): string | null {
  const { nome, email, telefone, documento } = dados;

  if (typeof nome !== "string" || !nome.trim()) {
    return "O nome do cliente é obrigatório.";
  }

  if (nome.trim().length > 150) {
    return "O nome é muito longo.";
  }

  if (email != null && typeof email !== "string") {
    return "E-mail inválido.";
  }

  if (telefone != null && typeof telefone !== "string") {
    return "Telefone inválido.";
  }

  if (documento != null && typeof documento !== "string") {
    return "CPF/CNPJ inválido.";
  }

  if (email?.trim()) {
    const emailLimpo = email.trim();

    if (
      emailLimpo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
    ) {
      return "Informe um e-mail válido.";
    }
  }

  if (telefone?.trim()) {
    const numeros = somenteNumeros(telefone);

    if (
      !/^\d{10,11}$/.test(numeros) ||
      numeros.slice(0, 2) === "00" ||
      Number(numeros.slice(0, 2)) < 11
    ) {
      return "Informe um telefone com DDD e 10 ou 11 dígitos.";
    }
  }

  if (documento?.trim()) {
    const numeros = somenteNumeros(documento);

    if (
      numeros.length !== 11 &&
      numeros.length !== 14
    ) {
      return "O documento deve ter 11 dígitos (CPF) ou 14 (CNPJ).";
    }

    if (
      (numeros.length === 11 && !cpfValido(numeros)) ||
      (numeros.length === 14 && !cnpjValido(numeros))
    ) {
      return "CPF ou CNPJ inválido.";
    }
  }

  return null;
}

router.get("/", async (_req, res) => {
  try {
    const [clientes] = await pool.query(
      "SELECT * FROM clientes ORDER BY id DESC"
    );

    res.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({
      message: "Erro ao buscar clientes."
    });
  }
});

router.post("/", async (req, res) => {
  const erro = validarCliente(req.body);

  if (erro) {
    res.status(400).json({ message: erro });
    return;
  }

  const { nome, email, telefone, documento } = req.body;

  try {
    const [resultado] = await pool.execute(
      `INSERT INTO clientes (nome, email, telefone, documento)
       VALUES (?, ?, ?, ?)`,
      [
        nome.trim(),
        email?.trim() || null,
        telefone ? somenteNumeros(telefone) : null,
        documento ? somenteNumeros(documento) : null
      ]
    );

    res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      resultado
    });
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    res.status(500).json({
      message: "Erro ao cadastrar cliente."
    });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "ID inválido." });
    return;
  }

  const erro = validarCliente(req.body);

  if (erro) {
    res.status(400).json({ message: erro });
    return;
  }

  const { nome, email, telefone, documento } = req.body;

  try {
    const [resultado] = await pool.execute(
      `UPDATE clientes
       SET nome = ?, email = ?, telefone = ?, documento = ?
       WHERE id = ?`,
      [
        nome.trim(),
        email?.trim() || null,
        telefone ? somenteNumeros(telefone) : null,
        documento ? somenteNumeros(documento) : null,
        id
      ]
    );

    const dados = resultado as { affectedRows: number };

    if (dados.affectedRows === 0) {
      res.status(404).json({
        message: "Cliente não encontrado."
      });
      return;
    }

    res.json({
      message: "Cliente atualizado com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({
      message: "Erro ao atualizar cliente."
    });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "ID inválido." });
    return;
  }

  try {
    const [resultado] = await pool.execute(
      "DELETE FROM clientes WHERE id = ?",
      [id]
    );

    const dados = resultado as { affectedRows: number };

    if (dados.affectedRows === 0) {
      res.status(404).json({
        message: "Cliente não encontrado."
      });
      return;
    }

    res.json({
      message: "Cliente excluído com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).json({
      message: "Não foi possível excluir o cliente. Verifique se existem ordens ou orçamentos vinculados."
    });
  }
});

export default router;
