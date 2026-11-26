// Funções de alto nível para cadastro, login e recuperação de senha.
// Traduz respostas da API em fluxos simples usados pelas respectivas telas.

// Os dados ficam somente na memória do módulo da sessão; não são persistidos em disco.
// limpar deve ser chamado após cadastro/redefinição ou ao abrir uma recuperação nova.

let cadastroPendente = null;
let recuperacaoPendente = null;
export function salvarCadastroPendente(dados) {
  cadastroPendente = dados;
}
export function obterCadastroPendente() {
  return cadastroPendente;
}
export function limparCadastroPendente() {
  cadastroPendente = null;
}
export function salvarRecuperacaoPendente(dados) {
  recuperacaoPendente = dados;
}
export function obterRecuperacaoPendente() {
  return recuperacaoPendente;
}
export function limparRecuperacaoPendente() {
  recuperacaoPendente = null;
}
