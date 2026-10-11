// Throw from services for expected failures; the error handler turns it into
// `{ error: { code, message } }` with this status code.
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
