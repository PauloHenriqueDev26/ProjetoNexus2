/** Normaliza e valida os dados recebidos pelas rotas de autenticação e cadastro. */
/** Remove espaços das extremidades e padroniza o e-mail em letras minúsculas. */
export function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/** Verifica o formato básico do endereço de e-mail. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Converte DD/MM/AAAA para o formato ISO utilizado pelo banco. */
export function normalizeDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const date = value.trim();
  const brazilian = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return brazilian ? `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` : date;
}

/** Confere a existência da data e exige nascimento anterior ao dia atual. */
export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/** Retorna a primeira regra de senha não atendida ou null quando todas passam. */
export function passwordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8)
    return 'A senha deve ter pelo menos 8 caracteres.';
  if (!/[a-z]/.test(password)) return 'A senha deve ter uma letra minúscula.';
  if (!/[A-Z]/.test(password)) return 'A senha deve ter uma letra maiúscula.';
  if (!/\d/.test(password)) return 'A senha deve ter um número.';
  return null;
}
