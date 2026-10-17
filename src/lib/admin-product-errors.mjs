export class AdminProductInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "AdminProductInputError";
  }
}

export function classifyAdminProductError(error) {
  if (error instanceof AdminProductInputError) {
    return { status: 400, message: error.message };
  }

  if (error instanceof SyntaxError) {
    return { status: 400, message: "Product data must be valid JSON." };
  }

  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return { status: 409, message: "That slug or SKU is already in use." };
  }

  return { status: 500, message: "Could not save product." };
}
