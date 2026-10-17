export class AdminProductInputError extends Error {
  constructor(message: string);
}
export function classifyAdminProductError(error: unknown): {
  status: 400 | 409 | 500;
  message: string;
};
