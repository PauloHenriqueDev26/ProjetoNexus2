// Carregamento das configurações sensíveis e de infraestrutura da aplicação.
// dotenv lê o arquivo .env e disponibiliza as variáveis em process.env.
import 'dotenv/config';

// Em produção, segredos precisam existir e ter tamanho mínimo suficiente.
const segredoConfigurado = process.env.JWT_SECRET?.trim();
if (process.env.NODE_ENV === 'production' && (!segredoConfigurado || segredoConfigurado.length < 32)) {
  throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres antes de iniciar em produção.');
}

const segredoRecuperacao = process.env.RECOVERY_TOKEN_SECRET?.trim();
if (process.env.NODE_ENV === 'production' && (!segredoRecuperacao || segredoRecuperacao.length < 32)) {
  throw new Error('Configure RECOVERY_TOKEN_SECRET com pelo menos 32 caracteres antes de iniciar em produção.');
}

// APP_ORIGINS contém as URLs web autorizadas pelo navegador para fazer requisições CORS.
const origensAplicativo = (process.env.APP_ORIGINS || '').split(',').map(origem => origem.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !origensAplicativo.length) {
  throw new Error('Configure APP_ORIGINS com as origens web autorizadas antes de iniciar em produção.');
}

// Retorna uma variável obrigatória ou lança uma falha clara durante a inicialização.
function obrigatoria(nome: string, alternativa?: string): string {
  const valor = process.env[nome] || alternativa;
  if (!valor) throw new Error(`Variável de ambiente ${nome} não configurada.`);
  return valor;
}

// Decide se uma origem pode consumir a API.
export function origemWebAutorizada(origem: string): boolean {
  // Em todos os ambientes, uma origem listada explicitamente é aceita.
  if (origensAplicativo.includes(origem)) return true;

  // Fora da lista, nenhuma origem adicional é permitida em produção.
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origem);
    // Em desenvolvimento permite apenas navegadores em localhost ou loopback local.
    return url.origin === origem &&
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

// Objeto único exportado pelo módulo, usado por banco, JWT, email e servidor HTTP.
export const configuracao = {
  porta: Number(process.env.PORT || 3000),
  banco: {
    host: obrigatoria('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT || 3306),
    user: obrigatoria('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: obrigatoria('DB_NAME', 'nexus_finance'),
    usarTls: process.env.DB_SSL === 'true'
  },
  jwt: {
    segredo: obrigatoria('JWT_SECRET'),
    validade: process.env.JWT_EXPIRES_IN || '1d'
  },
  recuperacao: {
    segredo: obrigatoria('RECOVERY_TOKEN_SECRET', segredoConfigurado)
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    user: obrigatoria('EMAIL_USER'),
    password: obrigatoria('EMAIL_PASSWORD'),
    from: process.env.EMAIL_FROM || `Nexus Finance <${obrigatoria('EMAIL_USER')}>`
  }
};
