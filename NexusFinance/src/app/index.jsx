import { Redirect } from 'expo-router';
import { useSessao } from "../contextos/ContextoSessao";
// Ponto de entrada visual da navegação.
// Decide se redireciona uma sessão autenticada para o painel ou mostra o fluxo público de boas-vindas.
export default function Inicio() {
  const {
    autenticado
  } = useSessao();
  return <Redirect href={autenticado ? '/inicial' : '/auth/boasVindas'} />;
}
