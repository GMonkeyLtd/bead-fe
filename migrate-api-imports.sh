#!/bin/bash

# API 导入路径批量迁移脚本
# 将 @/utils/api 的导入改为从 @/api/* 模块导入

echo "🚀 开始迁移 API 导入路径..."
echo ""

# 查找所有使用 @/utils/api 的文件
FILES=$(grep -r "from ['\"]@/utils/api['\"]" src/pages* --include="*.tsx" --include="*.ts" -l 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "✅ 没有找到需要迁移的文件"
    exit 0
fi

echo "📝 找到以下文件需要迁移:"
echo "$FILES"
echo ""
echo "开始迁移..."
echo ""

# 统计
total=0
migrated=0

for file in $FILES; do
    total=$((total + 1))
    echo "处理: $file"
    
    # 备份原文件
    cp "$file" "$file.bak"
    
    # 检查文件中使用了哪些 API
    uses_user=false
    uses_generate=false
    uses_product=false
    uses_inspiration=false
    uses_beads=false
    uses_design=false
    uses_history=false
    uses_file=false
    uses_config=false
    
    if grep -q "userApi\." "$file"; then
        uses_user=true
    fi
    if grep -q "generateApi\." "$file"; then
        uses_generate=true
    fi
    if grep -q "productApi\." "$file"; then
        uses_product=true
    fi
    if grep -q "inspirationApi\." "$file"; then
        uses_inspiration=true
    fi
    if grep -q "beadsApi\." "$file"; then
        uses_beads=true
    fi
    if grep -q "userDesignApi\." "$file"; then
        uses_design=true
    fi
    if grep -q "userHistoryApi\." "$file"; then
        uses_history=true
    fi
    if grep -q "fileApi\." "$file"; then
        uses_file=true
    fi
    if grep -q "configApi\." "$file"; then
        uses_config=true
    fi
    
    # 构建新的导入语句
    new_imports=""
    
    if [ "$uses_user" = true ]; then
        new_imports="${new_imports}import { userApi } from \"@/api/user\";\n"
    fi
    if [ "$uses_generate" = true ]; then
        new_imports="${new_imports}import { generateApi } from \"@/api/generate\";\n"
    fi
    if [ "$uses_product" = true ]; then
        new_imports="${new_imports}import { productApi } from \"@/api/product\";\n"
    fi
    if [ "$uses_inspiration" = true ]; then
        new_imports="${new_imports}import { inspirationApi } from \"@/api/inspiration\";\n"
    fi
    if [ "$uses_beads" = true ]; then
        new_imports="${new_imports}import { beadsApi } from \"@/api/beads\";\n"
    fi
    if [ "$uses_design" = true ]; then
        new_imports="${new_imports}import { userDesignApi } from \"@/api/design\";\n"
    fi
    if [ "$uses_history" = true ]; then
        new_imports="${new_imports}import { userHistoryApi } from \"@/api/design\";\n"
    fi
    if [ "$uses_file" = true ]; then
        new_imports="${new_imports}import { fileApi } from \"@/api/file\";\n"
    fi
    if [ "$uses_config" = true ]; then
        new_imports="${new_imports}import { configApi } from \"@/api/config\";\n"
    fi
    
    if [ -n "$new_imports" ]; then
        # 删除旧的导入行，添加新的导入
        sed -i.tmp '/from ['\''"]@\/utils\/api['\''"]/d' "$file"
        
        # 在第一个 import 后添加新的导入
        awk -v imports="$new_imports" '
            /^import / && !inserted {
                print
                printf imports
                inserted=1
                next
            }
            {print}
        ' "$file" > "$file.new"
        
        mv "$file.new" "$file"
        rm -f "$file.tmp"
        
        echo "  ✅ 已迁移"
        migrated=$((migrated + 1))
    else
        echo "  ⚠️  未检测到 API 使用，跳过"
        mv "$file.bak" "$file"
    fi
    
    echo ""
done

echo "================================"
echo "迁移完成！"
echo "总文件数: $total"
echo "已迁移: $migrated"
echo ""
echo "⚠️  请检查并测试代码，确认无误后可以删除 .bak 备份文件"
echo "删除备份: find src/pages* -name '*.bak' -delete"
echo ""
echo "下一步: npm run build:weapp:custom"

