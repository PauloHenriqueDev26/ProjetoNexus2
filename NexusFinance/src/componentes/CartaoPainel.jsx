import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEstilosApp } from '../style/style';

/** Container visual usado nos cards do painel financeiro.
 * Centraliza borda, sombra, espaçamento e fundo, permitindo que os filhos definam o conteúdo.
 */
export default function CartaoPainel({ children, style, ...props }) {
  const { cores } = useEstilosApp();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      width: '100%',
      maxWidth: '100%',
      padding: 18,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: cores.borda,
      backgroundColor: cores.superficie,
    },
  }), [cores]);

  // useMemo evita recriar o objeto de estilos enquanto as cores não mudarem.
  // props permite repassar accessibilityLabel, testID e outras propriedades nativas ao View.
  // style é aplicado por último para permitir ajustes locais.
  return <View {...props} style={[styles.card, style]}>{children}</View>;
}
