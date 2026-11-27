import { Image, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

// Exibe a foto do usuário ou um avatar de iniciais quando não existe imagem.
// A aparência visual acompanha o tema global e os valores podem ser personalizados por tamanho.
export default function AvatarPerfil({ foto, tamanho, cor }) {
  if (!foto) return <Icon name="person-outline" size={tamanho} color={cor} />;
  return (
    <Image
      key={foto}
      source={{ uri: foto }}
      accessibilityLabel="Foto de perfil"
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', borderRadius: 999 }]}
    />
  );
}
