// Módulo responsável por criar e compartilhar o pool de conexões com o MySQL.
// Um pool reutiliza conexões e evita abrir uma nova conexão a cada consulta.
import mysql from 'mysql2/promise';
import { configuracao } from "../config/configuracao";

// Separa usarTls das opções aceitas pelo driver: usarTls é uma opção interna da aplicação.
const { usarTls, ...opcoesConexao } = configuracao.banco;

// Pool compartilhado usado pelos serviços e rotas do backend.
export const bancoDados = mysql.createPool({
  ...opcoesConexao,
  // Em produção pode habilitar TLS; rejectUnauthorized valida o certificado do servidor.
  ssl: usarTls ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  // Faz valores DECIMAL chegarem como números em vez de strings em várias operações.
  decimalNumbers: true
});
