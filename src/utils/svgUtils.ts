// SVG工具函数

/**
 * 将SVG字符串转换为Base64 Data URL
 * @param svgString SVG字符串内容
 * @returns Base64 Data URL
 */
export const svgToBase64 = (svgString: string): string => {
  // 清理SVG字符串
  const cleanSvg = svgString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  // 转换为Base64
  const base64 = btoa(unescape(encodeURIComponent(cleanSvg)));
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * 将SVG字符串转换为Data URL（URL编码方式）
 * @param svgString SVG字符串内容
 * @returns Data URL
 */
export const svgToDataUrl = (svgString: string): string => {
  const cleanSvg = svgString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
};

/**
 * 创建可复用的SVG图标组件
 * @param svgContent SVG内容
 * @param size 图标大小
 * @param color 图标颜色
 * @returns JSX元素
 */
export const createSvgIcon = (
  svgContent: string, 
  size: number = 24, 
  color?: string
) => {
  // 如果需要修改颜色，可以替换SVG中的颜色属性
  let processedSvg = svgContent;
  if (color) {
    processedSvg = svgContent
      .replace(/fill="[^"]*"/g, `fill="${color}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`);
  }
  
  // 确保SVG有正确的尺寸
  const sizedSvg = processedSvg
    .replace(/width="[^"]*"/g, `width="${size}"`)
    .replace(/height="[^"]*"/g, `height="${size}"`);
  
  return svgToDataUrl(sizedSvg);
};

// 常用图标的SVG字符串
export const ICONS = {
  send: `<svg width="26" height="27" viewBox="0 0 26 27" fill="#2A2A2A" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.2" d="M13 0.5C20.1797 0.5 26 6.3203 26 13.5C26 20.6797 20.1797 26.5 13 26.5C5.8203 26.5 0 20.6797 0 13.5C0 6.3203 5.8203 0.5 13 0.5ZM13.1953 7.65039C13.0653 7.58539 12.9351 7.58539 12.8701 7.65039C12.7401 7.65039 12.6749 7.71479 12.5449 7.84473L12.4805 7.91016L7.7998 12.5898C7.40984 12.9798 7.40987 13.5651 7.7998 13.9551C8.1898 14.3451 8.77504 14.3451 9.16504 13.9551L12.0898 11.0303V18.7002C12.025 19.2201 12.4801 19.6748 13 19.6748C13.5199 19.6748 13.9745 19.2201 13.9746 18.7002V11.0303L16.9004 13.9551C17.2903 14.3448 17.8747 14.3448 18.2646 13.9551C18.6546 13.5651 18.6546 12.9798 18.2646 12.5898L13.585 7.91016C13.3901 7.71531 13.3251 7.6505 13.1953 7.65039Z" fill="#ffffff"/>
</svg>`,
  
  edit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20H21M16.5 3.5A2.121 2.121 0 113 16.5L12 20.5L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  delete: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  loading: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  close: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  check: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  plus: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  minus: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

// 预生成的图标Data URL
export const ICON_URLS = {
  send: (size = 24, color) => createSvgIcon(ICONS.send, size, color),
  edit: (size = 24, color = '#007AFF') => createSvgIcon(ICONS.edit, size, color),
  delete: (size = 24, color = '#FF3B30') => createSvgIcon(ICONS.delete, size, color),
  loading: (size = 24, color = '#999') => createSvgIcon(ICONS.loading, size, color),
  close: (size = 24, color = '#999') => createSvgIcon(ICONS.close, size, color),
  check: (size = 24, color = '#34C759') => createSvgIcon(ICONS.check, size, color),
  plus: (size = 24, color = '#007AFF') => createSvgIcon(ICONS.plus, size, color),
  minus: (size = 24, color = '#007AFF') => createSvgIcon(ICONS.minus, size, color),
}; 