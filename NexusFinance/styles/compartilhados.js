/** Estilos de formulários, teclado e elementos compartilhados, calculados com a paleta ativa. */
import { StyleSheet } from 'react-native';

export function createCompartilhadosStyles(colors) {
  const keyboardStyles = StyleSheet.create({
    authScrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingTop: 24,
      paddingBottom: 48,
    },
    authForm: {
      width: '100%',
      flexShrink: 0,
    },
    avoidingView: {
      flex: 1,
    },
    centeredScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 24,
      paddingBottom: 48,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120,
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 24,
    },
  });

  const sharedStyles = StyleSheet.create({
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginVertical: 10,
      textAlign: 'center',
    },
    flex: {
      minWidth: 0,
      flex: 1,
    },
    paddingBottom120: {
      paddingBottom: 120,
    },
    paddingBottom130: {
      paddingBottom: 130,
    },
    paddingBottom150: {
      paddingBottom: 150,
    },
    paddingRight16: {
      paddingRight: 16,
    },
    rowCentered: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    screenHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    formLabel: {
      color: colors.textPrimary,
      marginLeft: 10,
      marginBottom: 5,
      fontSize: 16,
    },
    loginLogo: {
      flexShrink: 0,
      alignSelf: 'center',
      width: 150,
      height: 150,
      marginBottom: 24,
    },
    reportChart: {
      borderRadius: 15,
      marginTop: 10,
      marginBottom: 5,
    },
    progressPercent: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: 'bold',
    },
    mutedCaption: {
      color: colors.textMuted,
      fontSize: 12,
    },
    textAlignRight: {
      textAlign: 'right',
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    positiveText: {
      color: colors.success,
    },
    negativeText: {
      color: colors.danger,
    },
    featurePurple: {
      backgroundColor: colors.featurePurple,
    },
    featureBlue: {
      backgroundColor: colors.featureBlue,
    },
    featureViolet: {
      backgroundColor: colors.featureViolet,
    },
    featureRed: {
      backgroundColor: colors.featureRed,
    },
  });
  return { keyboardStyles, sharedStyles };
}
