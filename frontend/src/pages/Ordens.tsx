
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import "./Clientes.css";

type Cliente = {
  id: number;
  nome: string;
};

type Ordem = {
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
  "Em andamento": {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8"
  },
  "Concluída": {
    backgroundColor: "#dcfce7",
    color: "#166534"
  }
};

function formatarValor(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function Ordens() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
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
      const [resOrdens, resClientes] = await Promise.all([
        fetch(`${API}/ordens`),
        fetch(`${API}/clientes`)
      ]);

      if (!resOrdens.ok || !resClientes.ok) {
        throw new Error("Erro ao carregar dados.");
      }

      const dadosOrdens: Ordem[] = await resOrdens.json();
      const dadosClientes: Cliente[] = await resClientes.json();

      setOrdens(dadosOrdens);
      setClientes(dadosClientes);
      setErro("");
    } catch {
      setErro("Não foi possível carregar as ordens de serviço.");
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

  function novaOrdem() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function editarOrdem(ordem: Ordem) {
    setIdEdicao(ordem.id);
    setClienteId(String(ordem.cliente_id));
    setTitulo(ordem.titulo);
    setDescricao(ordem.descricao || "");
    setValor(String(ordem.valor));
    setStatus(ordem.status);
    setMostrarFormulario(true);
    setErro("");
    setMensagem("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarOrdem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setErro("");
    setMensagem("");

    if (!clienteId || !titulo.trim()) {
      setErro("Selecione um cliente e informe o título do serviço.");
      return;
    }

    const valorNumerico = valor.trim() === "" ? 0 : Number(valor);

    if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
      setErro("Informe um valor válido, maior ou igual a zero.");
      return;
    }

    setSalvando(true);
    const editando = idEdicao !== null;

    try {
      const resposta = await fetch(
        editando
          ? `${API}/ordens/${idEdicao}`
          : `${API}/ordens`,
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
          dados?.message || "Não foi possível salvar a ordem."
        );
      }

      await carregarDados();
      limparFormulario();

      setMensagem(
        editando
          ? "Ordem atualizada com sucesso!"
          : "Ordem cadastrada com sucesso!"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a ordem."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirOrdem(ordem: Ordem) {
    const confirmado = window.confirm(
      `Deseja realmente excluir a ordem "${ordem.titulo}"?`
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(
        `${API}/ordens/${ordem.id}`,
        { method: "DELETE" }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        throw new Error(
          dados?.message || "Não foi possível excluir a ordem."
        );
      }

      if (idEdicao === ordem.id) {
        limparFormulario();
      }

      await carregarDados();
      setMensagem("Ordem excluída com sucesso!");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a ordem."
      );
    }
  }

  const ordensFiltradas = ordens.filter((ordem) => {
    const termo = pesquisa.toLocaleLowerCase("pt-BR").trim();

    const correspondePesquisa =
      ordem.titulo.toLocaleLowerCase("pt-BR").includes(termo) ||
      (ordem.cliente_nome || "")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      ordem.status === filtroStatus;

    return correspondePesquisa && correspondeStatus;
  });

  return (
    <section>
      <header className="header">
        <h2>Ordens de serviço</h2>
        <p>Gerencie os serviços realizados para seus clientes</p>
      </header>

      <div style={{ marginTop: 30 }}>
        <button
          type="button"
          onClick={novaOrdem}
          style={botao}
        >
          + Nova ordem
        </button>
      </div>

      {erro && (
        <p role="alert" style={{ color: "#dc2626", marginTop: 15 }}>
          {erro}
        </p>
      )}

      {mensagem && (
        <p role="status" style={{ color: "#15803d", marginTop: 15 }}>
          {mensagem}
        </p>
      )}

      {mostrarFormulario && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>
            {idEdicao !== null
              ? "Editar ordem de serviço"
              : "Nova ordem de serviço"}
          </h3>

          <form
            onSubmit={salvarOrdem}
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
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Título do serviço
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
                <option value="Em andamento">Em andamento</option>
                <option value="Concluída">Concluída</option>
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
                    : "Cadastrar ordem"}
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
        <h3>Ordens cadastradas</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 14,
            marginTop: 20
          }}
        >
          <label style={{ fontSize: 14, color: "#475569" }}>
            Pesquisar
            <input
              type="search"
              placeholder="Serviço ou cliente..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              style={campo}
            />
          </label>

          <label style={{ fontSize: 14, color: "#475569" }}>
            Filtrar por status
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={campo}
            >
              <option value="Todos">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluída">Concluída</option>
            </select>
          </label>
        </div>

        {!carregando && ordens.length > 0 && (
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 16 }}>
            {ordensFiltradas.length} de {ordens.length} ordens
          </p>
        )}

        {carregando ? (
          <p>Carregando ordens...</p>
        ) : ordens.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhuma ordem cadastrada.
          </p>
        ) : ordensFiltradas.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhuma ordem encontrada para os filtros selecionados.
          </p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table className="clientes-tabela">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {ordensFiltradas.map((ordem) => (
                  <tr key={ordem.id}>
                    <td>{ordem.titulo}</td>
                    <td>{ordem.cliente_nome}</td>
                    <td>{formatarValor(ordem.valor)}</td>
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
                            statusEstilos[ordem.status] || {
                              backgroundColor: "#f1f5f9",
                              color: "#475569"
                            }
                          )
                        }}
                      >
                        {ordem.status}
                      </span>
                    </td>
                    <td>
                      <div className="clientes-acoes">
                        <button
                          type="button"
                          className="clientes-btn-editar"
                          onClick={() => editarOrdem(ordem)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="clientes-btn-excluir"
                          onClick={() => excluirOrdem(ordem)}
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

export default Ordens;
