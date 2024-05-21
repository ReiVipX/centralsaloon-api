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

app.get('/healthz', async (req, res) => {
  res.status(200).send("Tudo funcionando");
});

// Rota POST para conectar no aplicativo
app.post('/login', async (req, res) => {
  let client
  const { usuario, senha } = req.body

  try {
    client = await pool.connect();
    const userResult = await client.query('SELECT usuario, senha FROM login WHERE usuario = $1', [usuario]);
    const user_db = userResult.rows[0].usuario;
    const password_db = userResult.rows[0].senha;

    if (usuario == user_db && senha == password_db) {
      res.send('Login bem sucedido');
    } else {
      res.send('Erro no login');
    }


  } catch (error) {
    console.error('Erro ao inserir usuário no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao inserir usuário no banco de dados.' });

  } finally {
    // Fecha a conexão com o banco de dados
    if (client) {
      client.release();
    }
  }
})

// Rota GET para buscar usuários no banco de dados
app.get('/clientes', async (req, res) => {
  let client;
  try {
    // Conecta-se ao banco de dados
    client = await pool.connect();

    // Realiza a busca no banco de dados
    const result = await client.query('SELECT * FROM tb_cliente');

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

// Rota POST para inserir um novo usuário no banco de dados
app.post('/cadastro', async (req, res) => {
  let client;
  const { nome, data_nascimento, cep, endereco, email, celular, senha } = req.body;

  // Verificação simples para garantir que todos os campos necessários estão presentes
  if (!nome || !data_nascimento || !cep || endereco === undefined) {
    return res.status(400).json({ error: 'Por favor, forneça nome, data_nascimento, cep, endereco, email, celular e senha.' });
  }

  try {
    // Conecta-se ao banco de dados
    const client = await pool.connect();

    // Executa a consulta de inserção no banco de dados
    const result = await client.query(
      'INSERT INTO tb_cliente (nome, data_nascimento, cep, endereco, email, celular, senha) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nome, data_nascimento, cep, endereco, email, celular, senha]
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