export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface ValidationRule<T> {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
}

export function validateField<T>(
  value: T, 
  field: string, 
  rules: ValidationRule<T>
): void {
  if (rules.required && (value === undefined || value === null || value === "")) {
    throw new ValidationError(`${field} is required`, field);
  }

  if (value === undefined || value === null) {
    return; // Skip other validations for optional empty fields
  }

  if (rules.type) {
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rules.type) {
      throw new ValidationError(`${field} must be of type ${rules.type}`, field);
    }
  }

  if (rules.minLength !== undefined && typeof value === "string" && value.length < rules.minLength) {
    throw new ValidationError(`${field} must be at least ${rules.minLength} characters long`, field);
  }

  if (rules.maxLength !== undefined && typeof value === "string" && value.length > rules.maxLength) {
    throw new ValidationError(`${field} must be no more than ${rules.maxLength} characters long`, field);
  }

  if (rules.min !== undefined && typeof value === "number" && value < rules.min) {
    throw new ValidationError(`${field} must be at least ${rules.min}`, field);
  }

  if (rules.max !== undefined && typeof value === "number" && value > rules.max) {
    throw new ValidationError(`${field} must be no more than ${rules.max}`, field);
  }

  if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
    throw new ValidationError(`${field} format is invalid`, field);
  }

  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === "string") {
      throw new ValidationError(customResult, field);
    }
    if (!customResult) {
      throw new ValidationError(`${field} validation failed`, field);
    }
  }
}

export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: { [K in keyof T]?: ValidationRule<T[K]> }
): void {
  for (const [field, rules] of Object.entries(schema)) {
    if (rules) {
      validateField(obj[field], field, rules);
    }
  }
}

// Specific validation schemas
export const kvKeyValidation: ValidationRule<string> = {
  required: true,
  type: "string",
  minLength: 1,
  maxLength: 512,
  pattern: /^[a-zA-Z0-9._\-\/]+$/,
  custom: (value) => {
    if (value.includes("//")) {
      return "Key cannot contain consecutive slashes";
    }
    if (value.startsWith("/") || value.endsWith("/")) {
      return "Key cannot start or end with slash";
    }
    return true;
  }
};

export const itemNameValidation: ValidationRule<string> = {
  required: true,
  type: "string",
  minLength: 1,
  maxLength: 255,
  custom: (value) => {
    const trimmed = value.trim();
    if (trimmed !== value) {
      return "Name cannot have leading or trailing whitespace";
    }
    return true;
  }
};

export const itemDescriptionValidation: ValidationRule<string> = {
  type: "string",
  maxLength: 1000
};

export const itemNameValidationOptional: ValidationRule<string | undefined> = {
  type: "string",
  minLength: 1,
  maxLength: 255,
  custom: (value) => {
    if (value === undefined) return true;
    const trimmed = value.trim();
    if (trimmed !== value) {
      return "Name cannot have leading or trailing whitespace";
    }
    return true;
  }
};

export const itemDescriptionValidationOptional: ValidationRule<string | undefined> = {
  type: "string",
  maxLength: 1000
};

export const paginationValidation = {
  limit: {
    type: "number" as const,
    min: 1,
    max: 100
  },
  offset: {
    type: "number" as const,
    min: 0
  },
  cursor: {
    type: "number" as const,
    min: 0
  }
};

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[char] || char;
    })
    .trim();
}