const SAFE_PROVIDER_CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const SAFE_PROVIDER_DETAIL = /^[a-z][a-z0-9_]{0,63}$/;

/** Extract only stable, non-sensitive fields from a browser Checkout failure. */
export function getRazorpayPaymentFailureDiagnostics(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const error = value.error && typeof value.error === "object" && !Array.isArray(value.error)
    ? value.error
    : value;
  const code = typeof error.code === "string" && SAFE_PROVIDER_CODE.test(error.code) ? error.code : undefined;
  const source = typeof error.source === "string" && SAFE_PROVIDER_DETAIL.test(error.source) ? error.source : undefined;
  const step = typeof error.step === "string" && SAFE_PROVIDER_DETAIL.test(error.step) ? error.step : undefined;
  const reason = typeof error.reason === "string" && SAFE_PROVIDER_DETAIL.test(error.reason) ? error.reason : undefined;

  return {
    ...(code ? { code } : {}),
    ...(source ? { source } : {}),
    ...(step ? { step } : {}),
    ...(reason ? { reason } : {}),
  };
}

/** Extract only stable, non-sensitive Razorpay diagnostics from SDK errors. */
export function getRazorpayErrorDiagnostics(error) {
  if (!error || typeof error !== "object") return {};

  const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 100 && error.statusCode <= 599
    ? error.statusCode
    : undefined;
  const rawCode = error.error && typeof error.error === "object" ? error.error.code : error.code;
  const code = typeof rawCode === "string" && SAFE_PROVIDER_CODE.test(rawCode) ? rawCode : undefined;

  return {
    ...(statusCode ? { statusCode } : {}),
    ...(code ? { code } : {}),
  };
}

/** Map an upstream Razorpay failure to a safe customer response. */
export function classifyRazorpayOrderError(error) {
  const { statusCode } = getRazorpayErrorDiagnostics(error);

  if (statusCode === 401 || statusCode === 403) {
    return {
      status: 503,
      code: "PAYMENT_CONFIGURATION_ERROR",
      message: "Online payments are temporarily unavailable. Please contact the store.",
    };
  }

  if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500)) {
    return {
      status: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      message: "The payment provider is temporarily unavailable. Please try again shortly.",
    };
  }

  return {
    status: 502,
    code: "PAYMENT_ORDER_CREATION_FAILED",
    message: "Payment service could not start your checkout. Please try again.",
  };
}
