/** Assina tokens de sessão e identifica o usuário nas rotas autenticadas. */
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from './config';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/** Emite o token com o identificador do usuário e a duração configurada. */
export function createToken(userId: number): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
}

/** Valida o token recebido e disponibiliza o identificador para as próximas etapas da requisição. */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ mensagem: 'Token de autenticação não informado.' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = Number(payload.userId);
    next();
  } catch {
    res.status(401).json({ mensagem: 'Sessão inválida ou expirada.' });
  }
}
