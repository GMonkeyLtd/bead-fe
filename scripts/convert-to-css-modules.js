#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要转换的目录
const directories = [
  'src/components',
  'src/pages',
  'src/pages-design',
  'src/pages-merchant',
  'src/pages-order',
  'src/pages-user'
];

// kebab-case 转 camelCase
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// 处理 SCSS 文件内容，转换类名
function convertScssContent(content) {
  return content.replace(/\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g, (match, className) => {
    return '.' + kebabToCamel(className);
  });
}

// 处理 TSX 文件内容，转换 className 使用
function convertTsxContent(content, moduleName = 'styles') {
  // 替换导入语句
  content = content.replace(
    /import\s+["']\.\/[^"']*\.scss["'];?/g,
    `import ${moduleName} from "./index.module.scss";`
  );
  
  // 替换 className 使用
  content = content.replace(
    /className=["']([a-z][a-z0-9]*(?:-[a-z0-9]+)*)["']/g,
    (match, className) => {
      const camelClass = kebabToCamel(className);
      return `className={${moduleName}.${camelClass}}`;
    }
  );
  
  // 处理模板字符串中的多个类名
  content = content.replace(
    /className=\{`([^`]+)`\}/g,
    (match, templateStr) => {
      const converted = templateStr.replace(
        /([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g,
        (classMatch, className) => {
          const camelClass = kebabToCamel(className);
          return `\${${moduleName}.${camelClass}}`;
        }
      );
      return `className={\`${converted}\`}`;
    }
  );
  
  return content;
}

// 扫描目录找到所有需要转换的文件
function scanDirectory(dir) {
  const items = [];
  
  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scan(filePath);
      } else if (file === 'index.scss' || file.endsWith('.scss')) {
        const tsxPath = filePath.replace(/\.scss$/, '.tsx');
        if (fs.existsSync(tsxPath)) {
          items.push({
            scssPath: filePath,
            tsxPath: tsxPath,
            moduleScssPath: filePath.replace(/\.scss$/, '.module.scss')
          });
        }
      }
    }
  }
  
  scan(dir);
  return items;
}

// 执行转换
function convertFiles() {
  console.log('🚀 开始批量转换 CSS Modules...\n');
  
  let totalConverted = 0;
  let errors = [];
  
  for (const dir of directories) {
    const items = scanDirectory(dir);
    
    console.log(`📁 处理目录: ${dir}`);
    console.log(`   找到 ${items.length} 个组件需要转换\n`);
    
    for (const item of items) {
      try {
        // 读取 SCSS 文件
        const scssContent = fs.readFileSync(item.scssPath, 'utf8');
        
        // 转换 SCSS 内容
        const convertedScssContent = convertScssContent(scssContent);
        
        // 写入新的 module.scss 文件
        fs.writeFileSync(item.moduleScssPath, convertedScssContent);
        
        // 读取 TSX 文件
        const tsxContent = fs.readFileSync(item.tsxPath, 'utf8');
        
        // 转换 TSX 内容
        const convertedTsxContent = convertTsxContent(tsxContent);
        
        // 写入 TSX 文件
        fs.writeFileSync(item.tsxPath, convertedTsxContent);
        
        // 删除原 SCSS 文件
        fs.unlinkSync(item.scssPath);
        
        console.log(`   ✅ ${path.relative(process.cwd(), item.scssPath)}`);
        totalConverted++;
        
      } catch (error) {
        console.log(`   ❌ ${path.relative(process.cwd(), item.scssPath)} - ${error.message}`);
        errors.push({ file: item.scssPath, error: error.message });
      }
    }
    
    console.log('');
  }
  
  console.log(`🎉 转换完成！`);
  console.log(`   成功转换: ${totalConverted} 个文件`);
  
  if (errors.length > 0) {
    console.log(`   转换失败: ${errors.length} 个文件\n`);
    console.log('❌ 失败详情:');
    errors.forEach(({ file, error }) => {
      console.log(`   ${path.relative(process.cwd(), file)}: ${error}`);
    });
  }
  
  console.log('\n📝 转换后请检查:');
  console.log('   1. 确认所有 import 语句正确');
  console.log('   2. 检查复杂的 className 组合是否正确转换');
  console.log('   3. 测试组件渲染是否正常');
}

// 检查是否在项目根目录
if (!fs.existsSync('package.json')) {
  console.error('❌ 请在项目根目录运行此脚本');
  process.exit(1);
}

// 执行转换
convertFiles(); 