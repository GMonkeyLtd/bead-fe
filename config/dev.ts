import { defineConfig, type UserConfigExport } from "@tarojs/cli";
import path from "path";

import devConfig from "./dev";
import prodConfig from "./prod";

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<"vite">(async (merge) => {
  const baseConfig: UserConfigExport<"vite"> = {
    projectName: "crystal-divination",
    date: "2025-6-6",
    designWidth: 393,
    deviceRatio: {
      640: 2.34 / 2,
      750: 393 / 750, // 调整比例
      375: 393 / 375, // 调整比例
      393: 1, // 添加393的基准比例
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: [],
    defineConstants: {},
    alias: {
      "@": path.resolve(__dirname, "..", "src"),
    },
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: "vite",
    mini: {
      postcss: {
        pxtransform: {
          enable: false,
          config: {
            // 设计稿宽度，默认750
            designWidth: 393,
            // 转换黑名单，在黑名单中的属性不做单位转换
            selectorBlackList: [".ignore"],
            // 替换规则
            replace: false,
            // 设置最小转换值，小于该值不转换，将字体相关的小数值也跳过转换
            minPixelValue: 2,
            // 媒体查询转换
            mediaQuery: false,
            // 只转换部分属性，字体大小保持px
            propList: ["*", "!font-size", "!letter-spacing"],
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: "module", // 转换模式，取值为 global/module
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    h5: {
      publicPath: "/",
      staticDirectory: "static",

      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: "css/[name].[hash].css",
        chunkFilename: "css/[name].[chunkhash].css",
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: "module", // 转换模式，取值为 global/module
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    rn: {
      appName: "taroDemo",
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  };

  if (process.env.NODE_ENV === "development") {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
