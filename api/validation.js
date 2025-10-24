/**
 * Simple payload validation utilities
 * Lightweight alternative to Zod/Yup for API validation
 */

/**
 * Validate object against schema
 * @param {any} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validatePayload(data, schema) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Payload must be an object');
    return { valid: false, errors };
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check field types and constraints
  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties)) {
      if (field in data) {
        const value = data[field];
        const fieldErrors = validateField(field, value, rules);
        errors.push(...fieldErrors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a single field
 * @param {string} fieldName - Field name for error messages
 * @param {any} value - Field value
 * @param {object} rules - Validation rules
 * @returns {string[]} - Array of error messages
 */
function validateField(fieldName, value, rules) {
  const errors = [];

  // Type checking
  if (rules.type) {
    const typeErrors = checkType(fieldName, value, rules.type);
    errors.push(...typeErrors);
  }

  // String-specific validations
  if (rules.type === 'string' && typeof value === 'string') {
    const stringErrors = checkStringConstraints(fieldName, value, rules);
    errors.push(...stringErrors);
  }

  // Object nested validation
  if (rules.type === 'object' && rules.properties && typeof value === 'object' && value !== null) {
    const nestedErrors = validatePayload(value, rules).errors;
    errors.push(...nestedErrors.map(e => `${fieldName}.${e}`));
  }

  return errors;
}

/**
 * Check type constraints
 */
function checkType(fieldName, value, expectedType) {
  const errors = [];

  if (expectedType === 'string' && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
  } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
    errors.push(`${fieldName} must be an object`);
  } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${fieldName} must be a boolean`);
  }

  return errors;
}

/**
 * Check string-specific constraints
 */
function checkStringConstraints(fieldName, value, rules) {
  const errors = [];

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
  }
  if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
    errors.push(`${fieldName} format is invalid`);
  }

  return errors;
}

// Predefined schemas
export const SCHEMAS = {
  sessionSave: {
    required: ['userId', 'sessionData'],
    properties: {
      userId: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9_-]+$' // Alphanumeric, underscore, dash only
      },
      sessionData: {
        type: 'object'
        // Allow any object structure for session data
      }
    }
  },

  analyticsTrack: {
    required: ['eventType'],
    properties: {
      eventType: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$' // Valid identifier format
      },
      metadata: {
        type: 'object'
        // Allow any object structure for metadata
      }
    }
  },

  preferencesGet: {
    properties: {
      userId: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9_-]+$'
      }
    }
  },

  preferencesPost: {
    required: ['userId', 'preferences'],
    properties: {
      userId: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      preferences: {
        type: 'object'
        // Allow any object structure for preferences
      }
    }
  }
};