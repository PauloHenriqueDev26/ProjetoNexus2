// Utilitários puros para normalizar, comparar e formatar datas.
// Separam regras de calendário da interface para que telas e validadores usem a mesma convenção.

export function formatarEntradaData(valor) {
  const texto = String(valor || '');
  const formatoIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (formatoIso) return `${formatoIso[3]}/${formatoIso[2]}/${formatoIso[1]}`;
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)].filter(Boolean).join('/');
}

export function dataParaIso(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatarEntradaData(valor));
  if (!partes || Number(partes[3]) < 1000) return '';
  const [, dia, mes, ano] = partes;
  const iso = [ano, mes, dia].join('-');
  // UTC ao meio-dia reduz risco de a conversão para o fuso local cair no dia anterior.
  // A comparação de retorno detecta dias impossíveis que Date normalizaria automaticamente.
  const data = new Date(iso + 'T12:00:00Z');
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === iso ? iso : '';
}
