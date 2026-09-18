/**
 * NagrikAI Civic Input Sanitizer & Prompt Injection Defense
 * 
 * Defense-in-depth utility for sanitizing citizen inputs, neutralizing XSS vectors,
 * detecting adversarial LLM prompt-injections, and enforcing civic boundary rules.
 * Safe for both Client-side React components and Next.js / Node.js Server environments.
 */

// Well-known adversarial prompt injection markers and jailbreak patterns
const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives|rules)/gi, description: "Instruction override attempt" },
  { pattern: /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|directives)/gi, description: "System directive override" },
  { pattern: /you\s+are\s+(now|acting\s+as)\s+(a|an|the)?\s*["']?([a-z0-9_-]+)["']?/gi, description: "Persona hijacking attempt" },
  { pattern: /(system\s*prompt|system\s*directive|system\s*message)\s*:/gi, description: "Fake system message injection" },
  { pattern: /(dan\s+mode|jailbreak\s+mode|unrestricted\s+mode)/gi, description: "DAN/Jailbreak token sequence" },
  { pattern: /bypass\s+(all\s+)?(safety|rules|filters|guidelines)/gi, description: "Filter bypass request" },
  { pattern: /(<\/?system>|<\/?prompt>|\[system\]|\[inst\])/gi, description: "LLM structural delimiter injection" },
  { pattern: /(\bhuman:\s*|\bassistant:\s*|\bsystem:\s*)/gi, description: "Dialogue role token injection" },
];

// XSS and HTML event handler patterns
const XSS_HTML_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, replacement: "" },
  { pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, replacement: "" },
  { pattern: /<embed\b[^>]*>/gi, replacement: "" },
  { pattern: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, replacement: "" },
  { pattern: /javascript\s*:/gi, replacement: "blocked:" },
  { pattern: /data\s*:\s*text\/html/gi, replacement: "blocked:data" },
  { pattern: /on(error|load|click|mouseover|focus|blur|submit)\s*=/gi, replacement: "no_$1=" },
];

export interface SanitizationResult {
  sanitized: string;
  injectionDetected: boolean;
  flags: string[];
}

export interface GrievanceSanitizationResult {
  isValid: boolean;
  sanitized: {
    title: string;
    description: string;
    address: string;
  };
  errors: string[];
  securityFlags: string[];
}

/**
 * Sanitizes a single civic text input.
 * Strips active scripts/HTML, neutralizes prompt injection sequences, and clamps length.
 */
export function sanitizeCivicInput(raw: string, maxLength = 2500): SanitizationResult {
  if (!raw || typeof raw !== "string") {
    return { sanitized: "", injectionDetected: false, flags: [] };
  }

  const flags: string[] = [];
  let injectionDetected = false;
  let text = raw.trim();

  // 1. Detect Prompt Injection heuristics
  for (const { pattern, description } of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionDetected = true;
      flags.push(description);
      // Neutralize pattern by replacing matches with [sanitized_directive]
      text = text.replace(pattern, "[sanitized_directive]");
    }
  }

  // 2. Strip XSS & dangerous HTML vectors
  for (const { pattern, replacement } of XSS_HTML_PATTERNS) {
    if (pattern.test(text)) {
      flags.push("HTML/Script payload neutralized");
      text = text.replace(pattern, replacement);
    }
  }

  // 3. Escape residual angle brackets for defense-in-depth
  text = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&/g, "&amp;");

  // Fix double escaped entities if any
  text = text.replace(/&amp;(lt|gt|amp);/g, "&$1;");

  // 4. Enforce strict maximum length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
    flags.push(`Input truncated to ${maxLength} chars`);
  }

  return {
    sanitized: text,
    injectionDetected,
    flags: Array.from(new Set(flags)),
  };
}

/**
 * Validates and sanitizes a complete grievance draft before intake.
 */
export function validateAndSanitizeGrievance(data: {
  title: string;
  description: string;
  address?: string;
}): GrievanceSanitizationResult {
  const errors: string[] = [];
  const securityFlags: string[] = [];

  const rawTitle = data.title || "";
  const rawDesc = data.description || "";
  const rawAddress = data.address || "";

  // Title validation & sanitization (min 5, max 160)
  if (rawTitle.trim().length < 5) {
    errors.push("Title must be at least 5 characters long.");
  }
  const titleRes = sanitizeCivicInput(rawTitle, 160);
  if (titleRes.injectionDetected) {
    securityFlags.push(...titleRes.flags.map((f) => `Title: ${f}`));
  }

  // Description validation & sanitization (min 10, max 2500)
  if (rawDesc.trim().length < 10) {
    errors.push("Description must be at least 10 characters long.");
  }
  const descRes = sanitizeCivicInput(rawDesc, 2500);
  if (descRes.injectionDetected) {
    securityFlags.push(...descRes.flags.map((f) => `Description: ${f}`));
  }

  // Address sanitization (max 250)
  const addrRes = sanitizeCivicInput(rawAddress, 250);
  if (addrRes.injectionDetected) {
    securityFlags.push(...addrRes.flags.map((f) => `Address: ${f}`));
  }

  return {
    isValid: errors.length === 0,
    sanitized: {
      title: titleRes.sanitized,
      description: descRes.sanitized,
      address: addrRes.sanitized,
    },
    errors,
    securityFlags: Array.from(new Set(securityFlags)),
  };
}
