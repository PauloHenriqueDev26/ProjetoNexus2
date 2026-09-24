# Aplicativo Nexus Finance

Interface Expo/React Native para cadastro, autenticação, receitas, despesas, metas, relatórios e preferências de aparência.

## Executar

1. Instale as dependências com `npm ci`.
2. Configure a API conforme `.env.example` e mantenha o backend e o MySQL disponíveis.
3. Execute `npm start`, `npm run web`, `npm run android` ou `npm run ios`, conforme o ambiente.

Em celular físico, configure um endereço da API acessível pelo aparelho. Após mudar a configuração pública, reinicie o Metro com `npx expo start -c`.

## Organização

A pasta `app/` contém somente rotas. Componentes compartilhados ficam em `components/`; estilos por área ficam em `styles/`. Os contextos controlam sessão e tema, os hooks carregam dados e os serviços integram a API, o armazenamento e a exportação. Os testes ficam em `tests/`.

## Verificações

- `npm test`: testes de datas, contraste e geometria do teclado.
- `npm run lint`: análise estática do aplicativo.
- `npm run build`: exportação da versão web.
- Na raiz do repositório, `npm run format` e `npm run format:check` padronizam o código dos dois projetos.

## Recursos

Receitas e despesas permitem escolher conta, categoria, recorrência e anexo de até 10 MB. Categorias pessoais são persistidas no banco. Os anexos podem ser baixados no fluxo financeiro somente pelo dono do lançamento.

Relatórios podem ser impressos na web ou compartilhados como PDF no celular. As configurações permitem exportar transações em CSV, controlar avisos financeiros e alternar entre os temas claro e escuro.

As antigas telas vazias de edição de receita e despesa foram removidas. A edição de lançamentos não está implementada; a confirmação de pendências permanece disponível no fluxo financeiro. Metas possuem criação, edição e exclusão.

A exportação web não substitui a conferência de teclado, seleção e compartilhamento de arquivos em dispositivos Android e iOS.
