// Imports: Text e TouchableOpacity fornecem os elementos visuais e de toque.
// useEstilosApp busca os estilos compartilhados do tema.
// CartaoAnimado aplica entrada animada ao conjunto de abas.
import { Text, TouchableOpacity } from 'react-native';
import { useEstilosApp } from '../style/style';
import { CartaoAnimado } from './TelaAnimada';

// Componente reutilizável de navegação por abas.
// Recebe itens e uma aba ativa, renderiza botões acessíveis e delega a troca ao callback fornecido.
export default function AbasLista({ opcoes, selecionada, aoSelecionar, style }) {
  const { estilosFluxoFinanceiro: estilos } = useEstilosApp();
  // Renderiza uma aba para cada opção recebida pela propriedade opcoes.
  // A propriedade selecionada determina estado visual e acessibilidade.
  return (
    <CartaoAnimado style={[estilos.filtroRecipiente, style]} atraso={40}>
      {opcoes.map(opcao => (
        <TouchableOpacity
          key={opcao}
          accessibilityRole="tab"
          accessibilityState={{ selected: selecionada === opcao }}
          style={[estilos.botaoFiltro, { flex: 1, paddingHorizontal: 5, justifyContent: 'center' }, selecionada === opcao && estilos.botaoAtivo]}
          onPress={() => aoSelecionar(opcao)}
        >
          <Text style={[estilos.textoABA, { textAlign: 'center' }, selecionada === opcao && estilos.textoAtivo]}>{opcao}</Text>
        </TouchableOpacity>
      ))}
    </CartaoAnimado>
  );
}
