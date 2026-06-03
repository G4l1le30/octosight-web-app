/**
 * Basic input sanitization to prevent XSS and other common injection attacks
 * on the client side before sending data to the server.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove script tags
    .replace(/on\w+="[^"]*"/gim, "") // Remove inline event handlers
    .replace(/javascript:[^"]*/gim, "") // Remove javascript: pseudo-protocol
    .trim();
}
