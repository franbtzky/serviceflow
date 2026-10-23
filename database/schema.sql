
CREATE DATABASE IF NOT EXISTS serviceflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE serviceflow;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(20),
  documento VARCHAR(20),
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pendente', 'Em andamento', 'Concluída')
    NOT NULL DEFAULT 'Pendente',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pendente', 'Aprovado', 'Recusado')
    NOT NULL DEFAULT 'Pendente',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabela financeira
CREATE TABLE IF NOT EXISTS financeiro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  tipo ENUM('Receita', 'Despesa') NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status ENUM('Pendente', 'Pago')
    NOT NULL DEFAULT 'Pendente',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
