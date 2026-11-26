import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
/**
 * Componente visual que representa uma porcentagem em formato circular.
 * Calcula o ângulo preenchido e apresenta valor/descrição central sem executar nenhuma lógica de dados.
 */
export default function AnelProgresso(propriedades) {
  if (Platform.OS !== 'web') return <AnimatedCircularProgress {...propriedades} />;
  // Na web, extraímos as propriedades e recriamos o progresso com SVG.
  const {
    size: tamanho,
    width: largura,
    fill: preenchimento,
    tintColor: corPreenchimento,
    backgroundColor,
    children: filhos
  } = propriedades;
  const progresso = Math.max(0, Math.min(100, Number(preenchimento) || 0));
  // Raio considera a espessura da linha para que o círculo permaneça dentro da área definida.
  const raio = (tamanho - largura) / 2;
  // SVG mede o traço pela circunferência: offset zero mostra o arco inteiro;
  // offset igual ao comprimento o esconde. A proporção restante corresponde ao percentual.
  const comprimento = 2 * Math.PI * raio;
  return <View style={{
    width: tamanho,
    height: tamanho
  }} accessibilityRole="progressbar" accessibilityValue={{
    min: 0,
    max: 100,
    now: progresso
  }}>
      <Svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke={backgroundColor} strokeWidth={largura} fill="none" />
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke={corPreenchimento} strokeWidth={largura} fill="none" strokeDasharray={`${comprimento} ${comprimento}`} strokeDashoffset={comprimento * (1 - progresso / 100)} strokeLinecap="round" transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`} />
      </Svg>
      <View style={{
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        {typeof filhos === 'function' ? filhos(progresso) : filhos}
      </View>
    </View>;
}
