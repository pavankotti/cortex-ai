/**
 * Redacts Personally Identifiable Information (PII) from a string.
 * Currently supports:
 * - Email addresses
 * - Phone numbers (various standard formats)
 */
export function redactPII(text: string): string {
  if (!text) return text;

  // Regex for email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Regex for phone numbers (matches various formats like +1-123-456-7890, (123) 456-7890, 123-456-7890, etc.)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  return text
    .replace(emailRegex, '[REDACTED_EMAIL]')
    .replace(phoneRegex, '[REDACTED_PHONE]');
}
