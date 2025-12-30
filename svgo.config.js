module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // 保留 viewBox，Taro 需要它
          removeViewBox: false,
          // 保留必要的属性
          removeUnknownsAndDefaults: {
            keepRoleAttr: true,
          },
        },
      },
    },
    // 移除不必要的属性
    'removeXMLNS',
    // 清理 IDs
    'cleanupIDs',
    // 合并路径
    'mergePaths',
    // 移除空属性
    'removeEmptyAttrs',
    // 移除空容器
    'removeEmptyContainers',
    // 移除不必要的转换
    'removeUselessStrokeAndFill',
    // 简化数字精度
    {
      name: 'cleanupNumericValues',
      params: {
        floatPrecision: 2,
      },
    },
    // 压缩路径
    {
      name: 'convertPathData',
      params: {
        floatPrecision: 2,
        transformPrecision: 5,
      },
    },
  ],
};

