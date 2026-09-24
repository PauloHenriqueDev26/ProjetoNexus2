/** Estilos de boas-vindas, cadastro, login e recuperação de senha, calculados com a paleta ativa. */
import { StyleSheet } from 'react-native';

export function createAutenticacaoStyles(colors) {
  const boasVindasStyles = StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'stretch',
      paddingHorizontal: 24,
    },
    illustration: {
      alignSelf: 'center',
      width: 200,
      height: 180,
      marginBottom: 60,
    },
    card: {
      width: '100%',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 20,
      alignItems: 'center',
    },
    titulo: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '600',
      marginTop: 10,
      textAlign: 'center',
    },
    subtitulo: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    },
    botao: {
      width: '100%',
      minHeight: 48,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingLeft: 24,
      paddingBottom: 20,
      paddingTop: 20,
      paddingRight: 24,
      marginTop: 20,
      alignItems: 'center',
    },
    textoBotao: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    link: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 10,
      marginBottom: 15,
      textAlign: 'center',
    },
  });

  const cadastroStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    input: {
      width: '100%',
      minHeight: 52,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      fontSize: 16,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 18,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      marginTop: 20,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    erro: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 4,
    },
  });

  const criarSenhaStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    content: {
      width: '100%',
      alignItems: 'center',
    },
    label: {
      width: '100%',
      color: colors.textPrimary,
      fontSize: 15,
      marginTop: 11,
      fontWeight: '600',
    },
    input: {
      width: '100%',
      minHeight: 55,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 15,
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 15,
    },
    button: {
      width: '100%',
      height: 45,
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    erro: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 8,
    },
  });

  const loginStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 12,
      marginBottom: 4,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      color: colors.textPrimary,
      fontSize: 15,
    },
    botao: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      marginTop: 20,
      alignItems: 'center',
    },
    textoBotao: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    link: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
    },
    link2: {
      color: colors.textLink,
      fontSize: 12,
      marginTop: 16,
      textAlign: 'left',
    },
    erro: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 8,
    },
  });

  const novaSenhaStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    content: {
      width: '100%',
      alignItems: 'center',
    },
    descricao: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 22,
    },
    label: {
      width: '100%',
      color: colors.textPrimary,
      fontSize: 15,
      marginTop: 11,
      fontWeight: '600',
    },
    input: {
      width: '100%',
      minHeight: 55,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 15,
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 15,
    },
    button: {
      width: '100%',
      height: 45,
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    erro: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 8,
    },
  });

  const recuperarSenhaStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    content: {
      width: '100%',
      alignItems: 'center',
    },
    descricao: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 22,
    },
    inputContainer1: {
      width: '100%',
      marginBottom: 20,
    },
    input: {
      width: '100%',
      minHeight: 55,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 15,
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 25,
    },
    button: {
      width: '100%',
      height: 45,
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    voltar: {
      color: colors.textPrimary,
      fontSize: 16,
      marginTop: 20,
      textDecorationLine: 'underline',
    },
    erro: {
      color: colors.danger,
      fontSize: 13,
      marginTop: 8,
    },
  });
  return {
    boasVindasStyles,
    cadastroStyles,
    criarSenhaStyles,
    loginStyles,
    novaSenhaStyles,
    recuperarSenhaStyles,
  };
}
