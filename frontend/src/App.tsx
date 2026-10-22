import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Ordens from "./pages/Ordens";
import Orcamentos from "./pages/Orcamentos";
import Financeiro from "./pages/Financeiro";
import "./App.css";

type Pagina =
  | "dashboard"
  | "clientes"
  | "ordens"
  | "orcamentos"
  | "financeiro";

function App() {
  const [pagina, setPagina] = useState<Pagina>("dashboard");

  const itensMenu: { id: Pagina; nome: string }[] = [
    { id: "dashboard", nome: "Dashboard" },
    { id: "clientes", nome: "Clientes" },
    { id: "ordens", nome: "Ordens de serviço" },
    { id: "orcamentos", nome: "Orçamentos" },
    { id: "financeiro", nome: "Financeiro" }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="logo">ServiceFlow</h1>

        <nav className="menu">
          {itensMenu.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={pagina === item.id ? "active" : ""}
              onClick={() => setPagina(item.id)}
            >
              {item.nome}
            </a>
          ))}
        </nav>
      </aside>

      <main className="content">
        {pagina === "dashboard" && <Dashboard />}
        {pagina === "clientes" && <Clientes />}
        {pagina === "ordens" && <Ordens />}
        {pagina === "orcamentos" && <Orcamentos />}
        {pagina === "financeiro" && <Financeiro />}
      </main>
    </div>
  );
}

export default App;
