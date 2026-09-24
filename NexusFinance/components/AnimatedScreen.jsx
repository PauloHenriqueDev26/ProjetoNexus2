/** Compartilha a área segura, o cabeçalho e as animações de entrada das telas e cartões. */
import { useTheme } from '../contexts/ThemeContext';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader, { ScreenHeaderHeightContext } from './ScreenHeader';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

/** Reserva a área segura e compartilha a altura do cabeçalho com o conteúdo da tela. */
export function AnimatedScreen({
  children,
  style,
  delay = 0,
  direction = 'up',
  maxWidth = 960,
  animated = true,
}) {
  const { colors } = useTheme();
  const [headerHeight, setHeaderHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const entering =
    direction === 'down'
      ? FadeInDown.delay(delay).duration(420).springify()
      : FadeInUp.delay(delay).duration(420);
  const Container = animated ? Animated.View : View;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{
        flex: 1,
        backgroundColor: StyleSheet.flatten(style)?.backgroundColor || colors.background,
      }}
    >
      <View style={{ flex: 1, width: '100%', maxWidth, alignSelf: 'center' }}>
        <ScreenHeader onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)} />
        <ScreenHeaderHeightContext.Provider value={headerHeight + insets.top}>
          <Container
            {...(animated ? { entering } : {})}
            style={[style, { flex: 1, width: '100%', maxWidth, alignSelf: 'center' }]}
          >
            {children}
          </Container>
        </ScreenHeaderHeightContext.Provider>
      </View>
    </SafeAreaView>
  );
}

/** Aplica uma animação de entrada ao cartão respeitando direção e atraso. */
export function AnimatedCard({ children, style, delay = 0, direction = 'down' }) {
  const entering =
    direction === 'up'
      ? FadeInUp.delay(delay).duration(420)
      : FadeInDown.delay(delay).duration(420).springify();

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
