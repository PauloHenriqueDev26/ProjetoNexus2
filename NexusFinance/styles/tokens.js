/** Valores visuais compartilhados pela navegação e pelos cartões financeiros. */
export function createDesignTokens(colors) {
  const gradients = { brand: ['#6C5CE7', '#5145FF', '#1809e0'] };
  const radii = { md: 16, lg: 24, xl: 28, pill: 999 };
  const shadow = {
    soft: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    glowPrimary: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius: 14,
      elevation: 10,
    },
  };
  return { gradients, radii, shadow };
}
