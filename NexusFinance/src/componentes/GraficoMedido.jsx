import React, { useState } from 'react';
import { View } from 'react-native';

// Wrapper responsivo para gráficos.
// Mede a largura disponível do contêiner e chama o filho com essa largura para evitar gráficos deformados.
export default function GraficoMedido({
  children: filhos
}) {
  const [largura, setLargura] = useState(0);
  return <View style={{
    width: '100%',
    overflow: 'hidden'
  }} onLayout={({
    nativeEvent: eventoNativo
  }) => setLargura(Math.floor(eventoNativo.layout.width))}>
      {largura > 0 ? filhos(largura) : null}
    </View>;
}

// largura inicia em zero; onLayout mede o contêiner e só renderiza o gráfico após medição válida.
// Isso impede que o gráfico use uma largura maior que o cartão disponível.
