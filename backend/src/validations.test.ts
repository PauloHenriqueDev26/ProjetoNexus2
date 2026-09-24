/** Verifica as regras de e-mail, nascimento e senha utilizadas pela autenticação. */
import { describe, expect, it } from 'vitest';
import { isValidBirthDate, isValidEmail, normalizeDate, passwordError } from './validations';

describe('validações da autenticação', () => {
  it('valida e-mail', () => {
    expect(isValidEmail('aluno@email.com')).toBe(true);
    expect(isValidEmail('email-invalido')).toBe(false);
  });

  it('aceita data brasileira e rejeita data impossível', () => {
    expect(normalizeDate('31/12/2000')).toBe('2000-12-31');
    expect(isValidBirthDate('2000-12-31')).toBe(true);
    expect(isValidBirthDate('2000-02-31')).toBe(false);
  });

  it('exige senha com oito caracteres, letras e número', () => {
    expect(passwordError('Senha123')).toBeNull();
    expect(passwordError('senha123')).not.toBeNull();
    expect(passwordError('SenhaFraca')).not.toBeNull();
  });
});
