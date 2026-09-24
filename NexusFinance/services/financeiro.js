/** Centraliza requisições autenticadas e a apresentação de valores e datas financeiras. */
import { apiRequest } from './api';
import { obterToken } from './session';

/** Acrescenta o token à chamada e interrompe o envio quando não existe sessão persistida. */
export async function apiAutenticada(path, options = {}) {
  const token = await obterToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  return apiRequest(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}

/** Apresenta valores no padrão monetário brasileiro. */
export function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Interpreta a data financeira à meia-noite local para manter o dia exibido. */
export function formatDate(value) {
  if (!value) return '';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');
}

/** Monta a data ISO a partir do calendário local do aparelho. */
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
