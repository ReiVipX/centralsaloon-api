const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuração do pool de conexões com o banco de dados PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false // Necessário se estiver usando SSL
  }
});

// Middleware para permitir o uso de JSON
app.use(express.json());

// Rota GET para checar status da API
app.get('/healthz', async (req, res) => {
  res.status(200).send("Tudo funcionando");
});

// Rota POST para conectar no aplicativo
app.post('/login', async (req, res) => {
  let client;
  const { email, senha } = req.body;

  try {
    client = await pool.connect();
    const userResult = await client.query('SELECT email, senha FROM cliente WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Caso nenhum usuário seja encontrado
      return res.send('Erro no login');
    }

    const email_db = userResult.rows[0].email;
    const password_db = userResult.rows[0].senha;

    if (email == email_db && senha == password_db) {
      res.send(true);
    } else {
      res.send(false);
    }

  } catch (error) {
    console.error('Erro ao realizar login no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao realizar login no banco de dados.' });
  } finally {
    // Fecha a conexão com o banco de dados
    if (client) {
      client.release();
    }
  }
});

// Rota GET para buscar usuários no banco de dados
app.get('/clientes', async (req, res) => {
  let client;
  try {
    // Conecta-se ao banco de dados
    client = await pool.connect();

    // Realiza a busca no banco de dados
    const result = await client.query('SELECT * FROM cliente');

    // Retorna os resultados da busca como resposta
    res.json(result.rows);

  } catch (error) {
    // Se ocorrer um erro, retorna uma mensagem de erro
    console.error('Erro ao buscar usuários no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários no banco de dados.' });

  } finally {
    // Fecha a conexão com o banco de dados
    if (client) {
      client.release();
    }
  }
});

// Rota GET para buscar agendamentos no banco de dados
app.get('/agenda', async (req, res) => {
  let client;
  try {
    // Conecta-se ao banco de dados
    client = await pool.connect();

    // Realiza a busca no banco de dados
    const result = await client.query('SELECT * FROM agenda');

    // Retorna os resultados da busca como resposta
    res.json(result.rows);

  } catch (error) {
    // Se ocorrer um erro, retorna uma mensagem de erro
    console.error('Erro ao buscar consultas no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao buscar consultas no banco de dados.' });

  } finally {
    // Fecha a conexão com o banco de dados
    if (client) {
      client.release();
    }
  }
});

// Rota POST para inserir um novo usuário no banco de dados
app.post('/cadastro', async (req, res) => {
  let client;
  const { nome, data_nascimento, cep, endereco, cpf, email, celular, senha } = req.body;

  // Verificação simples para garantir que todos os campos necessários estão presentes
  if (!nome || !data_nascimento || !cep || !endereco || !cpf || !email || !celular || !senha) {
    return res.status(400).json({ error: 'Por favor, forneça nome, data_nascimento, cep, endereco, cpf, email, celular e senha.' });
  }

  try {
    // Conecta-se ao banco de dados
    client = await pool.connect();

    // Executa a consulta de inserção no banco de dados
    const result = await client.query(
      'INSERT INTO cliente (nome, data_nascimento, cep, endereco, cpf, email, celular, senha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nome, data_nascimento, cep, endereco, cpf, email, celular, senha]
    );

    // Retorna os resultados da inserção como resposta
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao inserir usuário no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao inserir usuário no banco de dados.' });

  } finally {
    // Fecha a conexão com o banco de dados
    if (client) {
      client.release();
    }
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Aplicação está ouvindo na porta ${port}`);
});