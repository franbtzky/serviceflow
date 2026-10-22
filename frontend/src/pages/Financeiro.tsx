
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import "./Clientes.css";

type Lancamento = {
  id: number;
  descricao: string;
  tipo: "Receita" | "Despesa";
  categoria: string;
  valor: number | string;
  data_vencimento: string;
  status: "Pendente" | "Pago";
};

type Resumo = {
  receitas_recebidas: number | string;
  despesas_pagas: number | string;
  receitas_pendentes: number | string;
  despesas_pendentes: number | string;
  saldo: number | string;
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
  color: "#fff",
  cursor: "pointer"
};

const estiloEtiqueta: CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap"
};

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] = data.slice(0, 10).split("-");

  if (!ano || !mes || !dia) return "-";

  return `${dia}/${mes}/${ano}`;
}

function Financeiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"Receita" | "Despesa">("Receita");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState<"Pendente" | "Pago">("Pendente");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  async function carregarDados() {
    try {
      const [resLancamentos, resResumo] = await Promise.all([
        fetch(`${API}/financeiro`),
        fetch(`${API}/financeiro/resumo/totais`)
      ]);

      if (!resLancamentos.ok || !resResumo.ok) {
        throw new Error("Erro ao carregar dados.");
      }

      const dadosLancamentos: Lancamento[] =
        await resLancamentos.json();

      const dadosResumo: Resumo =
        await resResumo.json();

      setLancamentos(dadosLancamentos);
      setResumo(dadosResumo);
      setErro("");
    } catch {
      setErro("Não foi possível carregar os dados financeiros.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function limparFormulario() {
    setIdEdicao(null);
    setDescricao("");
    setTipo("Receita");
    setCategoria("");
    setValor("");
    setDataVencimento("");
    setStatus("Pendente");
    setMostrarFormulario(false);
  }

  function novoLancamento() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function editarLancamento(lancamento: Lancamento) {
    setIdEdicao(lancamento.id);
    setDescricao(lancamento.descricao);
    setTipo(lancamento.tipo);
    setCategoria(lancamento.categoria);
    setValor(String(lancamento.valor));
    setDataVencimento(lancamento.data_vencimento.slice(0, 10));
    setStatus(lancamento.status);
    setMostrarFormulario(true);
    setErro("");
    setMensagem("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarLancamento(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setMensagem("");

    if (!descricao.trim()) {
      setErro("Informe a descrição do lançamento.");
      return;
    }

    if (!categoria.trim()) {
      setErro("Informe a categoria do lançamento.");
      return;
    }

    const valorNumerico = Number(valor);

    if (
      valor.trim() === "" ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0
    ) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    if (!dataVencimento) {
      setErro("Informe a data de vencimento.");
      return;
    }

    setSalvando(true);

    const editando = idEdicao !== null;

    try {
      const resposta = await fetch(
        editando
          ? `${API}/financeiro/${idEdicao}`
          : `${API}/financeiro`,
        {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            descricao: descricao.trim(),
            tipo,
            categoria: categoria.trim(),
            valor: valorNumerico,
            data_vencimento: dataVencimento,
            status
          })
        }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);

        throw new Error(
          dados?.message ||
          "Não foi possível salvar o lançamento."
        );
      }

      await carregarDados();
      limparFormulario();

      setMensagem(
        editando
          ? "Lançamento atualizado com sucesso!"
          : "Lançamento cadastrado com sucesso!"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o lançamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirLancamento(lancamento: Lancamento) {
    const confirmado = window.confirm(
      `Deseja excluir "${lancamento.descricao}"?`
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(
        `${API}/financeiro/${lancamento.id}`,
        { method: "DELETE" }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);

        throw new Error(
          dados?.message ||
          "Não foi possível excluir o lançamento."
        );
      }

      if (idEdicao === lancamento.id) {
        limparFormulario();
      }

      await carregarDados();
      setMensagem("Lançamento excluído com sucesso!");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o lançamento."
      );
    }
  }

  function limparFiltros() {
    setPesquisa("");
    setFiltroTipo("Todos");
    setFiltroStatus("Todos");
    setDataInicio("");
    setDataFim("");
  }

  const periodoInvalido =
    dataInicio !== "" &&
    dataFim !== "" &&
    dataInicio > dataFim;

  const lancamentosFiltrados = lancamentos.filter((lancamento) => {
    const termo = pesquisa.toLocaleLowerCase("pt-BR").trim();

    const correspondePesquisa =
      lancamento.descricao
        .toLocaleLowerCase("pt-BR")
        .includes(termo) ||
      (lancamento.categoria || "")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);

    const correspondeTipo =
      filtroTipo === "Todos" ||
      lancamento.tipo === filtroTipo;

    const correspondeStatus =
      filtroStatus === "Todos" ||
      lancamento.status === filtroStatus;

    const data = lancamento.data_vencimento.slice(0, 10);

    const correspondeInicio =
      !dataInicio || data >= dataInicio;

    const correspondeFim =
      !dataFim || data <= dataFim;

    return (
      correspondePesquisa &&
      correspondeTipo &&
      correspondeStatus &&
      correspondeInicio &&
      correspondeFim &&
      !periodoInvalido
    );
  });

  const indicadores = [
    {
      titulo: "Receitas recebidas",
      valor: resumo?.receitas_recebidas ?? 0
    },
    {
      titulo: "Despesas pagas",
      valor: resumo?.despesas_pagas ?? 0
    },
    {
      titulo: "Saldo atual",
      valor: resumo?.saldo ?? 0
    },
    {
      titulo: "A receber",
      valor: resumo?.receitas_pendentes ?? 0
    },
    {
      titulo: "A pagar",
      valor: resumo?.despesas_pendentes ?? 0
    }
  ];

  return (
    <section>
      <header className="header">
        <h2>Financeiro</h2>
        <p>Controle as receitas e despesas do seu negócio</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: 16,
          marginTop: 30
        }}
      >
        {indicadores.map((indicador) => (
          <div className="card" key={indicador.titulo}>
            <h3>{indicador.titulo}</h3>
            <p className="card-number">
              {carregando
                ? "..."
                : formatarMoeda(indicador.valor)}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <button
          type="button"
          onClick={novoLancamento}
          style={botao}
        >
          + Novo lançamento
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
              ? "Editar lançamento"
              : "Novo lançamento"}
          </h3>

          <form
            onSubmit={salvarLancamento}
            style={{
              display: "grid",
              gap: 18,
              marginTop: 20
            }}
          >
            <label>
              Descrição
              <input
                required
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Tipo
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target.value as "Receita" | "Despesa"
                  )
                }
                style={campo}
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
            </label>

            <label>
              Categoria
              <input
                required
                type="text"
                placeholder="Ex.: Serviços, Equipamentos, Aluguel"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Valor (R$)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Data de vencimento
              <input
                required
                type="date"
                value={dataVencimento}
                onChange={(e) =>
                  setDataVencimento(e.target.value)
                }
                style={campo}
              />
            </label>

            <label>
              Situação
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "Pendente" | "Pago"
                  )
                }
                style={campo}
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
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
                    : "Cadastrar lançamento"}
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={limparFormulario}
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
        <h3>Histórico financeiro</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
            gap: 14,
            marginTop: 20
          }}
        >
          <label style={{ fontSize: 14, color: "#475569" }}>
            Pesquisar
            <input
              type="search"
              placeholder="Descrição ou categoria..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              style={campo}
            />
          </label>

          <label style={{ fontSize: 14, color: "#475569" }}>
            Tipo
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={campo}
            >
              <option value="Todos">Todos os tipos</option>
              <option value="Receita">Receitas</option>
              <option value="Despesa">Despesas</option>
            </select>
          </label>

          <label style={{ fontSize: 14, color: "#475569" }}>
            Situação
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={campo}
            >
              <option value="Todos">Todas as situações</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </label>

          <label style={{ fontSize: 14, color: "#475569" }}>
            Vencimento a partir de
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={campo}
            />
          </label>

          <label style={{ fontSize: 14, color: "#475569" }}>
            Vencimento até
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={campo}
            />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={limparFiltros}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            Limpar filtros
          </button>
        </div>

        {periodoInvalido && (
          <p
            role="alert"
            style={{ color: "#dc2626", marginTop: 14 }}
          >
            A data inicial não pode ser posterior à data final.
          </p>
        )}

        {!carregando && lancamentos.length > 0 && (
          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              marginTop: 16
            }}
          >
            {lancamentosFiltrados.length} de {lancamentos.length} lançamentos
          </p>
        )}

        {carregando ? (
          <p>Carregando lançamentos...</p>
        ) : lancamentos.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhum lançamento cadastrado.
          </p>
        ) : periodoInvalido ? null : lancamentosFiltrados.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            Nenhum lançamento encontrado para os filtros selecionados.
          </p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table className="clientes-tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {lancamentosFiltrados.map((lancamento) => (
                  <tr key={lancamento.id}>
                    <td>{lancamento.descricao}</td>

                    <td>
                      <span
                        style={{
                          ...estiloEtiqueta,
                          backgroundColor:
                            lancamento.tipo === "Receita"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            lancamento.tipo === "Receita"
                              ? "#166534"
                              : "#991b1b"
                        }}
                      >
                        {lancamento.tipo}
                      </span>
                    </td>

                    <td>{lancamento.categoria}</td>

                    <td>{formatarMoeda(lancamento.valor)}</td>

                    <td>
                      {formatarData(lancamento.data_vencimento)}
                    </td>

                    <td>
                      <span
                        style={{
                          ...estiloEtiqueta,
                          backgroundColor:
                            lancamento.status === "Pago"
                              ? "#dbeafe"
                              : "#fef3c7",
                          color:
                            lancamento.status === "Pago"
                              ? "#1d4ed8"
                              : "#92400e"
                        }}
                      >
                        {lancamento.status}
                      </span>
                    </td>

                    <td>
                      <div className="clientes-acoes">
                        <button
                          type="button"
                          className="clientes-btn-editar"
                          onClick={() =>
                            editarLancamento(lancamento)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="clientes-btn-excluir"
                          onClick={() =>
                            excluirLancamento(lancamento)
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

export default Financeiro;
