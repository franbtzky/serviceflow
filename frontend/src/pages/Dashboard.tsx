
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Cliente = {
  id: number;
};

type Ordem = {
  id: number;
  status: string;
};

type Orcamento = {
  id: number;
  status: string;
};

type Lancamento = {
  id: number;
  descricao: string;
  tipo: "Receita" | "Despesa";
  categoria: string;
  status: "Pendente" | "Pago";
  valor: number | string;
  data_vencimento: string;
};

type DadosDashboard = {
  clientes: Cliente[];
  ordens: Ordem[];
  orcamentos: Orcamento[];
  lancamentos: Lancamento[];
};

const API = "http://localhost:3000/api";

const cores = {
  azul: "#2563eb",
  verde: "#16a34a",
  vermelho: "#dc2626",
  amarelo: "#d97706",
  cinza: "#64748b"
};

const etiquetaBase: CSSProperties = {
  display: "inline-block",
  padding: "5px 10px",
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

function obterEstiloStatus(status: string): CSSProperties {
  switch (status) {
    case "Concluída":
    case "Aprovado":
      return {
        backgroundColor: "#dcfce7",
        color: "#166534"
      };

    case "Em andamento":
    case "Pago":
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8"
      };

    case "Recusado":
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b"
      };

    default:
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e"
      };
  }
}

function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard>({
    clientes: [],
    ordens: [],
    orcamentos: [],
    lancamentos: []
  });

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        const respostas = await Promise.all([
          fetch(`${API}/clientes`),
          fetch(`${API}/ordens`),
          fetch(`${API}/orcamentos`),
          fetch(`${API}/financeiro`)
        ]);

        if (respostas.some((resposta) => !resposta.ok)) {
          throw new Error("Erro ao carregar dados.");
        }

        const [
          clientes,
          ordens,
          orcamentos,
          lancamentos
        ] = await Promise.all([
          respostas[0].json() as Promise<Cliente[]>,
          respostas[1].json() as Promise<Ordem[]>,
          respostas[2].json() as Promise<Orcamento[]>,
          respostas[3].json() as Promise<Lancamento[]>
        ]);

        if (!ativo) return;

        setDados({
          clientes,
          ordens,
          orcamentos,
          lancamentos
        });

        setErro("");
      } catch {
        if (ativo) {
          setErro(
            "Não foi possível carregar os dados do Dashboard."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, []);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const faturamentoMes = dados.lancamentos
    .filter((lancamento) => {
      if (
        lancamento.tipo !== "Receita" ||
        lancamento.status !== "Pago"
      ) {
        return false;
      }

      const [ano, mes] = lancamento.data_vencimento
        .slice(0, 10)
        .split("-")
        .map(Number);

      return ano === anoAtual && mes === mesAtual + 1;
    })
    .reduce(
      (total, lancamento) =>
        total + Number(lancamento.valor),
      0
    );

  const indicadores = [
    {
      titulo: "Clientes cadastrados",
      valor: dados.clientes.length.toString(),
      cor: cores.azul
    },
    {
      titulo: "Ordens em andamento",
      valor: dados.ordens
        .filter((ordem) => ordem.status === "Em andamento")
        .length.toString(),
      cor: cores.amarelo
    },
    {
      titulo: "Orçamentos pendentes",
      valor: dados.orcamentos
        .filter((orcamento) => orcamento.status === "Pendente")
        .length.toString(),
      cor: cores.azul
    },
    {
      titulo: "Receitas pagas com vencimento no mês",
      valor: formatarMoeda(faturamentoMes),
      cor: cores.verde
    }
  ];

  const meses = Array.from({ length: 6 }, (_, indice) => {
    const data = new Date(
      anoAtual,
      mesAtual - (5 - indice),
      1
    );

    return {
      ano: data.getFullYear(),
      mes: data.getMonth() + 1,
      nome: data.toLocaleDateString("pt-BR", {
        month: "short"
      }).replace(".", "")
    };
  });

  const dadosGrafico = meses.map((mes) => {
    const lancamentosMes = dados.lancamentos.filter(
      (lancamento) => {
        const [anoLancamento, mesLancamento] =
          lancamento.data_vencimento
            .slice(0, 10)
            .split("-")
            .map(Number);

        return (
          anoLancamento === mes.ano &&
          mesLancamento === mes.mes &&
          lancamento.status === "Pago"
        );
      }
    );

    const receitas = lancamentosMes
      .filter((lancamento) => lancamento.tipo === "Receita")
      .reduce(
        (total, lancamento) =>
          total + Number(lancamento.valor),
        0
      );

    const despesas = lancamentosMes
      .filter((lancamento) => lancamento.tipo === "Despesa")
      .reduce(
        (total, lancamento) =>
          total + Number(lancamento.valor),
        0
      );

    return {
      ...mes,
      receitas,
      despesas
    };
  });

  const maiorValorGrafico = Math.max(
    1,
    ...dadosGrafico.flatMap((mes) => [
      mes.receitas,
      mes.despesas
    ])
  );

  const statusOrdens = [
    {
      nome: "Pendente",
      quantidade: dados.ordens.filter(
        (ordem) => ordem.status === "Pendente"
      ).length,
      cor: cores.amarelo
    },
    {
      nome: "Em andamento",
      quantidade: dados.ordens.filter(
        (ordem) => ordem.status === "Em andamento"
      ).length,
      cor: cores.azul
    },
    {
      nome: "Concluída",
      quantidade: dados.ordens.filter(
        (ordem) => ordem.status === "Concluída"
      ).length,
      cor: cores.verde
    }
  ];

  const statusOrcamentos = [
    {
      nome: "Pendente",
      quantidade: dados.orcamentos.filter(
        (orcamento) => orcamento.status === "Pendente"
      ).length,
      cor: cores.amarelo
    },
    {
      nome: "Aprovado",
      quantidade: dados.orcamentos.filter(
        (orcamento) => orcamento.status === "Aprovado"
      ).length,
      cor: cores.verde
    },
    {
      nome: "Recusado",
      quantidade: dados.orcamentos.filter(
        (orcamento) => orcamento.status === "Recusado"
      ).length,
      cor: cores.vermelho
    }
  ];

  const lancamentosRecentes = [...dados.lancamentos]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  function renderizarResumoStatus(
    itens: {
      nome: string;
      quantidade: number;
      cor: string;
    }[]
  ) {
    const total = itens.reduce(
      (soma, item) => soma + item.quantidade,
      0
    );

    if (total === 0) {
      return (
        <p style={{ color: cores.cinza, marginTop: 20 }}>
          Nenhum registro cadastrado.
        </p>
      );
    }

    return (
      <div style={{ marginTop: 24 }}>
        {itens.map((item) => {
          const porcentagem =
            (item.quantidade / total) * 100;

          return (
            <div
              key={item.nome}
              style={{ marginBottom: 22 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                  fontSize: 14,
                  color: "#334155"
                }}
              >
                <span>{item.nome}</span>
                <strong>{item.quantidade}</strong>
              </div>

              <div
                style={{
                  height: 10,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 999,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${porcentagem}%`,
                    height: "100%",
                    backgroundColor: item.cor,
                    borderRadius: 999
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: cores.cinza,
                  margin: "5px 0 0"
                }}
              >
                {porcentagem.toFixed(0)}% do total
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <header className="header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral do seu negócio</p>
        </div>
      </header>

      {erro && (
        <p
          role="alert"
          style={{
            color: cores.vermelho,
            marginTop: 20
          }}
        >
          {erro}
        </p>
      )}

      <section className="cards">
        {indicadores.map((indicador) => (
          <div
            className="card"
            key={indicador.titulo}
            style={{
              borderTop: `4px solid ${indicador.cor}`
            }}
          >
            <h3>{indicador.titulo}</h3>
            <p className="card-number">
              {carregando || erro
                ? "..."
                : indicador.valor}
            </p>
          </div>
        ))}
      </section>

      {!carregando && !erro && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: 20,
              marginTop: 30
            }}
          >
            <div className="card">
              <h3
                style={{
                  fontSize: 17,
                  color: "#0f172a",
                  fontWeight: 600
                }}
              >
                Ordens de serviço
              </h3>

              <p
                style={{
                  color: cores.cinza,
                  fontSize: 13,
                  marginTop: 8
                }}
              >
                Distribuição por status
              </p>

              {renderizarResumoStatus(statusOrdens)}
            </div>

            <div className="card">
              <h3
                style={{
                  fontSize: 17,
                  color: "#0f172a",
                  fontWeight: 600
                }}
              >
                Orçamentos
              </h3>

              <p
                style={{
                  color: cores.cinza,
                  fontSize: 13,
                  marginTop: 8
                }}
              >
                Distribuição por status
              </p>

              {renderizarResumoStatus(statusOrcamentos)}
            </div>
          </div>

          <div className="card" style={{ marginTop: 30 }}>
            <h3
              style={{
                fontSize: 17,
                color: "#0f172a",
                fontWeight: 600
              }}
            >
              Receitas e despesas
            </h3>

            <p
              style={{
                color: cores.cinza,
                fontSize: 13,
                marginTop: 8
              }}
            >
              Últimos 6 meses — lançamentos pagos,
              agrupados por vencimento
            </p>

            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                marginTop: 20,
                fontSize: 13
              }}
            >
              <span>
                <span style={{ color: cores.verde }}>■</span>
                {" "}Receitas
              </span>

              <span>
                <span style={{ color: cores.vermelho }}>■</span>
                {" "}Despesas
              </span>
            </div>

            <div
              style={{
                overflowX: "auto",
                marginTop: 24
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(6, minmax(85px, 1fr))",
                  gap: 16,
                  minWidth: 580,
                  alignItems: "end"
                }}
              >
                {dadosGrafico.map((mes) => (
                  <div
                    key={`${mes.ano}-${mes.mes}`}
                    style={{
                      textAlign: "center",
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        height: 180,
                        alignItems: "flex-end",
                        justifyContent: "center",
                        borderBottom: "1px solid #e2e8f0"
                      }}
                    >
                      <div
                        title={`Receitas: ${formatarMoeda(mes.receitas)}`}
                        style={{
                          width: "38%",
                          height: `${
                            (mes.receitas / maiorValorGrafico) * 100
                          }%`,
                          minHeight: mes.receitas > 0 ? 3 : 0,
                          backgroundColor: cores.verde,
                          borderRadius: "5px 5px 0 0"
                        }}
                      />

                      <div
                        title={`Despesas: ${formatarMoeda(mes.despesas)}`}
                        style={{
                          width: "38%",
                          height: `${
                            (mes.despesas / maiorValorGrafico) * 100
                          }%`,
                          minHeight: mes.despesas > 0 ? 3 : 0,
                          backgroundColor: cores.vermelho,
                          borderRadius: "5px 5px 0 0"
                        }}
                      />
                    </div>

                    <p
                      style={{
                        margin: "12px 0 4px",
                        color: "#334155",
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: "capitalize"
                      }}
                    >
                      {mes.nome}/{String(mes.ano).slice(-2)}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: cores.cinza,
                        margin: 0
                      }}
                    >
                      {formatarMoeda(mes.receitas)}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: cores.cinza,
                        margin: "4px 0 0"
                      }}
                    >
                      {formatarMoeda(mes.despesas)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {dadosGrafico.every(
              (mes) => mes.receitas === 0 && mes.despesas === 0
            ) && (
              <p
                style={{
                  color: cores.cinza,
                  fontSize: 13,
                  marginTop: 20
                }}
              >
                Não há lançamentos pagos com vencimento
                nos últimos seis meses.
              </p>
            )}
          </div>

          <div className="card" style={{ marginTop: 30 }}>
            <h3
              style={{
                fontSize: 17,
                color: "#0f172a",
                fontWeight: 600
              }}
            >
              Lançamentos recentes
            </h3>

            <p
              style={{
                color: cores.cinza,
                fontSize: 13,
                marginTop: 8
              }}
            >
              Últimos cinco registros cadastrados
            </p>

            {lancamentosRecentes.length === 0 ? (
              <p
                style={{
                  color: cores.cinza,
                  marginTop: 20
                }}
              >
                Nenhum lançamento financeiro cadastrado.
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
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                      <th>Situação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lancamentosRecentes.map((lancamento) => (
                      <tr key={lancamento.id}>
                        <td>{lancamento.descricao}</td>

                        <td>
                          <span
                            style={{
                              ...etiquetaBase,
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

                        <td>
                          {formatarMoeda(lancamento.valor)}
                        </td>

                        <td>
                          {formatarData(lancamento.data_vencimento)}
                        </td>

                        <td>
                          <span
                            style={{
                              ...etiquetaBase,
                              ...obterEstiloStatus(lancamento.status)
                            }}
                          >
                            {lancamento.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Dashboard;
