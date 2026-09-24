/** Representa falhas de negócio com mensagem e código HTTP explícitos. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
