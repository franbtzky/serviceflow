
import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import "./Clientes.css";

type Cliente = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
};

const API = "http://localhost:3000/api/clientes";

const campo: CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid #cbd5e1",
  borderRadius: 8
};

const botao: CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: 8,
  cursor: "pointer"
};

function numeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarTelefone(valor: string) {
  const n = numeros(valor).slice(0, 11);

  if (n.length <= 2) return n;
  if (n.length <= 6) {
    return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  }

  if (n.length <= 10) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  }

  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function formatarDocumento(valor: string) {
  const n = numeros(valor).slice(0, 14);

  if (n.length <= 11) {
    return n
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/\/(\d{4})(\d)/, "/$1-$2");
}

function cpfValido(valor: string) {
  const cpf = numeros(valor);

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

    if (digito !== Number(cpf[posicao])) return false;
  }

  return true;
}

function cnpjValido(valor: string) {
  const cnpj = numeros(valor);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  function digito(base: string, pesos: number[]) {
    const soma = base
      .split("")
      .reduce(
        (total, numero, indice) =>
          total + Number(numero) * pesos[indice],
        0
      );

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  return (
    digito(cnpj.slice(0, 12), [
      5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
    ]) === Number(cnpj[12]) &&
    digito(cnpj.slice(0, 13), [
      6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
    ]) === Number(cnpj[13])
  );
}

function validar(
  nome: string,
  email: string,
  telefone: string,
  documento: string
) {
  if (!nome.trim()) return "Informe o nome do cliente.";

  if (
    email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return "Informe um e-mail válido.";
  }

  if (telefone.trim()) {
    const n = numeros(telefone);

    if (
      (n.length !== 10 && n.length !== 11) ||
      Number(n.slice(0, 2)) < 11
    ) {
      return "Informe um telefone válido com DDD.";
    }
  }

  if (documento.trim()) {
    const n = numeros(documento);

    if (n.length === 11 && !cpfValido(n)) {
      return "O CPF informado é inválido.";
    }

    if (n.length === 14 && !cnpjValido(n)) {
      return "O CNPJ informado é inválido.";
    }

    if (n.length !== 11 && n.length !== 14) {
      return "Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.";
    }
  }

  return null;
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");

  async function buscarClientes() {
    try {
      const resposta = await fetch(API);

      if (!resposta.ok) throw new Error();

      const dados: Cliente[] = await resposta.json();
      setClientes(dados);
      setErro("");
    } catch {
      setErro("Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarClientes();
  }, []);

  function limparFormulario() {
    setIdEdicao(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setDocumento("");
    setMostrarFormulario(false);
  }

  function novoCliente() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function editarCliente(cliente: Cliente) {
    setIdEdicao(cliente.id);
    setNome(cliente.nome);
    setEmail(cliente.email || "");
    setTelefone(formatarTelefone(cliente.telefone || ""));
    setDocumento(formatarDocumento(cliente.documento || ""));
    setMostrarFormulario(true);
    setErro("");
    setMensagem("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarCliente(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setErro("");
    setMensagem("");

    const erroValidacao = validar(
      nome,
      email,
      telefone,
      documento
    );

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);
    const editando = idEdicao !== null;

    try {
      const resposta = await fetch(
        editando ? `${API}/${idEdicao}` : API,
        {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            telefone: numeros(telefone),
            documento: numeros(documento)
          })
        }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);

        throw new Error(
          dados?.message || "Não foi possível salvar o cliente."
        );
      }

      limparFormulario();
      await buscarClientes();

      setMensagem(
        editando
          ? "Cliente atualizado com sucesso!"
          : "Cliente cadastrado com sucesso!"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cliente."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCliente(cliente: Cliente) {
    if (
      !window.confirm(
        `Deseja realmente excluir o cliente ${cliente.nome}?`
      )
    ) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(`${API}/${cliente.id}`, {
        method: "DELETE"
      });

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        throw new Error(
          dados?.message || "Não foi possível excluir o cliente."
        );
      }

      if (idEdicao === cliente.id) limparFormulario();

      await buscarClientes();
      setMensagem("Cliente excluído com sucesso!");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o cliente."
      );
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = pesquisa.toLowerCase().trim();

    return (
      cliente.nome.toLowerCase().includes(termo) ||
      (cliente.email || "").toLowerCase().includes(termo) ||
      numeros(cliente.telefone || "").includes(numeros(termo)) &&
        numeros(termo).length > 0 ||
      numeros(cliente.documento || "").includes(numeros(termo)) &&
        numeros(termo).length > 0
    );
  });

  return (
    <section>
      <header className="header">
        <h2>Clientes</h2>
        <p>Gerencie os clientes cadastrados no sistema</p>
      </header>

      <div style={{ marginTop: 30 }}>
        <button
          type="button"
          onClick={novoCliente}
          style={botao}
        >
          + Novo cliente
        </button>
      </div>

      {mensagem && (
        <p style={{ color: "green", marginTop: 15 }}>
          {mensagem}
        </p>
      )}

      {erro && (
        <p role="alert" style={{ color: "#dc2626", marginTop: 15 }}>
          {erro}
        </p>
      )}

      {mostrarFormulario && (
        <div className="card" style={{ marginTop: 30 }}>
          <h3>
            {idEdicao !== null ? "Editar cliente" : "Novo cliente"}
          </h3>

          <form
            onSubmit={salvarCliente}
            className="clientes-formulario"
          >
            <label>
              Nome *
              <input
                type="text"
                required
                maxLength={150}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                maxLength={254}
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={campo}
              />
            </label>

            <label>
              Telefone
              <input
                type="tel"
                inputMode="numeric"
                maxLength={15}
                placeholder="(17) 99999-9999"
                value={telefone}
                onChange={(e) =>
                  setTelefone(formatarTelefone(e.target.value))
                }
                style={campo}
              />
            </label>

            <label>
              CPF/CNPJ
              <input
                type="text"
                inputMode="numeric"
                maxLength={18}
                placeholder="CPF ou CNPJ"
                value={documento}
                onChange={(e) =>
                  setDocumento(formatarDocumento(e.target.value))
                }
                style={campo}
              />
            </label>

            <div className="clientes-formulario-acoes">
              <button
                type="submit"
                disabled={salvando}
                style={botao}
              >
                {salvando
                  ? "Salvando..."
                  : idEdicao !== null
                    ? "Salvar alterações"
                    : "Cadastrar cliente"}
              </button>

              <button
                type="button"
                onClick={limparFormulario}
                disabled={salvando}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #ccc",
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
        <h3>Clientes cadastrados</h3>

        <input
          type="text"
          placeholder="Pesquisar por nome, e-mail, telefone ou documento..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={{
            ...campo,
            marginTop: 20,
            marginBottom: 15
          }}
        />

        {carregando ? (
          <p>Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <p>Nenhum cliente cadastrado.</p>
        ) : clientesFiltrados.length === 0 ? (
          <p>Nenhum cliente encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table className="clientes-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Documento</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.email || "-"}</td>
                    <td>
                      {cliente.telefone
                        ? formatarTelefone(cliente.telefone)
                        : "-"}
                    </td>
                    <td>
                      {cliente.documento
                        ? formatarDocumento(cliente.documento)
                        : "-"}
                    </td>
                    <td>
                      <div className="clientes-acoes">
                        <button
                          type="button"
                          className="clientes-btn-editar"
                          onClick={() => editarCliente(cliente)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="clientes-btn-excluir"
                          onClick={() => excluirCliente(cliente)}
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

export default Clientes;
