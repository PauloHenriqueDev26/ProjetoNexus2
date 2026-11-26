import FormularioNovaSenha from "../../componentes/FormularioNovaSenha";

// Esta rota reutiliza FormularioNovaSenha para compartilhar validação e envio com alteração autenticada.
// Recebe o código válido e define uma nova senha.
// Confirma os campos e usa o token de recuperação do fluxo anterior.
export default function NovaSenha() {
  return <FormularioNovaSenha />;
}
