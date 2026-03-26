/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a standardized API response
 */
export function apiResponse<T>(data: T, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}
