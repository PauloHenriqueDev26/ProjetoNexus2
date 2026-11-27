import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from '@expo/vector-icons/MaterialIcons';
import GraficoMedido from './GraficoMedido';
import CartaoPainel from './CartaoPainel';
import { useSessao } from '../contextos/ContextoSessao';
import { useEstilosTema } from '../contextos/ContextoTema';
import { useEstilosApp } from '../style/style';
import { apiAutenticada, formatarReais } from '../servicos/financeiro';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = periodo => `${MESES[Number(periodo.slice(5, 7)) - 1]}/${periodo.slice(2, 4)}`;

// Níveis de alerta do limite:
// - Verde: até 69,9%, gasto ainda dentro de uma faixa confortável;
// - Laranja: de 70% a 99,9%, limite merece atenção;
// - Vermelho: a partir de 100%, limite atingido ou ultrapassado.
function obterCorPorPercentual(percentual, cores) {
  if (!Number.isFinite(percentual) || percentual <= 0) return cores.sucesso;
  if (percentual >= 100) return cores.perigo;
  if (percentual >= 70) return cores.graficoLaranja;
  return cores.sucesso;
}

function obterSituacaoPorPercentual(percentual) {
  if (!Number.isFinite(percentual) || percentual <= 0) return 'Dentro do planejado';
  if (percentual >= 100) return 'Limite atingido ou ultrapassado';
  if (percentual >= 70) return 'Atenção: limite perto do máximo';
  return 'Dentro do planejado';
}

function Cartao({ titulo, subtitulo, children, style, aoExportar, exportando }) {
  const estilos = useEstilosTema(criarEstilos);
  const { cores } = useEstilosApp();
  return <CartaoPainel style={style}>
    <View style={estilos.cabecalho}>
      <View style={estilos.titulos}>
        <Text accessibilityRole="header" style={estilos.titulo}>{titulo}</Text>
        {!!subtitulo && <Text style={estilos.legenda}>{subtitulo}</Text>}
      </View>
      {aoExportar && <Pressable accessibilityRole="button" accessibilityLabel={`Baixar PDF de ${titulo}`} disabled={exportando} onPress={aoExportar} style={estilos.botaoBaixar}>
        <Icon name={exportando ? 'hourglass-empty' : 'file-download'} size={19} color={cores.primaria} />
      </Pressable>}
    </View>
    {children}
  </CartaoPainel>;
}


export default function VisaoFinanceira({ dados, aoExportar, exportando = false, aoAdicionarLimite }) {
  const estilos = useEstilosTema(criarEstilos);
  const { cores } = useEstilosApp();
  const { autenticado } = useSessao();
  const { width: largura, fontScale } = useWindowDimensions();
  const [modalLimiteVisivel, setModalLimiteVisivel] = useState(false);
  const [valorTotalLimite, setValorTotalLimite] = useState('');
  const [limiteTotal, setLimiteTotal] = useState(0);
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false);

  useEffect(() => {
    if (!autenticado) {
      setLimiteTotal(0);
      return;
    }

    let ativo = true;
    async function carregarLimite() {
      try {
        const configuracoes = await apiAutenticada('/configuracoes');
        if (!ativo) return;
        setLimiteTotal(Number(configuracoes?.limiteGastoTotal || 0));
      } catch {
        if (ativo) setLimiteTotal(0);
      }
    }

    carregarLimite();
    return () => {
      ativo = false;
    };
  }, [autenticado]);

  const larguraGrande = largura >= 900 && fontScale <= 1.3;
  const historico = (dados.historico || []).slice(-6);
  const previsao = dados.previsao || { totalReceitas: 0, totalDespesas: 0, saldo: 0 };
  const categorias = dados.categorias || [];
  const referencia = dados.dataReferencia ? `${dados.dataReferencia.slice(8, 10)}/${dados.dataReferencia.slice(5, 7)}/${dados.dataReferencia.slice(0, 4)}` : 'Mês atual';
  const chartPalette = {
    backgroundGradientFrom: cores.superficie,
    backgroundGradientTo: cores.superficie,
    decimalPlaces: 0,
    color: () => cores.primaria,
    labelColor: () => cores.textoSecundario,
    propsForBackgroundLines: { stroke: cores.divisor, strokeDasharray: '4 6' },
    propsForLabels: { fontSize: 10 },
  };

  const abrirModalLimite = () => {
    if (typeof aoAdicionarLimite === 'function') {
      aoAdicionarLimite();
      return;
    }
    setModalLimiteVisivel(true);
  };

  const fecharModalLimite = () => {
    setModalLimiteVisivel(false);
    setValorTotalLimite('');
  };

  const salvarLimite = async () => {
    const valorNumerico = Number(String(valorTotalLimite).replace(/[R$\s.]/g, '').replace(',', '.'));

    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) return;

    setLimiteTotal(valorNumerico);
    if (autenticado) {
      try {
        await apiAutenticada('/configuracoes', {
          method: 'PUT',
          body: JSON.stringify({ limiteGastoTotal: valorNumerico })
        });
      } catch {
      }
    }
    fecharModalLimite();
  };

  // MESES converte número do período em abreviação; rotuloMes monta jan/26, por exemplo.
  // obterCorPorPercentual usa verde, amarelo ou vermelho conforme proximidade do limite.
  // obterSituacaoPorPercentual fornece a mensagem correspondente ao percentual.
  // Só mostramos categorias que tiveram gasto no mês atual.
  // Categorias com valor zero não recebem limite próprio nem confundem o usuário.
  const listaLimites = categorias.length
    ? categorias
        .map(item => ({ nome: item.nome, valor: Number(item.valor) || 0 }))
        .filter(item => item.valor > 0)
    : [];
  const listaLimitesOrdenada = [...listaLimites].sort((a, b) => b.valor - a.valor);
  const categoriasVisiveis = mostrarTodasCategorias ? listaLimitesOrdenada : listaLimitesOrdenada.slice(0, 5);
  const temCategorias = listaLimitesOrdenada.length > 0;
  const totalGasto = listaLimitesOrdenada.reduce((acumulador, item) => acumulador + item.valor, 0);
  // limiteDefinido informa se o usuário configurou um teto maior que zero.
  const limiteDefinido = limiteTotal > 0;
  // Sem limite definido, não faz sentido calcular disponível por subtração: disponível fica neutro em R$ 0,00.
  const valorDisponivel = limiteDefinido ? limiteTotal - totalGasto : 0;
  // A barra geral só recebe um percentual real quando existe limite configurado.
  const percentualUtilizado = limiteDefinido ? (totalGasto / limiteTotal) * 100 : 0;
  const corGastoTotal = limiteDefinido ? obterCorPorPercentual(percentualUtilizado, cores) : cores.textoSecundario;
  // Sem limite, orienta o usuário a definir o teto; com limite, usa a situação pelos percentuais.
  const situacaoGastoTotal = limiteDefinido ? obterSituacaoPorPercentual(percentualUtilizado) : 'Defina um limite para acompanhar';
  const existemMaisCategorias = listaLimitesOrdenada.length > 5;

  return <View style={estilos.visaoGeral}>
    <View style={[estilos.grade, larguraGrande && estilos.duasColunas]}>
      <Cartao titulo="Evolução do resultado" subtitulo="Receitas menos despesas realizadas" aoExportar={aoExportar ? () => aoExportar('resultados') : undefined} exportando={exportando} style={larguraGrande && estilos.coluna}>
        {historico.length ? <GraficoMedido>
          {width => <LineChart data={{ labels: historico.map(item => rotuloMes(item.periodo)), datasets: [{ data: historico.map(item => Number(item.saldo) || 0) }] }} width={width} height={210} fromZero withShadow={false} withOuterLines={false} bezier formatYLabel={valor => Number(valor).toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })} chartConfig={chartPalette} style={estilos.chartKit} />}
        </GraficoMedido> : <Text style={estilos.vazio}>Ainda não há histórico suficiente para exibir a evolução.</Text>}
        {!!historico.length && <Text style={estilos.nota}>O mês atual considera os valores até a data de referência.</Text>}
      </Cartao>

      <Cartao titulo="Estimativa do mês" subtitulo={`Previsão até o fim do mês · ${referencia}`} aoExportar={aoExportar ? () => aoExportar('indicadores') : undefined} exportando={exportando} style={larguraGrande && estilos.coluna}>
        {/* Receita estimada = realizada + prevista; despesa estimada = realizada + prevista. */}
        {[
          ['Receitas do mês', previsao.totalReceitas, previsao.receitasRealizadas, previsao.receitasPrevistas, cores.sucesso],
          ['Despesas do mês', previsao.totalDespesas, previsao.despesasRealizadas, previsao.despesasPrevistas, cores.perigo],
        ].map(([nome, total, realizado, previsto, cor]) => {
          const realizadoSeguro = Number(realizado) || 0;
          const previstoSeguro = Number(previsto) || 0;
          const totalSeguro = Number(total) || realizadoSeguro + previstoSeguro;
          const percentualRealizado = totalSeguro > 0 ? Math.min(100, (realizadoSeguro / totalSeguro) * 100) : 0;

          return <View key={nome} style={estilos.linhaResumo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <Text style={estilos.rotulo}>{nome}</Text>
              <Text style={[estilos.valorResumo, { color: cor }]}>{formatarReais(totalSeguro)}</Text>
            </View>
            <View style={{ height: 7, borderRadius: 5, backgroundColor: cores.superficieElevada, overflow: 'hidden', marginTop: 8 }}>
              <View style={{ height: '100%', width: `${percentualRealizado}%`, borderRadius: 5, backgroundColor: cor }} />
            </View>
            <Text style={estilos.pequeno}>
              Já realizado: {formatarReais(realizadoSeguro)} · Ainda previsto: {formatarReais(previstoSeguro)}
            </Text>
          </View>;
        })}

        <View style={{ paddingVertical: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: cores.divisor }}>
          <Text style={estilos.rotulo}>Resultado estimado do mês</Text>
          <Text style={{ color: Number(previsao.saldo) < 0 ? cores.perigo : cores.sucesso, fontSize: 20, fontWeight: '800', marginTop: 4 }}>
            {formatarReais(previsao.saldo)}
          </Text>
          <Text style={estilos.pequeno}>
            Receitas estimadas menos despesas estimadas deste mês. Não inclui o saldo que já existia antes do mês.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            <View style={{ flexGrow: 1, flexBasis: 145, padding: 12, borderRadius: 12, backgroundColor: "#282727", borderWidth: 1, borderColor: cores.borda }}>
              <Text style={estilos.rotuloResumo}>Saldo disponível agora</Text>
              <Text style={{ color: Number(dados.saldoDisponivel) < 0 ? cores.perigo : cores.sucesso, fontSize: 16, fontWeight: '800', marginTop: 4 }}>
                {formatarReais(dados.saldoDisponivel)}
              </Text>
              <Text style={estilos.pequeno}>Já considera o que ocorreu até hoje.</Text>
            </View>

            <View style={{flexGrow: 1, flexBasis: 145, padding: 12, borderRadius: 12, backgroundColor: "#282727", borderWidth: 1, borderColor: cores.borda }}>
              <Text style={estilos.rotuloResumo}>Saldo no fim do mês</Text>
              <Text style={{ color: Number(dados.saldoPrevisto) < 0 ? cores.perigo : cores.textoLink, fontSize: 16, fontWeight: '800', marginTop: 4 }}>
                {formatarReais(dados.saldoPrevisto)}
              </Text>
              <Text style={estilos.pequeno}>Saldo atual mais receitas previstas menos despesas previstas.</Text>
            </View>
          </View>

          <Text style={[estilos.pequeno, { marginTop: 10 }]}>Já realizado no mês: {formatarReais(previsao.saldoRealizado)} · Efeito dos lançamentos previstos: {formatarReais(previsao.saldoPrevistoRestante)}</Text>
        </View>

        <Text style={estilos.nota}>Inclui somente lançamentos confirmados, pendentes ou agendados até o fim deste mês; não adiciona valores que ainda não foram cadastrados.</Text>
      </Cartao>
    </View>

    <View style={[estilos.grade, larguraGrande && estilos.duasColunas]}>
      <Cartao
        titulo="Planejamento mensal"
        subtitulo="O limite abaixo vale para todas as despesas do mês."
      >
        {/* Cabeçalho do limite: valor único, botão de edição e estado geral. */}
        {limiteDefinido ? (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: cores.borda, backgroundColor: "#282727", padding: 14, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.rotuloResumo}>Limite mensal único</Text>
                <Text style={{ color: cores.textoPrincipal, fontSize: 24, lineHeight: 30, fontWeight: '800', marginTop: 3 }}>
                  {formatarReais(limiteTotal)}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Editar limite mensal" onPress={abrirModalLimite} style={estilos.botaoAdicionarContainer}>
                <Text style={estilos.textoBotaoLimite}>Editar limite</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.rotuloResumo}>Gasto no mês</Text>
                <Text style={{ color: corGastoTotal, fontSize: 17, fontWeight: '800', marginTop: 3 }}>{formatarReais(totalGasto)}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={estilos.rotuloResumo}>{valorDisponivel >= 0 ? 'Ainda disponível' : 'Acima do limite'}</Text>
                <Text style={{ color: valorDisponivel >= 0 ? corGastoTotal : cores.perigo, fontSize: 17, fontWeight: '800', marginTop: 3 }}>
                  {formatarReais(Math.abs(valorDisponivel))}
                </Text>
              </View>
            </View>

            <View style={{ height: 10, borderRadius: 6, backgroundColor: cores.superficieElevada, overflow: 'hidden', marginTop: 14 }}>
              <View style={{ height: '100%', width: `${Math.min(100, percentualUtilizado)}%`, borderRadius: 6, backgroundColor: corGastoTotal }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginTop: 7 }}>
              <Text style={[estilos.pequeno, { color: corGastoTotal, flex: 1 }]}>
                {percentualUtilizado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% utilizado
              </Text>
              <Text style={[estilos.pequeno, { color: corGastoTotal, flex: 1, textAlign: 'right' }]}>
                {situacaoGastoTotal}
              </Text>
            </View>
          </View>
        ) : (
          <View style={estilos.areaVazia}>
            <Text style={estilos.vazio}>Defina um único limite para todas as despesas deste mês.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Adicionar limite de gastos" onPress={abrirModalLimite} style={estilos.botaoAdicionarCentralizado}>
              <Text style={estilos.textoBotaoAdicionarVazio}>Adicionar limite</Text>
            </Pressable>
          </View>
        )}

        {/* Distribuição das despesas: separada do status do limite. */}
        {temCategorias ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, marginBottom: 2 }}>
              <Text style={{ color: cores.textoPrincipal, fontSize: 14, fontWeight: '700' }}>Distribuição por categoria</Text>
              <Text style={estilos.pequeno}>Do total gasto</Text>
            </View>

            {categoriasVisiveis.map((item, index) => {
              const valor = Number(item.valor) || 0;
              const participacao = totalGasto > 0 ? (valor / totalGasto) * 100 : 0;
              return <View key={`${item.nome}-${index}`} style={estilos.categoria}>
                <View style={estilos.categoriaCabecalho}>
                  <Text style={estilos.rotulo}>{item.nome}</Text>
                  <Text style={estilos.valorResumo}>{formatarReais(valor)}</Text>
                </View>
                <View style={estilos.trilho}>
                  <View style={[estilos.preenchimento, { width: `${Math.min(100, participacao)}%`, backgroundColor: cores.primaria }]} />
                </View>
                <Text style={estilos.pequeno}>{participacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% das despesas do mês</Text>
              </View>;
            })}

            {existemMaisCategorias && (
              <Pressable accessibilityRole="button" accessibilityLabel={mostrarTodasCategorias ? 'Ocultar outras categorias' : 'Mostrar outras categorias'} onPress={() => setMostrarTodasCategorias(valor => !valor)} style={estilos.botaoOutrasCategorias}>
                <Text style={estilos.textoBotaoOutrasCategorias}>{mostrarTodasCategorias ? 'Ver menos' : 'Ver outras categorias'}</Text>
                <Icon name={mostrarTodasCategorias ? 'arrow-upward' : 'arrow-forward'} size={15} color={cores.textoPrincipal} />
              </Pressable>
            )}
          </>
        ) : limiteDefinido ? (
          <Text style={estilos.vazio}>Nenhuma despesa realizada neste mês ainda.</Text>
        ) : null}
      </Cartao>
    </View>

    <Modal visible={modalLimiteVisivel} transparent animationType="fade" statusBarTranslucent onRequestClose={fecharModalLimite}>
      <Pressable style={estilos.fundoModal} onPress={fecharModalLimite}>
        <Pressable style={estilos.modalCartao} onPress={evento => evento.stopPropagation()}>
          <Text style={estilos.modalTitulo}>{limiteDefinido ? 'Editar limite mensal' : 'Definir limite mensal'}</Text>
          <Text style={estilos.modalDescricao}>
            Informe o teto máximo para todas as despesas do mês. Esse valor não será repetido para cada categoria: ele será dividido pelo consumo real de todas elas.
          </Text>

          <Text style={estilos.labelCampo}>Valor total do limite</Text>
          <TextInput
            style={estilos.campo}
            placeholder="R$ 0,00"
            placeholderTextColor={cores.textoIndicativo}
            value={valorTotalLimite}
            onChangeText={setValorTotalLimite}
            keyboardType="decimal-pad"
          />

          <View style={estilos.modalAcoes}>
            <Pressable style={[estilos.botaoModal, { backgroundColor: cores.primaria }]} onPress={fecharModalLimite}>
              <Text style={[estilos.textoBotaoModal, { color: cores.sobrePrimaria }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[
                estilos.botaoModal,
                estilos.botaoSecundario,
                (!valorTotalLimite || Number(String(valorTotalLimite).replace(/[R$\s.]/g, '').replace(',', '.')) <= 0) && estilos.botaoDesabilitado,
              ]}
              onPress={salvarLimite}
              disabled={!valorTotalLimite || Number(String(valorTotalLimite).replace(/[R$\s.]/g, '').replace(',', '.')) <= 0}
            >
              <Text style={[estilos.textoBotaoModal, { color: cores.textoPrincipal }]}>Salvar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

const criarEstilos = cores => StyleSheet.create({
  cabecalhoLimite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  botaoAdicionarLimite: {
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  textoAdicionarLimite: {
    color: cores.textoLink,
    fontSize: 13,
    fontWeight: '700',
  },
  resumoLimite: { gap: 10, marginBottom: 4 },
  valorLimite: { color: cores.textoPrincipal, fontSize: 26, fontWeight: '700' },
  separadorLimites: { height: 1, backgroundColor: cores.divisor, marginVertical: 8 },
  visaoGeral: { gap: 16, marginTop: 16, maxWidth: '100%' },
  grade: { gap: 16, width: '100%' },
  duasColunas: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap' },
  coluna: { flex: 1, minWidth: 0 },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  titulos: { flex: 1, gap: 3, minWidth: 0 },
  titulo: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: cores.textoPrincipal, flexShrink: 1 },
  legenda: { fontSize: 12, lineHeight: 18, color: cores.textoSecundario, flexShrink: 1 },
  botaoBaixar: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: cores.borda, alignItems: 'center', justifyContent: 'center' },
  totalLimiteBox: { flex: 1, minWidth: 0, gap: 3 },
  valorTotalLimite: { color: cores.textoPrincipal, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  botaoAdicionarContainer: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: cores.primariaSuave, marginTop: 2, maxWidth: '100%' },
  areaVazia: { minHeight: 130, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  botaoAdicionarCentralizado: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: cores.primariaSuave, alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
  textoBotaoLimite: { color: cores.primaria, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  textoBotaoAdicionarVazio: { color: cores.primaria, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  chartKit: { borderRadius: 12, paddingRight: 8 },
  nota: { color: cores.textoSecundario, fontSize: 12, lineHeight: 18, marginTop: 10, flexShrink: 1 },
  linhaResumo: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: cores.divisor, gap: 8, flexShrink: 1 },
  rotulo: { color: cores.textoPrincipal, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  valorResumo: { color: cores.textoPrincipal, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  pequeno: { color: cores.textoSecundario, fontSize: 11, lineHeight: 17, flexShrink: 1 },
  categoria: { gap: 7, marginTop: 14, minWidth: 0 },
  categoriaCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, minWidth: 0 },
  trilho: { height: 8, borderRadius: 5, backgroundColor: cores.superficieElevada, overflow: 'hidden', minWidth: 0 },
  preenchimento: { height: '100%', borderRadius: 5 },
  rodapeLimite: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, gap: 12, flexWrap: 'wrap' },
  resumoLimiteRight: { flex: 1, alignItems: 'flex-end', minWidth: 0 },
  rotuloResumo: { color: cores.textoSecundario, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  valorResumoTotal: { color: cores.textoPrincipal, fontSize: 16, fontWeight: '700', marginTop: 4, flexShrink: 1 },
  valorResumoDisponivel: { fontSize: 16, fontWeight: '700', marginTop: 4, flexShrink: 1 },
  usoLimiteWrap: { marginTop: 12, minWidth: 0 },
  trilhoResumo: { height: 8, borderRadius: 5, backgroundColor: cores.superficieElevada, overflow: 'hidden', minWidth: 0 },
  preenchimentoResumo: { height: '100%', borderRadius: 5, backgroundColor: cores.primaria },
  botaoOutrasCategorias: { minHeight: 40, flexDirection: 'row', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: cores.primariaSuave, gap: 5, paddingVertical: 10, marginTop: 5 },
  textoBotaoOutrasCategorias: { color: cores.textoPrincipal, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  vazio: { marginVertical: 16, color: cores.textoSecundario, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  fundoModal: { flex: 1, backgroundColor: cores.sobreposicao, justifyContent: 'center', paddingHorizontal: 20 },
  modalCartao: { backgroundColor: cores.superficie, borderRadius: 18, borderWidth: 1, borderColor: cores.borda, padding: 20, maxWidth: 520, width: '100%', alignSelf: 'center' },
  modalTitulo: { color: cores.textoPrincipal, fontSize: 20, fontWeight: '700', marginBottom: 6, flexShrink: 1 },
  modalDescricao: { color: cores.textoSecundario, fontSize: 13, lineHeight: 19, marginBottom: 16, flexShrink: 1 },
  labelCampo: { color: cores.textoPrincipal, fontSize: 13, fontWeight: '600', marginBottom: 8, flexShrink: 1 },
  campo: { minHeight: 46, backgroundColor: cores.fundo, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 12, color: cores.textoPrincipal, marginBottom: 14 },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  botaoModal: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flex: 1, minWidth: 110 },
  botaoSecundario: { backgroundColor: cores.superficieElevada },
  botaoDesabilitado: { opacity: 0.5 },
  textoBotaoModal: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  resultadoMes: { marginTop: 4, paddingVertical: 14, borderTopWidth: 1, borderTopColor: cores.divisor },
  resultadoMesCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  resultadoMesTexto: { flex: 1, minWidth: 150, gap: 3 },
  resultadoMesValor: { fontSize: 20, lineHeight: 26, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  saldosProjecao: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  saldoProjecaoItem: { flexGrow: 1, flexBasis: 145, minWidth: 0, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.superficieElevada, gap: 4 },
  saldoProjecaoValor: { fontSize: 16, lineHeight: 22, fontWeight: '800', flexShrink: 1 },
  resultadoMesDetalhe: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' },
});
// Componente responsável por exibir o panorama financeiro completo.
// Reúne evolução histórica, projeção do mês, limite de gastos por categoria e resumo de disponibilidade.
// Também permite adicionar ou editar o limite total e exportar alguns cartões em PDF.
