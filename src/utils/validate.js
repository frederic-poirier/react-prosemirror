export default function merge(current, defaults, schema, path = "") {
  if (current === undefined || current === null) {
    return structuredClone(defaults);
  }

  const type = schema?.type;

  if (type && !checkType(current, type)) {
    return structuredClone(defaults);
  }

  if (type === "string") {
    if (
      (schema.minLength && current.length < schema.minLength) ||
      (schema.maxLength && current.length > schema.maxLength) ||
      (schema.pattern && !new RegExp(schema.pattern).test(current)) || // 👈 tu avais `defaults` ici
      (schema.enum && !schema.enum.includes(current)) // 👈 tu avais `defaults` ici
    ) {
      return defaults;
    }
    return current;
  }

  if (type === "number") {
    if (
      (schema.min !== undefined && current < schema.min) ||
      (schema.max !== undefined && current > schema.max)
    ) {
      return defaults;
    }
    return current;
  }

  if (type === "boolean") {
    return typeof current === "boolean" ? current : defaults;
  }
  
  if (type === "object" && schema.properties) {
    const result = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      result[key] = merge(
        current[key],
        defaults[key],
        propSchema,
        path ? `${path}.${key}` : key
      );
    }
    return result;
  }

  if (type === "array" && schema.items) {
    if (!Array.isArray(current)) {
      return structuredClone(defaults); // 👈 correction : fallback sur defaults, pas current
    }
    return current
      .filter((item) => item !== null && item !== undefined) // 👈 filtre les null
      .map((item, i) =>
        merge(item, defaults[i] ?? defaults[0] ?? null, schema.items, `${path}[${i}]`)
      );
  }

  return current; // fallback
}

function checkType(value, type) {
  if (type === "array") return Array.isArray(value);
  if (type === "object")
    return value && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}
