/** Converte datas da API ou dígitos digitados para a máscara brasileira. */
// Aceita oito dígitos digitados ou colados e datas da API, sem abrir um calendário.
export function dateInput(value) {
  const text = String(value || '');
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}
