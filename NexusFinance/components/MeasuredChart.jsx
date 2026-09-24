/** Ajusta os gráficos à largura real disponível no cartão. */
import React, { useState } from 'react';
import { View } from 'react-native';

// Mede a área real do cartão, inclusive após rotação ou divisão da tela.
export default function MeasuredChart({ children }) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={{ width: '100%', overflow: 'hidden' }}
      onLayout={({ nativeEvent }) => setWidth(Math.floor(nativeEvent.layout.width))}
    >
      {width > 0 ? children(width) : null}
    </View>
  );
}
