// Cálculos puros de posição e espaçamento relacionados ao teclado virtual.
// Evita que campos ficados abaixo do teclado fiquem ocultos em plataformas móveis.
// All coordinates are measured in window space, including native keyboard frames.
export function sobreposicaoTeclado(areaVisivel, teclado) {
  if (!teclado || teclado.height <= 0) return 0;
  // Sem cruzamento horizontal, o teclado não cobre esta área (por exemplo, teclado flutuante lateral).
  // O retorno antecipado impede deslocar o campo por causa de um teclado fora da sua coluna.
  if (teclado.screenX + teclado.width <= areaVisivel.x || teclado.screenX >= areaVisivel.x + areaVisivel.width) return 0;
  return Math.max(0, Math.min(areaVisivel.height, areaVisivel.y + areaVisivel.height - teclado.screenY));
}
export function deslocamentoCampoFocado({
  viewport: areaVisivel,
  input: campo,
  keyboard: teclado,
  offset: deslocamento,
  gap: espaco = 24
}) {
  const inferior = areaVisivel.y + areaVisivel.height - sobreposicaoTeclado(areaVisivel, teclado) - espaco;
  const superior = areaVisivel.y + 12;
  // Se o campo multilinha for mais alto que a área visível, mantém o topo acessível.
  const comparacao = campo.y + campo.height > inferior ? Math.min(campo.y + campo.height - inferior, campo.y - superior) : Math.min(0, campo.y - superior);
  return Math.max(0, deslocamento + comparacao);
}
