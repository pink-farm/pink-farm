const SAFE_EVENT = /^[a-z][a-z0-9_.-]{0,95}$/;
const SAFE_ERROR_TYPE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const SAFE_ERROR_CODE = /^[A-Z][A-Z0-9_]{0,31}$/;

/** Log only stable diagnostic metadata; never serialize an exception or request data. */
export function logServerError(event, error) {
  const eventName = typeof event === "string" && SAFE_EVENT.test(event) ? event : "security.internal_error";
  const errorType = error instanceof Error && SAFE_ERROR_TYPE.test(error.name) ? error.name : "UnknownError";
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && SAFE_ERROR_CODE.test(error.code)
    ? error.code
    : undefined;
  const statusCode = error && typeof error === "object" && "statusCode" in error && Number.isInteger(error.statusCode) && error.statusCode >= 100 && error.statusCode <= 599
    ? error.statusCode
    : undefined;
  console.error(eventName, { errorType, ...(code ? { code } : {}), ...(statusCode ? { statusCode } : {}) });
}
