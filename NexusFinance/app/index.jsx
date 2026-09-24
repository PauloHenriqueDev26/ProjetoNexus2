/** Redireciona a entrada do aplicativo conforme a sessão restaurada. */
import { Redirect } from 'expo-router';
import { useSession } from '../contexts/SessionContext';

export default function Index() {
  const { autenticado } = useSession();
  return <Redirect href={autenticado ? '/inicial' : '/auth/boasVindas'} />;
}
