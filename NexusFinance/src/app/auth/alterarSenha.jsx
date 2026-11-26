import FormularioNovaSenha from "../../componentes/FormularioNovaSenha";

// Permite que um usuário já autenticado altere sua senha.
// Confirma a nova senha e propaga erros de API sem expor detalhes sensíveis.
// A propriedade alteracao muda textos e exige sessão já iniciada durante o envio da nova senha.
export default function AlterarSenha() {
  return <FormularioNovaSenha alteracao />;
}
