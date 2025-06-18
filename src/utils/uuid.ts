/**
 * 生成 UUID v4
 * @returns {string} 返回一个随机的 UUID v4 字符串
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成简短的 UUID（不带连字符）
 * @returns {string} 返回一个随机的简短 UUID 字符串
 */
export function generateShortUUID(): string {
  return generateUUID().replace(/-/g, '');
}

/**
 * 验证字符串是否为有效的 UUID v4
 * @param {string} uuid 要验证的 UUID 字符串
 * @returns {boolean} 如果是有效的 UUID v4 返回 true，否则返回 false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 