/** Reúne os estilos por área e reutiliza os objetos enquanto a paleta não muda. */
import { useTheme } from '../contexts/ThemeContext';
import { createDesignTokens } from './tokens';
import { createNavegacaoStyles } from './navegacao';
import { createAutenticacaoStyles } from './autenticacao';
import { createFinanceiroStyles } from './financeiro';
import { createContaStyles } from './conta';
import { createCompartilhadosStyles } from './compartilhados';

const cache = new WeakMap();

export function useAppStyles() {
  const { colors } = useTheme();
  // A identidade da paleta serve como chave para evitar recriar todos os estilos a cada renderização.
  if (!cache.has(colors)) {
    const tokens = createDesignTokens(colors);
    cache.set(colors, {
      colors,
      gradients: tokens.gradients,
      ...createNavegacaoStyles(colors, tokens),
      ...createAutenticacaoStyles(colors, tokens),
      ...createFinanceiroStyles(colors, tokens),
      ...createContaStyles(colors, tokens),
      ...createCompartilhadosStyles(colors, tokens),
      navigationScreenOptions: {
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      },
    });
  }
  return cache.get(colors);
}
