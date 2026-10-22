
import express from "express";
import cors from "cors";
import { pool } from "./config/database";
import clientesRoutes from "./routes/clientes.routes";
import ordensRoutes from "./routes/ordens.routes";
import orcamentosRoutes from "./routes/orcamentos.routes";
import financeiroRoutes from "./routes/financeiro.routes";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/financeiro", financeiroRoutes);

// Verificar se a API está funcionando
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "ServiceFlow API funcionando!"
  });
});

// Testar a conexão com o MySQL
app.get("/api/database-test", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS conectado");

    res.json({
      status: "ok",
      message: "Conexão com MySQL realizada com sucesso!",
      resultado: rows
    });
  } catch (error) {
    console.error("Erro ao conectar ao MySQL:", error);

    res.status(500).json({
      status: "erro",
      message: "Não foi possível conectar ao banco de dados."
    });
  }
});

// Registrar as rotas de clientes
app.use("/api/clientes", clientesRoutes);
app.use("/api/ordens", ordensRoutes);
app.use("/api/orcamentos", orcamentosRoutes);
// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
