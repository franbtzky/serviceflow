
# ServiceFlow

Sistema Full Stack para gerenciamento de clientes, ordens de serviço, orçamentos e movimentações financeiras, desenvolvido com React, TypeScript, Node.js, Express e MySQL.

## Sobre o projeto

O ServiceFlow é uma aplicação de gestão que centraliza processos administrativos e financeiros em uma única interface.

O projeto foi desenvolvido para aplicar conceitos de desenvolvimento Full Stack, incluindo criação de interfaces, integração com APIs REST, operações CRUD e persistência de dados em banco relacional.

## Funcionalidades

### Dashboard
- Indicadores de clientes cadastrados, ordens em andamento e orçamentos pendentes.
- Resumo de receitas recebidas no mês.
- Gráfico de receitas e despesas dos últimos seis meses.
- Visualização dos status de ordens de serviço e orçamentos.
- Listagem de movimentações financeiras recentes.

### Gestão de clientes
- Cadastro, consulta, edição e exclusão de clientes.
- Pesquisa de clientes.
- Validação e formatação de CPF/CNPJ, telefone e e-mail.

### Ordens de serviço
- Cadastro, edição e exclusão de ordens.
- Associação de ordens aos clientes.
- Pesquisa e filtragem por status.
- Identificação visual dos status.

### Orçamentos
- Cadastro, edição e exclusão de orçamentos.
- Associação de orçamentos aos clientes.
- Pesquisa e filtragem por status.
- Acompanhamento de orçamentos pendentes, aprovados e recusados.

### Gestão financeira
- Cadastro, edição e exclusão de receitas e despesas.
- Organização por categorias.
- Controle de valores, vencimentos e status de pagamento.
- Pesquisa e filtros por tipo, status e período.
- Indicadores financeiros e integração com o Dashboard.

## Tecnologias utilizadas

**Front-End**
- React
- TypeScript
- Vite
- HTML5
- CSS3

**Back-End**
- Node.js
- Express
- TypeScript
- API REST

**Banco de dados**
- MySQL
- SQL

**Ferramentas**
- Git
- GitHub
- Visual Studio Code

## Estrutura do projeto

```text
serviceflow/
├── backend/
│   └── src/
│       ├── config/
│       ├── routes/
│       └── server.ts
├── database/
│   └── schema.sql
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       └── pages/
├── .gitignore
└── README.md
```

## Como executar o projeto

### Pré-requisitos

- Node.js e npm
- MySQL

### 1. Clonar o repositório

```bash
git clone https://github.com/franbtzky/serviceflow.git
cd serviceflow
```

### 2. Configurar o banco de dados

Execute o arquivo `database/schema.sql` no MySQL para criar a estrutura do banco de dados.

### 3. Configurar o Back-End

```bash
cd backend
npm install
```

Crie um arquivo `.env` dentro de `backend`, utilizando `.env.example` como referência, e configure os dados de conexão com o MySQL.

Inicie o Back-End com o comando de desenvolvimento definido em `backend/package.json`.

### 4. Configurar o Front-End

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse o endereço local informado pelo Vite no terminal.

## Objetivo

O ServiceFlow foi desenvolvido como projeto de portfólio para demonstrar conhecimentos em desenvolvimento de aplicações Full Stack, integração entre Front-End e Back-End, modelagem de dados relacionais e implementação de funcionalidades de gestão.

## Autoria

Desenvolvido por [Fran](https://github.com/franbtzky).
