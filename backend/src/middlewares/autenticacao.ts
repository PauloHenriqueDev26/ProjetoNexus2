// Middleware e utilitários de autenticação baseados em JSON Web Tokens (JWT).
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { configuracao } from "../config/configuracao";

// Estende Request do Express para transportar o identificador do usuário autenticado.
export interface RequisicaoAutenticada extends Request {
  userId?: number;
}

// Assina um token contendo apenas o identificador necessário para identificar o usuário.
export function criarToken(idUsuario: number): string {
  return jwt.sign({ userId: idUsuario }, configuracao.jwt.segredo, {
    expiresIn: configuracao.jwt.validade
  } as SignOptions);
}

// Extrai o Bearer token, valida sua assinatura e disponibiliza o usuário na requisição.
export function autenticar(requisicao: RequisicaoAutenticada, resposta: Response, proximo: NextFunction): void {
  const token = requisicao.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    resposta.status(401).json({ mensagem: 'Token de autenticação não informado.' });
    return;
  }

  try {
    const conteudo = jwt.verify(token, configuracao.jwt.segredo) as JwtPayload;
    requisicao.userId = Number(conteudo.userId);
    proximo();
  } catch {
    resposta.status(401).json({ mensagem: 'Sessão inválida ou expirada.' });
  }
}
