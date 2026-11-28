import { RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { bancoDados } from "../bancoDados/bancoDados";
// Serviço de cálculos e agregações financeiras.
// Produz histórico de 12 meses, projeção do mês atual, categorias de despesas, metas reservadas e variações.
// Usa centavos internamente para reduzir erros de ponto flutuante em operações monetárias.
export const centavos = (valor: number | string) => Math.round(Number(valor) * 100);
export const diferencaMonetaria = (a: number, b: number) => (centavos(a) - centavos(b)) / 100;
export function periodosMensais(hoje: string) {
  const [ano, mes] = hoje.split('-').map(Number);
  return Array.from({
    length: 12
  }, (_, i) => new Date(Date.UTC(ano, mes - 12 + i, 1)).toISOString().slice(0, 7));
}
export async function resumoFinanceiro(idUsuario: number) {
  const conexao = await bancoDados.getConnection();
  try {
    // Snapshot consistente do MySQL: todas as consultas abaixo enxergam os mesmos dados.
    // Sem isso, uma confirmação concorrente poderia aparecer em uma consulta e faltar em outra.
    await conexao.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await conexao.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
    const resumo = await lerResumo(conexao, idUsuario);
    await conexao.commit();
    return resumo;
  } catch (falha) {
    await conexao.rollback();
    throw falha;
  } finally {
    conexao.release();
  }
}
async function lerResumo(conexao: PoolConnection, idUsuario: number) {
  // Todas as consultas leem o mesmo retrato, mesmo se outra requisição confirmar uma transação ao mesmo tempo.
  const [[linha]] = await conexao.query<RowDataPacket[]>(`SELECT
    DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoje,
    (SELECT COALESCE(SUM(saldo_inicial), 0) FROM contas WHERE id_usuario = ?) AS inicial,
    COALESCE(SUM(CASE WHEN st.nome = 'Confirmada' AND t.data_transacao <= CURDATE()
      THEN IF(tt.nome = 'Receita', t.valor, -t.valor) ELSE 0 END), 0) AS realizado,
    COALESCE(SUM(CASE WHEN (
      (st.nome = 'Pendente' AND t.data_transacao >= DATE_FORMAT(CURDATE(), '%Y-%m-01'))
      OR (st.nome = 'Confirmada' AND t.data_transacao > CURDATE())
    ) AND t.data_transacao <= LAST_DAY(CURDATE())
      THEN IF(tt.nome = 'Receita', t.valor, -t.valor) ELSE 0 END), 0) AS aRealizar
    FROM transacoes t JOIN tipos_transacao tt USING (id_tipo_transacao)
    JOIN status_transacao st USING (id_status_transacao)
    WHERE t.id_usuario = ? AND st.nome <> 'Cancelada'`, [idUsuario, idUsuario]);
  const hoje = String(linha.hoje);
  // Metas são objetivos internos de planejamento e seus depósitos não são
  // despesas nem retiram dinheiro da conta. Por isso não entram no cálculo do saldo.
  const [[linhaDespesasPeriodoAnterior]] = await conexao.query<RowDataPacket[]>(`SELECT
      COALESCE(SUM(t.valor), 0) AS total
    FROM transacoes t
    JOIN tipos_transacao tt USING (id_tipo_transacao)
    JOIN status_transacao st USING (id_status_transacao)
    WHERE t.id_usuario = ?
      AND tt.nome = 'Despesa'
      AND st.nome = 'Confirmada'
      AND t.data_transacao >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
      AND t.data_transacao <= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`, [idUsuario]);
  const periodos = periodosMensais(hoje);
  const periodoAtual = periodos[11];
  const [categoriasBase] = await conexao.query<RowDataPacket[]>(`SELECT c.nome
    FROM categorias c
    JOIN tipos_transacao tt USING (id_tipo_transacao)
    WHERE tt.nome = 'Despesa' AND c.ativa = TRUE AND (c.id_usuario IS NULL OR c.id_usuario = ?)
    ORDER BY c.padrao DESC, c.nome`, [idUsuario]);
  const [linhas] = await conexao.query<RowDataPacket[]>(`SELECT
    DATE_FORMAT(t.data_transacao, '%Y-%m') AS periodo, tt.nome AS tipo, c.nome AS categoria,
    (st.nome = 'Confirmada' AND t.data_transacao <= ?) AS realizado, SUM(t.valor) AS valor
    FROM transacoes t JOIN tipos_transacao tt USING (id_tipo_transacao)
    JOIN status_transacao st USING (id_status_transacao) JOIN categorias c USING (id_categoria)
    WHERE t.id_usuario = ? AND st.nome <> 'Cancelada' AND t.data_transacao >= ? AND t.data_transacao <= LAST_DAY(?)
    GROUP BY periodo, tt.nome, c.nome, realizado`, [hoje, idUsuario, `${periodos[0]}-01`, hoje]);
  // Criamos os doze meses antes de acumular para preservar meses sem movimentação com zeros.
  // Isso também garante que telas e gráficos recebam sempre uma série de tamanho fixo.
  const historico = periodos.map(periodo => ({
    periodo,
    receitas: 0,
    despesas: 0,
    saldo: 0
  }));
  // Separação usada pela projeção:
  // realizado = Confirmada e com data igual ou anterior à data de referência;
  // previsto = Pendente ou com data futura dentro deste mês;
  // cancelada = não entra em nenhum dos valores.
  const previsao = {
    totalReceitas: 0,
    totalDespesas: 0,
    receitasRealizadas: 0,
    despesasRealizadas: 0,
    receitasPrevistas: 0,
    despesasPrevistas: 0,
    saldoRealizado: 0,
    saldoPrevistoRestante: 0,
    saldo: 0
  };
  const categorias = new Map<string, number>();
  for (const categoria of categoriasBase) {
    categorias.set(String(categoria.nome), 0);
  }
  // O SQL já agrupou por mês, tipo e categoria; aqui separamos realizado de previsto.
  // Todos os acumuladores monetários ficam em centavos até o objeto final de resposta.
  for (const item of linhas) {
    const valor = centavos(item.valor);
    if (item.periodo === periodoAtual) {
      if (item.tipo === 'Receita') previsao.totalReceitas += valor;else previsao.totalDespesas += valor;
      const realizadas = Number(item.realizado) === 1;
      if (item.tipo === 'Receita') {
        if (realizadas) {
          previsao.receitasRealizadas += valor;
          previsao.saldoRealizado += valor;
        } else {
          previsao.receitasPrevistas += valor;
          previsao.saldoPrevistoRestante += valor;
        }
      } else if (realizadas) {
        previsao.despesasRealizadas += valor;
        previsao.saldoRealizado -= valor;
      } else {
        previsao.despesasPrevistas += valor;
        previsao.saldoPrevistoRestante -= valor;
      }
    }
    if (!Number(item.realizado)) continue;
    const mes = historico.find(m => m.periodo === item.periodo)!;
    if (item.tipo === 'Receita') mes.receitas += valor;else {
      mes.despesas += valor;
      if (item.periodo === periodoAtual) categorias.set(item.categoria, (categorias.get(item.categoria) || 0) + valor);
    }
  }
  historico.forEach(m => {
    m.saldo = (m.receitas - m.despesas) / 100;
    m.receitas /= 100;
    m.despesas /= 100;
  });
  previsao.saldo = (previsao.totalReceitas - previsao.totalDespesas) / 100;
  previsao.totalReceitas /= 100;
  previsao.totalDespesas /= 100;
  previsao.receitasRealizadas /= 100;
  previsao.despesasRealizadas /= 100;
  previsao.receitasPrevistas /= 100;
  previsao.despesasPrevistas /= 100;
  previsao.saldoRealizado /= 100;
  previsao.saldoPrevistoRestante /= 100;
  // A soma dos dois saldos deve resultar no resultado esperado do mês.
  const totais = (i: number) => ({
    totalReceitas: historico[i].receitas,
    totalDespesas: historico[i].despesas,
    saldo: historico[i].saldo
  });
  const atual = totais(11),
    anterior = totais(10);
  const diferenca = diferencaMonetaria(atual.saldo, anterior.saldo);
  const despesasPeriodoAnterior = centavos(linhaDespesasPeriodoAnterior.total) / 100;
  const diferencaDespesas = diferencaMonetaria(atual.totalDespesas, despesasPeriodoAnterior);
  // O disponível representa o saldo real das contas. Contribuições às metas
  // continuam sendo recursos já existentes e não são despesas nem reservas que reduzem esse saldo.
  const saldoTotal = (centavos(linha.inicial) + centavos(linha.realizado)) / 100;
  const saldoReservadoMetas = 0;
  const saldoDisponivel = saldoTotal;
  return {
    dataReferencia: hoje,
    saldoTotal: saldoTotal,
    saldoReservadoMetas: saldoReservadoMetas,
    saldoDisponivel: saldoDisponivel,
    saldoPrevisto: (centavos(saldoDisponivel) + centavos(linha.aRealizar)) / 100,
    atual: atual,
    anterior: anterior,
    previsao: previsao,
    economia: {
      diferenca: diferenca,
      percentual: anterior.saldo === 0 ? null : diferenca / Math.abs(anterior.saldo) * 100
    },
    variacaoDespesas: {
      atual: atual.totalDespesas,
      anterior: despesasPeriodoAnterior,
      diferenca: diferencaDespesas,
      percentual: despesasPeriodoAnterior === 0 ? null : diferencaDespesas / despesasPeriodoAnterior * 100
    },
    categorias: [...categorias].map(([nome, valor]) => ({
      nome,
      valor: valor / 100
    })).sort((a, b) => b.valor - a.valor),
    historico: historico
  };
}
