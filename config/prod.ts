import type { UserConfigExport } from "@tarojs/cli"

export default {
  mini: {
    webpackChain(chain) {
      chain.optimization.minimize(true);
      // 🔥 关键优化：禁用 source map，减少 3MB+ 体积
      chain.devtool(false);

      // 🔥 优化代码分割
      chain.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          common: {
            name: 'common',
            minChunks: 2,
            priority: 1
          },
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10
          },
          // 🔥 将 lunar-typescript 单独打包
          lunar: {
            name: 'lunar',
            test: /[\\/]node_modules[\\/]lunar-typescript[\\/]/,
            priority: 20
          },
          // 🔥 将 marked 单独打包
          marked: {
            name: 'marked',
            test: /[\\/]node_modules[\\/]marked[\\/]/,
            priority: 20
          }
        }
      });

      chain.plugin('terser').use(require('terser-webpack-plugin'), [{
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'],
            // 🔥 额外的压缩选项
            passes: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_proto: true
          },
          mangle: {
            safari10: true
          }
        }
      }]);
    },
    commonChunks: ['runtime', 'vendors', 'taro', 'common', 'lunar', 'marked'],
    // 启用主包优化
    optimizeMainPackage: {
      enable: true,
      exclude: []
    },
    // 禁用 source map
    enableSourceMap: false,
    sourceMapType: 'none',
    // 图片压缩
    imageUrlLoaderOption: {
      limit: 1024, // 🔥 进一步降低内联阈值，只内联非常小的图片
      quality: 75, // 🔥 降低质量以减小体积
    },
    // 🔥 CSS 压缩优化
    cssLoaderOption: {
      localIdentName: '[hash:base64:5]'
    },
    // 🔥 启用 CSS Tree Shaking
    postcss: {
      pxtransform: {
        enable: false
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[hash:base64:5]'
        }
      }
    }
  },
  preloadRule: {
    "pages/home/index": {
      "network": "all",
      "packages": ["pages-design"]
    },
    "pages-design/design/index": {
      "network": "all",
      "packages": ["pages-user", "pages-utils"]
    }
  },
  h5: {
    /**
     * WebpackChain 插件配置
     * @docs https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain) {
    //   /**
    //    * 如果 h5 端编译后体积过大，可以使用 webpack-bundle-analyzer 插件对打包体积进行分析。
    //    * @docs https://github.com/webpack-contrib/webpack-bundle-analyzer
    //    */
    //   chain.plugin('analyzer')
    //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
    //   /**
    //    * 如果 h5 端首屏加载时间过长，可以使用 prerender-spa-plugin 插件预加载首页。
    //    * @docs https://github.com/chrisvfritz/prerender-spa-plugin
    //    */
    //   const path = require('path')
    //   const Prerender = require('prerender-spa-plugin')
    //   const staticDir = path.join(__dirname, '..', 'dist')
    //   chain
    //     .plugin('prerender')
    //     .use(new Prerender({
    //       staticDir,
    //       routes: [ '/pages/index/index' ],
    //       postProcess: (context) => ({ ...context, outputPath: path.join(staticDir, 'index.html') })
    //     }))
    // }
  }
} satisfies UserConfigExport<'vite'>
