export class ApiError extends Error {
  statusCode: number;
  errors: unknown;

  constructor(statusCode: number, message: string, errors: unknown = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') { super(403, message); }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') { super(401, message); }
}
