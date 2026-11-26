// Representa uma falha esperada da API que possui uma mensagem e um status HTTP específicos.
// O tratador global do Express usa instanceof para diferenciar este erro de falhas internas.
export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}
