import { RowDataPacket } from 'mysql2';
import { bancoDados } from "../bancoDados/bancoDados";

// Mantém o dia original como referência, inclusive depois de fevereiro e de meses curtos.
export function dataMensal(iniciar: string, deslocamento: number): string {
  const [ano, mes, dia] = iniciar.split('-').map(Number);
  const last = new Date(Date.UTC(ano, mes + deslocamento, 0));
  return new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(dia, last.getUTCDate()))).toISOString().slice(0, 10);
}
// Serviço de recorrências mensais.
// Para cada regra ativa, gera cópias pendentes da transação original até o fim do mês atual ou da data final.
// Trava as regras durante o processamento para evitar duplicações em execuções concorrentes.
export async function gerarRecorrencias(idUsuario?: number) {
  const conexao = await bancoDados.getConnection();
  try {
    await conexao.beginTransaction();
    // O bloqueio inclui o cursor e as inserções; novas tentativas e instâncias concorrentes não duplicam ocorrências.
    const [regras] = await conexao.query<RowDataPacket[]>(`SELECT r.*,
      DATE_FORMAT(r.data_inicio, '%Y-%m-%d') AS inicio,
      DATE_FORMAT(r.data_fim, '%Y-%m-%d') AS fim,
      DATE_FORMAT(r.ultima_geracao, '%Y-%m-%d') AS ultima,
      DATE_FORMAT(LAST_DAY(CURDATE()), '%Y-%m-%d') AS limite
      FROM recorrencias r WHERE r.ativa = TRUE AND r.frequencia = 'mensal'
      ${idUsuario === undefined ? '' : 'AND r.id_usuario = ?'} ORDER BY r.id_recorrencia FOR UPDATE`, idUsuario === undefined ? [] : [idUsuario]);
    for (const regra of regras) {
      const limite = regra.fim && regra.fim < regra.limite ? regra.fim : regra.limite;
      // `ultima_geracao` funciona como cursor: retomamos no mês posterior à última cópia.
  // Na primeira execução, usamos a data inicial e começamos no mês seguinte à origem.
  const last = regra.ultima || regra.inicio;
      const [y, m] = regra.inicio.split('-').map(Number);
      const [ly, lm] = last.split('-').map(Number);
      for (let deslocamento = Math.max(1, (ly - y) * 12 + lm - m + 1);; deslocamento++) {
        // A data é calculada a partir da origem (não da ocorrência anterior), evitando
      // que um fevereiro curto desloque permanentemente recorrências do dia 29, 30 ou 31.
      const data = dataMensal(regra.inicio, deslocamento);
        if (data > limite) break;
        await conexao.execute(`INSERT INTO transacoes
          (id_usuario, id_conta, id_categoria, id_tipo_transacao, id_status_transacao, descricao, valor, data_transacao, observacao)
          SELECT t.id_usuario, t.id_conta, t.id_categoria, t.id_tipo_transacao, s.id_status_transacao, t.descricao, t.valor, ?, t.observacao
          FROM transacoes t CROSS JOIN status_transacao s
          WHERE t.id_transacao = ? AND t.id_usuario = ? AND s.nome = 'Pendente'`, [data, regra.id_transacao_origem, regra.id_usuario]);
        await conexao.execute('UPDATE recorrencias SET ultima_geracao = ? WHERE id_recorrencia = ?', [data, regra.id_recorrencia]);
      }
    }
    await conexao.commit();
  } catch (falha) {
    await conexao.rollback();
    throw falha;
  } finally {
    conexao.release();
  }
}
