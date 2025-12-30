#!/usr/bin/env node

/**
 * TabBar SVG 优化脚本
 * 优化所有 TabBar 使用的 SVG 图标
 */

const fs = require('fs');
const path = require('path');

// TabBar 使用的 SVG 文件列表
const svgFiles = [
  'src/assets/tabbar-icons/home.svg',
  'src/assets/tabbar-icons/home-active.svg',
  'src/assets/tabbar-icons/home-dark.svg',
  'src/assets/tabbar-icons/user.svg',
  'src/assets/tabbar-icons/user-active.svg',
  'src/assets/tabbar-icons/user-dark.svg',
  'src/assets/tabbar-icons/inspiration.svg',
  'src/assets/tabbar-icons/inspiration-active.svg',
  'src/assets/tabbar-icons/inspiration-dark.svg',
  'src/assets/tabbar-icons/product_icon.svg',
  'src/assets/tabbar-icons/product_active_icon.svg',
  'src/assets/tabbar-icons/product_dark_icon.svg',
  'src/assets/icons/grab.svg',
  'src/assets/icons/grab-active.svg',
  'src/assets/icons/orders.svg',
  'src/assets/icons/orders-active.svg',
  'src/assets/icons/user-center.svg',
  'src/assets/icons/user-center-active.svg',
];

/**
 * 简单的 SVG 优化函数
 * 移除不必要的空格、注释、元数据等
 */
function optimizeSVG(svgContent) {
  let optimized = svgContent;
  
  // 移除 XML 声明
  optimized = optimized.replace(/<\?xml[^>]*\?>/g, '');
  
  // 移除注释
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  
  // 移除多余的空格和换行
  optimized = optimized.replace(/\s+/g, ' ');
  optimized = optimized.replace(/>\s+</g, '><');
  optimized = optimized.trim();
  
  // 移除不必要的属性
  optimized = optimized.replace(/\s+xmlns:xlink="[^"]*"/g, '');
  optimized = optimized.replace(/\s+xml:space="[^"]*"/g, '');
  
  // 简化数字精度（保留 2 位小数）
  optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(2);
  });
  
  // 移除 fill-opacity 和 stroke-opacity 为 1 的情况
  optimized = optimized.replace(/\s+fill-opacity="1"/g, '');
  optimized = optimized.replace(/\s+stroke-opacity="1"/g, '');
  
  return optimized;
}

console.log('🎨 开始优化 TabBar SVG 图标...\n');

let totalOriginalSize = 0;
let totalOptimizedSize = 0;
let successCount = 0;
let errorCount = 0;

svgFiles.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  文件不存在: ${filePath}`);
      errorCount++;
      return;
    }
    
    // 读取原始文件
    const originalContent = fs.readFileSync(fullPath, 'utf8');
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    totalOriginalSize += originalSize;
    
    // 优化
    const optimizedContent = optimizeSVG(originalContent);
    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    totalOptimizedSize += optimizedSize;
    
    // 备份原文件
    const backupPath = fullPath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    
    // 写入优化后的内容
    fs.writeFileSync(fullPath, optimizedContent);
    
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(filePath)}`);
    console.log(`   ${originalSize}B → ${optimizedSize}B (节省 ${savedBytes}B, ${savedPercent}%)`);
    
    successCount++;
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}`);
    errorCount++;
  }
});

const totalSaved = totalOriginalSize - totalOptimizedSize;
const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(1);

console.log('\n' + '='.repeat(60));
console.log('📊 优化总结:');
console.log(`   成功: ${successCount} 个文件`);
console.log(`   失败: ${errorCount} 个文件`);
console.log(`   原始大小: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
console.log(`   优化后: ${(totalOptimizedSize / 1024).toFixed(2)} KB`);
console.log(`   节省: ${(totalSaved / 1024).toFixed(2)} KB (${totalSavedPercent}%)`);
console.log('='.repeat(60));
console.log('\n💡 提示: 原始文件已备份为 .backup 后缀');
console.log('   如需恢复: find src/assets -name "*.backup" -exec bash -c \'mv "$0" "${0%.backup}"\' {} \\;');

