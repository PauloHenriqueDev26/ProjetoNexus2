// Configuração central da API Express.
// Neste módulo são registrados segurança HTTP, parsers, rotas e respostas de erro.
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { rotasAutenticacao } from "./rotas/autenticacao.rotas";
import { rotasDados } from "./rotas/dados.rotas";
import { ErroApi } from "./middlewares/erros";
import { origemWebAutorizada } from './config/configuracao';

// Cria uma única aplicação Express reutilizada pelo servidor HTTP.
const aplicativo = express();
export { aplicativo };

// Remove o cabeçalho padrão X-Powered-By para não anunciar a tecnologia usada.
aplicativo.disable('x-powered-by');

// CORS controla quais sites web podem chamar esta API com JavaScript do navegador.
aplicativo.use(cors({
  origin(origem, callback) {
    // Requisições sem origem normalmente vêm de aplicativos mobile ou ferramentas de servidor.
    if (!origem || origemWebAutorizada(origem)) return callback(null, true);

    // Qualquer origem não autorizada recebe um erro explícito da API.
    callback(new ErroApi(403, 'Origem não autorizada.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400
}));

// Middleware executado antes das rotas para aplicar políticas de segurança em todas as respostas.
aplicativo.use((_requisicao, resposta, proximo) => {
  resposta.setHeader('X-Content-Type-Options', 'nosniff');
  resposta.setHeader('Referrer-Policy', 'no-referrer');
  resposta.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  resposta.setHeader('Cache-Control', 'no-store');

  // HSTS instruirá navegadores a usar HTTPS em ambientes de produção.
  if (process.env.NODE_ENV === 'production') resposta.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  proximo();
});

// Converte o corpo JSON das requisições em objeto JavaScript e limita seu tamanho.
aplicativo.use(express.json({ limit: '100kb' }));

// Endpoint público usado para confirmar que a API está respondendo.
aplicativo.get('/', (_requisicao, resposta) => {
  resposta.json({ mensagem: 'API Nexus Finance funcionando.' });
});

// Agrupa os endpoints de login, cadastro e recuperação em /auth.
aplicativo.use('/auth', rotasAutenticacao);

// Monta o restante das rotas financeiras e de dados no nível principal.
aplicativo.use(rotasDados);

// Esta rota só é alcançada quando nenhuma rota anterior correspondeu à URL.
aplicativo.use((_requisicao, resposta) => {
  resposta.status(404).json({ mensagem: 'Rota não encontrada.' });
});

// Tratador global: transforma diferentes tipos de falha em respostas JSON padronizadas.
aplicativo.use((falha: Error, _requisicao: Request, resposta: Response, _proximo: NextFunction) => {
  if (falha instanceof ErroApi) {
    resposta.status(falha.status).json({ mensagem: falha.message });
    return;
  }

  // Multer gera erros próprios quando há arquivo demais ou o limite de tamanho é excedido.
  if (falha instanceof multer.MulterError) {
    resposta.status(400).json({
      mensagem: falha.code === 'LIMIT_FILE_SIZE' ? 'O arquivo deve ter no máximo 10 MB.' : 'Envie apenas um arquivo e confira os dados do formulário.'
    });
    return;
  }

  // Falha disparada pelo parser quando o conteúdo JSON enviado pelo cliente está malformado.
  if ((falha as { type?: string }).type === 'entity.parse.failed') {
    resposta.status(400).json({ mensagem: 'Dados da requisição inválidos.' });
    return;
  }

  // ER_DUP_ENTRY ocorre quando uma restrição única do MySQL impede o cadastro duplicado.
  if ((falha as { code?: string }).code === 'ER_DUP_ENTRY') {
    resposta.status(409).json({ mensagem: 'Já existe um cadastro com esses dados.' });
    return;
  }

  // Falhas não previstas são registradas no servidor e ocultam detalhes do usuário.
  console.error(falha);
  resposta.status(500).json({ mensagem: 'Erro interno do servidor.' });
});
