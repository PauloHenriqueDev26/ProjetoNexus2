# Guia completo e comentado do Nexus Finance

> Objetivo deste documento: explicar o projeto inteiro em português brasileiro, do banco de dados até a tela Android/iOS/web. Os comentários foram escritos para acompanhar o código, não para substituir a leitura dele.

## Como o projeto está organizado

O repositório possui duas aplicações principais e uma pasta de dados:

| Pasta | Responsabilidade | Tecnologia principal |
|---|---|---|
| `NexusFinance/` | Interface que o usuário toca, temas, navegação, formulários e chamadas HTTP | React Native, Expo Router e Expo 55 |
| `backend/` | API que valida, autentica, calcula e grava dados | Node.js, TypeScript e Express |
| `bancoDados/` | Estrutura das tabelas e dados de demonstração | SQL/MySQL |

Uma operação simples ocorre assim:

```text
Usuário toca em um botão
        ↓
A tela altera estado ou chama um hook
        ↓
Um serviço monta JSON ou FormData
        ↓
api.js adiciona URL e cabeçalhos
        ↓
Express recebe a requisição e aplica segurança/autenticação
        ↓
Uma rota valida os dados
        ↓
Um serviço executa regras e consultas MySQL
        ↓
O banco confirma ou desfaz toda a operação
        ↓
A API devolve JSON
        ↓
A tela atualiza seu estado e mostra sucesso ou erro
```

A regra principal é: **a API decide o que pode ser gravado**. Validações no aplicativo tornam a interface mais amigável, mas não protegem o sistema sozinhas. O servidor repete as validações críticas porque uma chamada HTTP pode não passar pelo aplicativo.

## Terminologia usada no projeto

- **Estado:** dado guardado pela tela ou pelo contexto que pode mudar. Ao mudar, o React recalcula a interface.
- **Propriedade (`props`):** informação enviada de um componente pai para um componente filho.
- **Hook:** função React iniciada com `use` que permite memória, efeitos ou reutilização de lógica.
- **Efeito:** operação executada depois da renderização, como buscar dados ou inscrever um ouvinte.
- **Callback:** função entregue para outro componente executar, geralmente após um clique ou confirmação.
- **Rascunho:** alteração ainda não aplicada. Em filtros, por exemplo, é separado da lista atual até o usuário tocar em Aplicar.
- **Token:** prova temporária de sessão criada pelo backend após o login.
- **Bearer:** modo de enviar o token no cabeçalho `Authorization`.
- **Transação de banco:** conjunto de várias alterações que ocorre toda junta ou é desfeito por rollback.
- **Rollback:** desfaz alterações feitas dentro de uma transação quando qualquer operação falhar.
- **Pool:** conjunto reutilizável de conexões com o MySQL.

# Guia comentado do Nexus Finance

Este guia acompanha os comentários no código e explica como as partes se conectam. Leia de baixo para cima: banco de dados → API → serviços do aplicativo → telas. O código continua sendo a fonte do comportamento executado.

## 1. Tecnologias e caminho de uma operação

O projeto tem três partes. `NexusFinance/` é o aplicativo: React 19, React Native 0.83 e Expo 55 permitem compartilhar a interface entre Android, iOS e web. Expo Router transforma arquivos em `src/app/` em rotas; grupos entre parênteses, como `(tabs)`, organizam telas sem aparecer no endereço. JSX declara a árvore visual; componentes React recebem propriedades, guardam estado e reagem a eventos. `backend/` é uma API Node.js em TypeScript e Express 5; `mysql2` acessa o MySQL, `bcryptjs` calcula hashes de senha, `jsonwebtoken` assina tokens, `multer` recebe arquivos e `nodemailer` envia mensagens. `bancoDados/` contém a estrutura SQL e dados de demonstração.

Fluxo de uma operação: uma tela chama serviço JS → `api.js` faz HTTP e `financeiro.js` anexa o token Bearer → Express aplica middlewares e encaminha à rota → a rota valida e chama serviços/repositório → consultas parametrizadas acessam MySQL → resposta JSON atualiza o estado da tela.

## 2. Aplicativo

### Navegação, telas e estado

- `src/app/_layout.jsx` coloca os provedores de sessão e tema acima da navegação Stack. `index.jsx` decide a primeira rota; `auth/` reúne login/cadastro/recuperação; `(tabs)/` abriga as telas principais; `receita/`, `despesa/` e `menus/` têm fluxos auxiliares.
- Cada tela lê estado, trata eventos, compõe componentes e aplica estilos. As regras financeiras importantes são recalculadas no servidor: a interface não é autoridade para o saldo.
- `contextos/ContextoSessao.jsx` compartilha usuário/token. `servicos/sessao.js` esconde a diferença de armazenamento entre SecureStore nativo e armazenamento local web. `ContextoTema.jsx` e `tema/paletas.js` distribuem a preferência e as cores.
- `ganchos/useResumoFinanceiro.js` busca o resumo enquanto a tela está em foco. Uma variável `ativo` evita atualizar estado após a tela sair; `recarregar` muda uma revisão para solicitar nova consulta. `useOpcoesTransacao.js` carrega listas usadas pelos formulários.
- `servicos/api.js` centraliza URL, corpo, cabeçalhos e erros HTTP. `financeiro.js` inclui autenticação e formata reais/datas. `fluxoAutenticacao.js` coordena etapas de login e recuperação; `validacoes.js` valida dados no cliente; `mascarasEntrada.mjs` formata enquanto se digita; `entradaData.mjs` normaliza datas; `arquivos.js` lida com seleção/compartilhamento de arquivos.
- `componentes/` contém navegação, cabeçalhos, abas, paginação, formulários, calendário, modais, avatar, cartões, gráficos, progresso e animações reutilizáveis. `style/style.js` é declarativo: seus objetos escolhem aparência (cores, margens, dimensões, alinhamento), não executam regras financeiras.

## 3. Datas e cálculos

### Datas e calendário

Na API e no banco, datas são `AAAA-MM-DD`; na digitação, `DD/MM/AAAA`. `entradaData.mjs` filtra os dígitos e valida convertendo a data para UTC e conferindo se a volta produz o mesmo ISO. Isso rejeita datas impossíveis como 31/02, que algumas rotinas normalizariam para março. Usar meio-dia UTC reduz deslocamentos de dia causados por fusos horários. `Calendario.jsx` monta a grade do mês; `CampoData.jsx` conecta o calendário à entrada. Os filtros usam limites inclusivos e permitem informar um único limite.

Em parcelas e recorrências, a data mantém o dia âncora original: dia 31 pode virar o último dia de fevereiro, mas volta ao dia 31 quando o mês seguinte comporta essa data. O cálculo encontra o último dia do mês e escolhe `min(dia original, último dia)`.

### Centavos e parcelamento

Números de ponto flutuante são aproximações binárias, portanto somar valores como 0,1 e 0,2 pode gerar fração residual. O servidor converte reais em centavos com `round(valor × 100)`, calcula com inteiros e divide por 100 ao responder. Valores com fração inferior a um centavo são rejeitados.

Para dividir `T` centavos em `N` parcelas, calcula-se `q = floor(T/N)` e `r = T mod N`; as primeiras `r` parcelas recebem um centavo extra. Exemplo: 1000 centavos / 3 = 334 + 333 + 333, cuja soma permanece exatamente 1000. Parcelas seguintes vencem mensalmente e começam pendentes.

### Resumo financeiro (`backend/src/servicos/financeiro.ts`)

- `REPEATABLE READ` e `WITH CONSISTENT SNAPSHOT` fazem as consultas do resumo lerem o mesmo estado do banco, mesmo se outro pedido confirmar uma transação durante o cálculo.
- Saldo total = saldo inicial das contas + receitas confirmadas até hoje − despesas confirmadas até hoje. Canceladas não entram.
- Reservado em metas = depósitos − retiradas por meta; valores negativos por meta são limitados a zero. Disponível = saldo total − reservado.
- Saldo previsto = disponível + impacto líquido de itens pendentes ou futuros até o fim deste mês. Despesas reduzem o total; receitas aumentam.
- O histórico cria 12 meses, incluindo meses vazios, e acumula somente transações realizadas. Em cada mês, saldo = receitas − despesas. A previsão do mês separa realizados e previstos.
- Categorias de despesa incluem categorias ativas sem movimento (valor zero), e os valores exibidos são gastos realizados no mês atual.
- Variação de saldo compara com o mês anterior; variação de despesas compara com o mesmo intervalo de dias do mês anterior. Percentual = diferença / base × 100. Se a base for zero, retorna `null` para evitar divisão indefinida.

### Gráficos, PDF e teclado

`AnelProgresso.jsx` usa componente nativo no celular e SVG na web. Com raio `r`, o comprimento do círculo é `C = 2πr`; para preenchimento `p%`, o trecho vazio é `C × (1 − p/100)`. O valor é limitado a 0–100 e a rotação de −90° inicia o arco no topo.

`relatorio.js` gera tabela HTML e solicita PDF ao Expo Print; Expo Sharing disponibiliza o arquivo. `escaparHtml` codifica caracteres especiais antes de inserir texto na marcação. A taxa de economia do relatório é saldo / receitas × 100, ou “Sem receitas” quando não há receitas.

`geometriaTeclado.mjs` verifica primeiro a interseção horizontal entre campo/viewport e teclado. Sem interseção, a sobreposição é zero; com interseção, calcula o trecho vertical encoberto e limita à altura visível. Depois desloca o campo para manter margem em relação ao teclado e à borda superior, inclusive para campos altos.

## 4. API, segurança e banco

- `servidor.ts` lê configuração, verifica a conexão, inicia o agendador de recorrências e abre HTTP. `aplicativo.ts` configura CORS, limites do corpo, rotas e erro final.
- `rotas/autenticacao.rotas.ts` valida cadastro/login/recuperação. Senhas são guardadas como hashes bcrypt, nunca em texto puro. O código de recuperação tem seis dígitos aleatórios, é armazenado como HMAC-SHA-256 com segredo do servidor, expira em 15 minutos e é consumido uma vez. Respostas de login não revelam se o e-mail ou a senha estava errado.
- `middlewares/autenticacao.ts` verifica o JWT e coloca o id do titular na requisição. Rotas protegidas usam esse id para isolar dados. Placeholders `?` mantêm os dados separados do texto SQL e reduzem risco de injeção.
- `servicos/transacoes.ts` valida e normaliza entrada; confere tipo/status/categoria/conta/meta; grava lançamento e eventuais parcelas, aporte, recorrência, anexo e notificação. Uma transação de banco agrupa as gravações. Erro causa rollback; se o arquivo já foi colocado no disco, ele também é removido.
- `servicos/recorrencias.ts` bloqueia regras ativas (`FOR UPDATE`), gera ocorrências pendentes até o fim do mês ou data final e atualiza `ultima_geracao` na mesma transação. O lock previne duplicatas quando mais de uma execução concorre.
- `anexos.ts` valida arquivo/checksum; `fotoPerfil.ts` prepara a imagem de perfil; `email.ts` envia mensagens; `config/configuracao.ts` centraliza variáveis de ambiente; `bancoDados/bancoDados.ts` mantém o pool. `migrar.ts` verifica colunas/tabelas antes de alterá-las, sem apagar os dados existentes.

### Modelo SQL

`estrutura.sql` define: usuários e preferências; contas e tipos de conta; tipos, status e categorias de lançamento; transações e recorrências; metas e movimentações (depósitos/retiradas históricos); anexos; avisos; recuperações; solicitações de privacidade. Chaves estrangeiras preservam relações; índices aceleram consultas. `seed_teste_completo_usuario_1.sql` cria dados para demonstração e não substitui a migração.

## 5. Mapa das telas

- `inicial.jsx`: saldo, atalhos e metas em destaque.
- `fluxoFinanceiro.jsx`: filtros combinados, cabeçalhos mensais, paginação e confirmação de pendências.
- `metas.jsx`: metas em andamento/concluídas; “reta final” significa avanço estritamente maior que 75%, percentual = acumulado/objetivo × 100.
- `painel.jsx`: indicadores e gráficos do resumo da API, além de exportação de relatório.
- `novaReceita.jsx` e `novaDespesa.jsx`: formulários de transação.
- `perfil.jsx` e `meuCadastro.jsx`: informações e foto do usuário.
- `configuracoes.jsx`, `notificacoes.jsx`, `categoria.jsx`: preferências, avisos e categorias.
- `app/auth/`: boas-vindas, cadastro, login e recuperação de senha.
- `+html.jsx`, `app.json`, `eas.json`, `vercel.json`, `tsconfig.json`, `eslint.config.js` e `package.json` configuram plataforma, publicação, compilação, lint e comandos. `package-lock.json` fixa dependências instaladas e é gerado pelo gerenciador.

Validação no cliente ajuda a entrada, mas validações críticas também ficam no servidor, porque a API pode ser chamada sem o aplicativo. A API é a fonte de verdade para gravação e cálculos financeiros.

## Como ler e manter o projeto sem confundir responsabilidades

### 1. Comece pelo banco

Abra `bancoDados/estrutura.sql`. Procure cada entidade em seu próprio bloco: usuário, conta, categoria, transação, meta, recorrência e notificação.

Cada pergunta abaixo corresponde a uma tabela:

- Quem possui o registro? Normalmente uma chave `id_usuario`.
- Qual é a situação atual? Procure campos como `status`, `ativa`, `confirmada` ou `utilizado`.
- Onde estão os nomes legíveis? Tipos e status ficam em tabelas auxiliares, não em textos repetidos.
- Como relacionar informações? Chaves estrangeiras ligam uma linha a outra.
- Como acelerar uma busca? Índices atendem filtros comuns, como usuário e data.

### 2. Leia a API a partir das rotas

As rotas não devem conter cálculos complexos demais. Elas verificam entrada, chamam serviços e montam respostas HTTP.

Exemplo simplificado de cadastro:

```text
1. Recebe nome, e-mail e senha.
2. Normaliza o e-mail e remove espaços extras.
3. Valida nome, e-mail, data e senha.
4. Verifica se o e-mail já existe.
5. Calcula o hash da senha.
6. Inicia transação no MySQL.
7. Cria usuário, configurações e conta principal.
8. Confirma todas as alterações juntas.
9. Devolve usuário criado sem devolver a senha.
```

O banco recebe valores por placeholders `?`. Isso separa os dados do texto SQL e impede que texto digitado pelo usuário altere o significado da consulta.

### 3. Entenda o que é dado no cliente

O cliente representa o estado atual da interface, mas não é uma fonte segura para valores financeiros. Pode guardar:

- Token da sessão;
- dados do usuário já autenticado;
- preferência de tema;
- textos digitados ainda não enviados;
- filtros temporários;
- indicador de carregamento;
- mensagem de erro ou sucesso.

Não confie no celular para calcular saldo ou aceitar uma operação inválida. Toda regra financeira relevante precisa existir ou ser confirmada no backend.

### 4. Fluxo de uma transação

Ao salvar uma receita ou despesa:

```text
Formulário
  → verifica campos mínimos na interface
  → monta JSON ou FormData
  → obtém o token salvo
  → envia POST /financeiro/transacoes

API
  → valida token
  → valida tipo, valor, data, categoria e conta
  → inicia transação no banco
  → cria ou reutiliza categoria e conta
  → divide parcelamento quando necessário
  → registra meta ou recorrência
  → registra anexo e notificação
  → confirma tudo ou desfaz tudo

Aplicativo
  → mostra modal de sucesso
  → permite voltar ao fluxo financeiro
```

Se o arquivo já tiver sido gravado em disco e uma consulta posterior falhar, o código remove o arquivo temporário. Assim não permanece uma cópia sem vínculo com uma transação válida.

### 5. Fluxo de login

1. `Login.jsx` coleta e-mail e senha.
2. `api.js` envia `POST /auth/login`.
3. O backend procura o usuário pelo e-mail normalizado.
4. `bcrypt.compare` compara senha digitada com o hash salvo.
5. Em sucesso, o backend cria um JWT com o identificador do usuário e validade configurada.
6. `ContextoSessao.jsx` guarda o token e os dados públicos do usuário.
7. `Stack.Protected` libera as rotas privadas.
8. Ao encerrar sessão, o token local é removido.

O logout não precisa fazer o servidor “apagar” o próprio usuário. A ação remove a credencial disponível no aparelho e impede que o app continue chamando rotas privadas.

### 6. Fluxo de recuperação de senha

1. A tela solicita o e-mail.
2. O backend sempre responde de modo neutro para não revelar se o e-mail existe.
3. Quando o e-mail existe, gera código de seis dígitos.
4. A versão original não é guardada no banco: somente seu HMAC-SHA-256 é armazenado.
5. O código expira em 15 minutos.
6. Ao validar o código, a tela guarda temporariamente e-mail e código.
7. Ao alterar a senha, o backend trava a linha ativa, confere novamente o código e marca recuperações da conta como utilizadas.

Esse fluxo impede que vários pedidos concorrentes alterem a senha com o mesmo código. A comparação com o HMAC evita guardar o código de recuperação em texto simples no banco.

## Explicação prática dos estados da aplicação

### Estados aplicados e estados rascunho

Filtros têm duas versões:

- **Aplicado:** é o filtro que já mudou a lista exibida.
- **Rascunho:** é o que o usuário escolheu no modal, mas ainda não confirmou.

Antes de abrir o modal, o rascunho recebe uma cópia do filtro aplicado. Ao tocar em Cancelar, as escolhas temporárias são abandonadas. Ao tocar em Aplicar, dados válidos passam para os estados aplicados. Ao tocar em Limpar, ambos os grupos voltam ao estado “Todos”.

Isso evita que um usuário altere o modal e veja os resultados mudar antes de tocar em Aplicar.

### Estados de carga, erro e sucesso

A maioria das telas segue esta sequência:

1. `carregando = true`.
2. A tela mostra um indicador.
3. Em sucesso, guarda os dados e limpa `erro`.
4. Em falha, guarda a mensagem de `erro`.
5. `carregando = false` remove o indicador.

Para evitar atualizar uma tela desmontada, efeitos e callbacks usam uma variável como `ativo`. Ao sair da tela, o cleanup executado pelo React muda essa variável para `false`; assim uma resposta atrasada não tenta atualizar estado inexistente.

## Fórmulas financeiras explicadas

### Saldo total

$$
SaldoTotal = SaldoInicial + ReceitasConfirmadas - DespesasConfirmadas
$$

Somente lançamentos confirmados até a data atual entram no cálculo realizado.

### Saldo disponível

$$
SaldoDisponivel = SaldoTotal - TotalReservadoNasMetas
$$

O valor reservado representa parte do dinheiro destinada a objetivos. Ele não desaparece automaticamente: depende de depósitos e retiradas registrados na meta.

### Projeção

$$
SaldoPrevisto = SaldoDisponivel + ReceitasPendentesEFuturas - DespesasPendentesEFuturas
$$

Esta fórmula é uma estimativa baseada em lançamentos já cadastrados. Ela não tenta adivinhar receitas ou gastos que ainda não existem no banco.

### Progresso da meta

$$
Progresso = \min\left(100, \frac{ValorAtual}{ValorObjetivo} \times 100\right)
$$

Se o objetivo é menor ou igual a zero, o projeto retorna zero para evitar divisão inválida. O resultado é limitado a cem por cento na barra visual.

### Variação percentual

$$
Variacao = \frac{ValorAtual - ValorAnterior}{ValorAnterior} \times 100
$$

Se o valor anterior for zero, o resultado não é uma divisão válida. Por isso o projeto usa `null` e apresenta uma mensagem como “sem comparação”.

### Parcelamento exato

Se o total tem `T` centavos e serão feitas `N` parcelas:

$$
Quociente = \left\lfloor\frac{T}{N}\right\rfloor
$$

$$
Resto = T \bmod N
$$

As primeiras `Resto` parcelas recebem um centavo a mais. Assim a soma das parcelas sempre volta exatamente ao total original.

Exemplo:

```text
R$ 10,00 = 1000 centavos
1000 / 3:
  primeira parcela: 334 centavos
  segunda parcela: 333 centavos
  terceira parcela: 333 centavos
  total: 1000 centavos
```

## Cálculo e segurança de datas

O projeto usa duas representações:

- `DD/MM/AAAA` para pessoas digitarem e lerem.
- `AAAA-MM-DD` para banco de dados e consultas.

O formulário não pode simplesmente trocar barras por hífens sem validar o mês e o dia. Por isso a aplicação confirma que o dia existe no mês informado. O backend faz uma validação semelhante.

Em mês curto, uma recorrência de dia 31 não cria uma data falsa como 31/02. Ela usa o último dia existente, por exemplo 28/02, e volta a 31 no mês seguinte que tenha dia 31.

## Lista rápida de arquivos importantes

| Arquivo | Para que serve |
|---|---|
| `src/app/_layout.jsx` | Monta provedores e proteção das rotas |
| `src/contextos/ContextoSessao.jsx` | Compartilha usuário e token |
| `src/contextos/ContextoTema.jsx` | Compartilha tema e cores |
| `src/servicos/api.js` | Centraliza chamadas HTTP |
| `src/servicos/sessao.js` | Salva/obtém/remove o token |
| `src/ganchos/useResumoFinanceiro.js` | Busca o resumo enquanto a tela está ativa |
| `src/ganchos/useOpcoesTransacao.js` | Busca categorias, contas e prepara anexos |
| `src/app/(tabs)/fluxoFinanceiro.jsx` | Lista, filtra e confirma movimentações |
| `backend/src/aplicativo.ts` | Configura Express, CORS, segurança e rotas |
| `backend/src/middlewares/autenticacao.ts` | Valida JWT |
| `backend/src/servicos/transacoes.ts` | Valida e grava receitas/despesas |
| `backend/src/servicos/financeiro.ts` | Calcula resumo, histórico e projeções |
| `backend/src/servicos/recorrencias.ts` | Cria lançamentos recorrentes |
| `bancoDados/estrutura.sql` | Cria a estrutura completa do banco |

## Ponto final para manutenção

Antes de alterar uma regra, identifique onde ela pertence:

- Aparência: `componentes/` e `style/style.js`.
- Navegação e estado global: `app/_layout.jsx` e `contextos/`.
- Entrada do usuário: telas e máscaras/validadores.
- Comunicação com API: `servicos/api.js` e serviços específicos.
- Segurança e autorização: middlewares e rotas protegidas.
- Regras financeiras críticas: serviços do backend.
- Estrutura e relacionamentos: arquivos SQL.

Validações no aplicativo melhoram a experiência. Validações no backend garantem segurança e consistência. Cálculos financeiros feitos no servidor são a fonte confiável exibida pelo aplicativo.