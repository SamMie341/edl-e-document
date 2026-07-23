export function fixUtf8String(str?: string): string {
  if (typeof str !== 'string' || !str) return str as any;
  let hasAbove255 = false;
  let hasAbove127 = false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      hasAbove255 = true;
      break;
    }
    if (code >= 128) {
      hasAbove127 = true;
    }
  }
  if (!hasAbove255 && hasAbove127) {
    try {
      return Buffer.from(str, 'latin1').toString('utf8');
    } catch {
      return str;
    }
  }
  return str;
}

export function fixUtf8Object<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => fixUtf8Object(item)) as any;
  }
  const result: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (typeof val === 'string') {
      result[key] = fixUtf8String(val);
    } else if (val && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = fixUtf8Object(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
