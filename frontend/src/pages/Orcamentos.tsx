
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import "./Clientes.css";

type Cliente = {
  id: number;
  nome: string;
};

type Orcamento = {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  titulo: string;
  descricao: string | null;
  valor: number | string;
  status: string;
};

const API = "http://localhost:3000/api";

const campo: CSSProperties = {
  width: "100%",
  padding: 12,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  marginTop: 6,
  backgroundColor: "#fff"
};

const botao: CSSProperties = {
  padding: "12px 18px",
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  cursor: "pointer"
};

const statusEstilos: Record<string, CSSProperties> = {
  Pendente: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
  },
  Aprovado: {
    backgroundColor: "#dcfce7",
    color: "#166534"
  },
  Recusado: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  }
};

function formatarValor(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState("Pendente");

  async function carregarDados() {
    try {
      const [resOrcamentos, resClientes] = await Promise.all([
        fetch(`${API}/orcamentos`),
        fetch(`${API}/clientes`)
      ]);

      if (!resOrcamentos.ok || !resClientes.ok) {
        throw new Error("Erro ao carregar dados.");
      }

      const dadosOrcamentos: Orcamento[] =
        await resOrcamentos.json();

      const dadosClientes: Cliente[] =
        await resClientes.json();

      setOrcamentos(dadosOrcamentos);
      setClientes(dadosClientes);
      setErro("");
    } catch {
      setErro("Não foi possível carregar os orçamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function limparFormulario() {
    setIdEdicao(null);
    setClienteId("");
    setTitulo("");
    setDescricao("");
    setValor("");
    setStatus("Pendente");
    setMostrarFormulario(false);
  }

  function novoOrcamento() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function editarOrcamento(orcamento: Orcamento) {
    setIdEdicao(orcamento.id);
    setClienteId(String(orcamento.cliente_id));
    setTitulo(orcamento.titulo);
    setDescricao(orcamento.descricao || "");
    setValor(String(orcamento.valor));
    setStatus(orcamento.status);
    setMostrarFormulario(true);
    setErro("");
    setMensagem("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarOrcamento(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setMensagem("");

    if (!clienteId || !titulo.trim()) {
      setErro("Selecione um cliente e informe o título do orçamento.");
      return;
    }

    const valorNumerico =
      valor.trim() === "" ? 0 : Number(valor);

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 0
    ) {
      setErro("Informe um valor válido, maior ou igual a zero.");
      return;
    }

    setSalvando(true);

    const editando = idEdicao !== null;

    try {
      const resposta = await fetch(
        editando
          ? `${API}/orcamentos/${idEdicao}`
          : `${API}/orcamentos`,
        {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cliente_id: Number(clienteId),
            titulo: titulo.trim(),
            descricao,
            valor: valorNumerico,
            status
          })
        }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);

        throw new Error(
          dados?.message ||
          "Não foi possível salvar o orçamento."
        );
      }

      await carregarDados();
      limparFormulario();

      setMensagem(
        editando
          ? "Orçamento atualizado com sucesso!"
          : "Orçamento cadastrado com sucesso!"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o orçamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirOrcamento(orcamento: Orcamento) {
    const confirmado = window.confirm(
      `Deseja realmente excluir o orçamento "${orcamento.titulo}"?`
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(
        `${API}/orcamentos/${orcamento.id}`,
        { method: "DELETE" }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);

        throw new Error(
          dados?.message ||
          "Não foi possível excluir o orçamento."
        );
      }

      if (idEdicao === orcamento.id) {
        limparFormulario();
      }

      await carregarDados();
      setMensagem("Orçamento excluído com sucesso!");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o orçamento."
      );
    }
  }

  const orcamentosFiltrados = orcamentos.filter((orcamento) => {
    const termo = pesquisa.toLocaleLowerCase("pt-BR").trim();

    const correspondePesquisa =
      orcamento.titulo
        .toLocaleLowerCase("pt-BR")
        .includes(termo) ||
      (orcamento.cliente_nome || "")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      orcamento.status === filtroStatus;

    return correspondePesquisa && correspondeStatus;
  });

  return (
    <section>
      <header className="header">
        <h2>Orçamentos</h2>
        <p>Gerencie os orçamentos enviados aos clientes</p>
      </header>

      <div style={{ marginTop: 30 }}>
        <button
          type="button"
          onClick={novoOrcamento}
          style={botao}
        >
          + Novo orçamento
        </button>
      </div>

      {erro && (
        <p
          role="alert"
          style={{ color: "#dc2626", marginTop: 15 }}
        >
          {erro}
        </p>
      )}

      {mensagem && (
        <p
          role="status"
          style={{ color: "#15803d", marginTop: 15 }}
        >
          {mensagem}
        </p>
      )}

      {mostrarFormulario && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>
            {idEdicao !== null
              ? "Editar orçamento"
              : "Novo orçamento"}
          </h3>

          <form
            onSubmit={salvarOrcamento}
            style={{
              display: "grid",
              gap: 18,
              marginTop: 20
            }}
          >
            <label>
              Cliente
              <select
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                style={campo}
              >
                <option value="">Selecione um cliente</option>

                {clientes.map((cliente) => (
                  <option
                    key={cliente.id}
                    value={cliente.id}
                  >
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Título do orçamento
              <input
                required
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Descrição
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Valor (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={campo}
              >
                <option value="Pendente">Pendente</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Recusado">Recusado</option>
              </select>
            </label>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <button
                type="submit"
                disabled={salvando}
                style={botao}
              >
                {salvando
                  ? "Salvando..."
                  : idEdicao !== null
                    ? "Salvar alterações"
                    : "Cadastrar orçamento"}
              </button>

              <button
                type="button"
                onClick={limparFormulario}
                disabled={salvando}
                style={{
                  padding: "12px 18px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 30 }}>
        <h3>Orçamentos cadastrados</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 14,
            marginTop: 20
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#475569"
            }}
          >
            Pesquisar
            <input
              type="search"
              placeholder="Orçamento ou cliente..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              style={campo}
            />
          </label>

          <label
            style={{
              fontSize: 14,
              color: "#475569"
            }}
          >
            Filtrar por status
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={campo}
            >
              <option value="Todos">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Recusado">Recusado</option>
            </select>
          </label>
        </div>

        {!carregando && orcamentos.length > 0 && (
          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              marginTop: 16
            }}
          >
            {orcamentosFiltrados.length} de {orcamentos.length} orçamentos
          </p>
        )}

        {carregando ? (
          <p>Carregando orçamentos...</p>
        ) : orcamentos.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhum orçamento cadastrado.
          </p>
        ) : orcamentosFiltrados.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhum orçamento encontrado para os filtros selecionados.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: 20
            }}
          >
            <table className="clientes-tabela">
              <thead>
                <tr>
                  <th>Orçamento</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {orcamentosFiltrados.map((orcamento) => (
                  <tr key={orcamento.id}>
                    <td>{orcamento.titulo}</td>
                    <td>{orcamento.cliente_nome}</td>
                    <td>{formatarValor(orcamento.valor)}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          ...(
                            statusEstilos[orcamento.status] || {
                              backgroundColor: "#f1f5f9",
                              color: "#475569"
                            }
                          )
                        }}
                      >
                        {orcamento.status}
                      </span>
                    </td>

                    <td>
                      <div className="clientes-acoes">
                        <button
                          type="button"
                          className="clientes-btn-editar"
                          onClick={() =>
                            editarOrcamento(orcamento)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="clientes-btn-excluir"
                          onClick={() =>
                            excluirOrcamento(orcamento)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Orcamentos;
