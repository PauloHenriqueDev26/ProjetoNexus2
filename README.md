# Nexus Finance

Aplicativo de finanças pessoais desenvolvido como TCC, com interface Expo/React Native e API Express/TypeScript integrada ao MySQL.

## Estrutura

- `NexusFinance/app/`: somente telas e configuração das rotas.
- `NexusFinance/components/`: elementos reutilizáveis, navegação, gráficos e formulários.
- `NexusFinance/styles/`: estilos separados em autenticação, finanças, conta, navegação e elementos compartilhados.
- `NexusFinance/contexts/`, `hooks/`, `services/` e `theme/`: sessão, acesso a dados, integração com a API e paletas.
- `NexusFinance/tests/`: testes independentes da interface nativa.
- `backend/src/`: API, autenticação, regras financeiras e testes.
- `backend/scripts/`: prévia com dados sintéticos para revisão.
- `SQL.txt`: instalação inicial do banco.

## Preparação

Execute `npm ci` na raiz e também nas pastas `backend` e `NexusFinance`. A raiz instala apenas a ferramenta de formatação; os dois projetos mantêm suas dependências separadas. Configure os arquivos `.env` a partir de cada `.env.example`.

Siga o [guia do backend](backend/README.md) para preparar o MySQL, executar a migração e iniciar a API. O arquivo `SQL.txt` apaga e recria o banco; use-o somente na instalação inicial. Para a interface, consulte o [guia do aplicativo](NexusFinance/README.md).

## Comandos de manutenção na raiz

- `npm run format`: aplica a formatação do código e das configurações.
- `npm run format:check`: confere a formatação sem editar arquivos.
- `npm run lint`: analisa a interface sem tolerar avisos.
- `npm test`: executa os testes unitários dos dois projetos.
- `npm run build`: compila a API e exporta a versão web.

Os testes de integração com MySQL são opcionais e precisam de um serviço local disponível; veja o guia do backend. Os testes de teclado verificam geometria, mas o comportamento nativo ainda deve ser conferido no aparelho.

## Convenções

Use UTF-8, dois espaços, fim de linha LF e as regras do Prettier. Documente em português a responsabilidade dos módulos e as regras que não ficam claras pela leitura do código. Mantenha componentes e estilos fora de `app/`, pois essa pasta define as rotas do Expo Router.
