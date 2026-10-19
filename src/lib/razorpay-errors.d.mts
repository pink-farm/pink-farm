export function getRazorpayErrorDiagnostics(error: unknown): { statusCode?: number; code?: string };
export function classifyRazorpayOrderError(error: unknown): {
  status: number;
  code: string;
  message: string;
};
