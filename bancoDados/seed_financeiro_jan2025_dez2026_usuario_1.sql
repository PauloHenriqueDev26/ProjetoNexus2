-- Carga fictícia para o usuário já existente id_usuario = 1.
-- Período: 01/01/2025 a 01/12/2026 (inclusive). Nenhum usuário é criado ou alterado.
-- Pode ser executado novamente: categorias, conta, configuração, metas, movimentações
-- e transações recebem verificações para não duplicar os registros desta carga.
-- Requer as tabelas e os tipos auxiliares de estrutura.sql já carregados.

USE nexus_finance;
SET @usuario_dados := 1;

-- Prévia: precisa retornar 1 para a carga encontrar o titular.
SELECT EXISTS(SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados) AS usuario_1_existe;

START TRANSACTION;

-- Obtém IDs pelos nomes para não depender de IDs fixos de categorias/tipos.
SET @tipo_receita := (SELECT id_tipo_transacao FROM tipos_transacao WHERE nome = 'Receita' LIMIT 1);
SET @tipo_despesa := (SELECT id_tipo_transacao FROM tipos_transacao WHERE nome = 'Despesa' LIMIT 1);
SET @status_confirmada := (SELECT id_status_transacao FROM status_transacao WHERE nome = 'Confirmada' LIMIT 1);
SET @status_pendente := (SELECT id_status_transacao FROM status_transacao WHERE nome = 'Pendente' LIMIT 1);

-- Cria apenas categorias necessárias que ainda não existam para o usuário ou como padrão global.
INSERT INTO categorias (id_usuario, id_tipo_transacao, nome, padrao, ativa)
SELECT @usuario_dados, tt.id_tipo_transacao, necessarias.nome, FALSE, TRUE
FROM (
  SELECT 'Receita' AS tipo, 'Salário' AS nome UNION ALL
  SELECT 'Receita', 'Freelance' UNION ALL
  SELECT 'Despesa', 'Moradia' UNION ALL
  SELECT 'Despesa', 'Serviços' UNION ALL
  SELECT 'Despesa', 'Alimentação' UNION ALL
  SELECT 'Despesa', 'Transporte' UNION ALL
  SELECT 'Despesa', 'Saúde' UNION ALL
  SELECT 'Despesa', 'Assinaturas' UNION ALL
  SELECT 'Despesa', 'Lazer' UNION ALL
  SELECT 'Despesa', 'Compras'
) AS necessarias
JOIN tipos_transacao tt ON tt.nome = necessarias.tipo
WHERE EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados)
  AND NOT EXISTS (
    SELECT 1 FROM categorias c
    WHERE c.nome = necessarias.nome
      AND c.id_tipo_transacao = tt.id_tipo_transacao
      AND c.ativa = TRUE
      AND (c.id_usuario IS NULL OR c.id_usuario = @usuario_dados)
  );

-- Reutiliza a primeira conta ativa do usuário. Só cria uma conta se ele ainda não tiver nenhuma.
INSERT INTO contas (id_usuario, id_tipo_conta, nome, saldo_inicial, ativa)
SELECT @usuario_dados, tc.id_tipo_conta, 'Conta principal', 0.00, TRUE
FROM tipos_conta tc
WHERE tc.nome = 'Conta Corrente'
  AND EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados)
  AND NOT EXISTS (
    SELECT 1 FROM contas c WHERE c.id_usuario = @usuario_dados AND c.ativa = TRUE
  )
LIMIT 1;

SET @conta_dados := (
  SELECT id_conta FROM contas
  WHERE id_usuario = @usuario_dados AND ativa = TRUE
  ORDER BY id_conta LIMIT 1
);

-- Não sobrescreve preferências que já existam; só garante a linha obrigatória de configuração.
INSERT INTO configuracoes (id_usuario)
SELECT @usuario_dados
WHERE EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados)
  AND NOT EXISTS (SELECT 1 FROM configuracoes WHERE id_usuario = @usuario_dados);

-- Dez metas: 2 concluídas, 5 em andamento abaixo de 75% e 3 em andamento acima de 75%.
-- As três metas avançadas mantêm status em_andamento para aparecerem como metas ativas.
INSERT INTO metas (id_usuario, nome, descricao, valor_objetivo, data_inicio, data_prazo, status)
SELECT @usuario_dados, m.nome, m.descricao, m.objetivo, m.inicio, m.prazo, m.status
FROM (
  SELECT 'Reserva de emergência da casa' AS nome,
         'Valor reservado para imprevistos da família.' AS descricao,
         900.00 AS objetivo, DATE('2025-01-01') AS inicio, DATE('2026-02-01') AS prazo,
         'concluida' AS status
  UNION ALL SELECT 'Notebook para trabalho autônomo', 'Equipamento comprado para atividades profissionais.',
         800.00, DATE('2025-02-01'), DATE('2026-03-01'), 'concluida'
  UNION ALL SELECT 'Viagem em família para o litoral', 'Viagem planejada com a família.',
         800.00, DATE('2025-03-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Manutenção do apartamento', 'Reparos e melhorias do apartamento.',
         800.00, DATE('2025-04-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Certificação profissional', 'Formação para ampliar as oportunidades de trabalho.',
         800.00, DATE('2025-05-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Celular para uso profissional', 'Planejamento financeiro familiar.',
         700.00, DATE('2025-06-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Fundo para consultas e exames', 'Planejamento financeiro familiar.',
         600.00, DATE('2025-07-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Bicicleta para deslocamento', 'Planejamento financeiro familiar.',
         500.00, DATE('2025-08-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Presentes de fim de ano da família', 'Planejamento financeiro familiar.',
         450.00, DATE('2025-09-01'), DATE('2026-12-01'), 'em_andamento'
  UNION ALL SELECT 'Reforma do quarto', 'Planejamento financeiro familiar.',
         400.00, DATE('2025-10-01'), DATE('2026-12-01'), 'em_andamento'
) AS m
WHERE EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados)
  AND NOT EXISTS (
    SELECT 1 FROM metas existente
    WHERE existente.id_usuario = @usuario_dados AND existente.nome = m.nome
  );

-- Uma movimentação por meta determina seu saldo/progresso. As cinco metas comuns ficam abaixo de 75%.
INSERT INTO movimentacoes_metas (id_meta, tipo, valor, data_movimentacao, descricao)
SELECT m.id_meta, 'deposito', valores.valor, valores.data_movimentacao,
       CONCAT('Aporte para ', m.nome)
FROM (
  SELECT 'Reserva de emergência da casa' AS nome, 900.00 AS valor, DATE('2026-01-15') AS data_movimentacao
  UNION ALL SELECT 'Notebook para trabalho autônomo', 800.00, DATE('2026-02-15')
  UNION ALL SELECT 'Viagem em família para o litoral', 620.00, DATE('2026-11-10')
  UNION ALL SELECT 'Manutenção do apartamento', 680.00, DATE('2026-10-10')
  UNION ALL SELECT 'Certificação profissional', 750.00, DATE('2026-09-10')
  UNION ALL SELECT 'Celular para uso profissional', 400.00, DATE('2026-08-10')
  UNION ALL SELECT 'Fundo para consultas e exames', 300.00, DATE('2026-07-10')
  UNION ALL SELECT 'Bicicleta para deslocamento', 250.00, DATE('2026-06-10')
  UNION ALL SELECT 'Presentes de fim de ano da família', 200.00, DATE('2026-05-10')
  UNION ALL SELECT 'Reforma do quarto', 150.00, DATE('2026-04-10')
) AS valores
JOIN metas m ON m.id_usuario = @usuario_dados AND m.nome = valores.nome
WHERE NOT EXISTS (
  SELECT 1 FROM movimentacoes_metas existente
  WHERE existente.id_meta = m.id_meta
    AND existente.descricao = CONCAT('Aporte para ', m.nome)
);

-- Gera salário mensal de R$ 1.600,00 no dia 1, despesas comuns e pequenos freelances ocasionais.
-- Os gastos variam levemente por mês; o valor das parcelas mensais segue o salário informado.
-- O último mês pode gerar somente eventos até 01/12/2026, inclusive.
INSERT INTO transacoes (
  id_usuario, id_conta, id_categoria, id_tipo_transacao, id_status_transacao,
  descricao, valor, data_transacao
)
WITH RECURSIVE meses AS (
  SELECT 0 AS indice, DATE('2025-01-01') AS inicio_mes
  UNION ALL
  SELECT indice + 1, DATE_ADD(inicio_mes, INTERVAL 1 MONTH)
  FROM meses
  WHERE indice < 23
), modelos AS (
  -- tipo, categoria, descrição, valor base, passo da variação (centavos), faixa (centavos), dia, intervalo mensal e fase
  SELECT 'Receita' AS tipo, 'Salário' AS categoria, 'Salário mensal' AS descricao,
         1600.00 AS valor_base, 0 AS passo_centavos, 0 AS faixa_centavos, 1 AS dia, 1 AS intervalo, 0 AS fase
  UNION ALL SELECT 'Despesa', 'Moradia', 'Aluguel e condomínio', 450.00, 317, 3500, 5, 1, 0
  UNION ALL SELECT 'Despesa', 'Serviços', 'Conta de energia', 75.00, 713, 3500, 7, 1, 0
  UNION ALL SELECT 'Despesa', 'Serviços', 'Conta de água', 40.00, 319, 1500, 8, 1, 0
  UNION ALL SELECT 'Despesa', 'Serviços', 'Internet e telefone', 80.00, 487, 1800, 10, 1, 0
  UNION ALL SELECT 'Despesa', 'Alimentação', 'Mercado - compra principal', 180.00, 1199, 6500, 12, 1, 0
  UNION ALL SELECT 'Despesa', 'Transporte', 'Transporte público e aplicativos', 95.00, 557, 3000, 15, 1, 0
  UNION ALL SELECT 'Despesa', 'Saúde', 'Farmácia e higiene', 25.00, 739, 3000, 17, 1, 0
  UNION ALL SELECT 'Despesa', 'Assinaturas', 'Streaming e serviços digitais', 24.90, 0, 0, 18, 1, 0
  UNION ALL SELECT 'Despesa', 'Alimentação', 'Mercado - reposição', 145.00, 887, 5000, 21, 1, 0
  UNION ALL SELECT 'Despesa', 'Lazer', 'Lazer e refeição fora', 40.00, 1709, 6500, 25, 1, 0
  UNION ALL SELECT 'Despesa', 'Compras', 'Produtos para casa', 55.00, 911, 3500, 14, 3, 1
  UNION ALL SELECT 'Despesa', 'Compras', 'Roupa e calçados', 80.00, 1301, 7000, 19, 4, 2
  UNION ALL SELECT 'Receita', 'Freelance', 'Serviço freelance eventual', 140.00, 1703, 8000, 28, 4, 0
), movimentos AS (
  SELECT e.tipo, e.categoria, e.descricao,
         ROUND(e.valor_base + MOD(m.indice * e.passo_centavos, GREATEST(e.faixa_centavos, 1)) / 100, 2) AS valor,
         DATE_ADD(m.inicio_mes, INTERVAL (e.dia - 1) DAY) AS data_movimento
  FROM meses m CROSS JOIN modelos e
  WHERE MOD(m.indice, e.intervalo) = e.fase
)
SELECT @usuario_dados,
       @conta_dados,
       (
         SELECT c.id_categoria
         FROM categorias c
         WHERE c.nome = movimentos.categoria
           AND c.id_tipo_transacao = tt.id_tipo_transacao
           AND c.ativa = TRUE
           AND (c.id_usuario IS NULL OR c.id_usuario = @usuario_dados)
         ORDER BY (c.id_usuario = @usuario_dados) DESC, c.padrao DESC, c.id_categoria
         LIMIT 1
       ),
       tt.id_tipo_transacao,
       st.id_status_transacao,
       movimentos.descricao,
       movimentos.valor,
       movimentos.data_movimento
FROM movimentos
JOIN tipos_transacao tt ON tt.nome = movimentos.tipo
JOIN status_transacao st
  ON st.nome = CASE
    WHEN movimentos.data_movimento > CURDATE() THEN 'Pendente'
    ELSE 'Confirmada'
  END
WHERE EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @usuario_dados)
  AND @conta_dados IS NOT NULL
  AND @status_confirmada IS NOT NULL
  AND @status_pendente IS NOT NULL
  AND movimentos.data_movimento BETWEEN DATE('2025-01-01') AND DATE('2026-12-01')
  AND NOT EXISTS (
    SELECT 1 FROM transacoes existente
    WHERE existente.id_usuario = @usuario_dados
      AND existente.descricao = movimentos.descricao
      AND existente.data_transacao = movimentos.data_movimento
  );

COMMIT;

-- Conferência da carga: totais por tipo/status e percentual de cada meta inserida.
SELECT tt.nome AS tipo, st.nome AS status, COUNT(*) AS quantidade, SUM(t.valor) AS total
FROM transacoes t
JOIN tipos_transacao tt USING (id_tipo_transacao)
JOIN status_transacao st USING (id_status_transacao)
WHERE t.id_usuario = @usuario_dados
  AND (t.descricao = 'Salário mensal' OR t.descricao = 'Aluguel e condomínio' OR t.descricao = 'Conta de energia' OR t.descricao = 'Conta de água' OR t.descricao = 'Internet e telefone' OR t.descricao = 'Mercado - compra principal' OR t.descricao = 'Transporte público e aplicativos' OR t.descricao = 'Farmácia e higiene' OR t.descricao = 'Streaming e serviços digitais' OR t.descricao = 'Mercado - reposição' OR t.descricao = 'Lazer e refeição fora' OR t.descricao = 'Produtos para casa' OR t.descricao = 'Roupa e calçados' OR t.descricao = 'Serviço freelance eventual')
  AND t.data_transacao BETWEEN DATE('2025-01-01') AND DATE('2026-12-01')
GROUP BY tt.nome, st.nome
ORDER BY tt.nome, st.nome;

SELECT m.nome, m.status, m.valor_objetivo,
       COALESCE(SUM(CASE WHEN mm.tipo = 'deposito' THEN mm.valor ELSE -mm.valor END), 0) AS valor_acumulado,
       ROUND(100 * COALESCE(SUM(CASE WHEN mm.tipo = 'deposito' THEN mm.valor ELSE -mm.valor END), 0) / m.valor_objetivo, 2) AS percentual
FROM metas m
LEFT JOIN movimentacoes_metas mm ON mm.id_meta = m.id_meta
WHERE m.id_usuario = @usuario_dados
  AND m.nome IN ('Reserva de emergência da casa', 'Notebook para trabalho autônomo', 'Viagem em família para o litoral', 'Manutenção do apartamento', 'Certificação profissional', 'Celular para uso profissional', 'Fundo para consultas e exames', 'Bicicleta para deslocamento', 'Presentes de fim de ano da família', 'Reforma do quarto')
GROUP BY m.id_meta, m.nome, m.status, m.valor_objetivo
ORDER BY m.id_meta;