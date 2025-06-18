import Taro from '@tarojs/taro';

/**
 * 图片缓存管理器
 * 用于下载网络图片并缓存到本地，解决Canvas中无法直接使用网络URL的问题
 */
export class ImageCacheManager {
  private static cache = new Map<string, string>();
  private static downloadingPromises = new Map<string, Promise<string>>();

  /**
   * 下载单张图片并缓存
   * @param url 图片URL
   * @returns 本地文件路径
   */
  static async downloadImage(url: string): Promise<string> {
    // 如果已经缓存，直接返回本地路径
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // 如果正在下载，返回下载Promise
    if (this.downloadingPromises.has(url)) {
      return this.downloadingPromises.get(url)!;
    }

    // 创建下载Promise
    const downloadPromise = this.performDownload(url);
    this.downloadingPromises.set(url, downloadPromise);

    try {
      const localPath = await downloadPromise;
      this.downloadingPromises.delete(url);
      return localPath;
    } catch (error) {
      this.downloadingPromises.delete(url);
      throw error;
    }
  }

  /**
   * 执行实际的下载操作
   * @param url 图片URL
   * @returns 本地文件路径
   */
  private static async performDownload(url: string): Promise<string> {
    try {
      // console.log(`📸 开始下载图片: ${url}`);
      
      const res = await Taro.downloadFile({
        url: url,
      });
      
      if (res.statusCode === 200) {
        // 缓存本地路径
        this.cache.set(url, res.tempFilePath);
        // console.log(`✅ 图片下载成功: ${url} -> ${res.tempFilePath}`);
        return res.tempFilePath;
      } else {
        throw new Error(`下载失败，状态码: ${res.statusCode}`);
      }
    } catch (error) {
      console.error(`❌ 图片下载失败: ${url}`, error);
      throw error;
    }
  }

  /**
   * 批量下载图片
   * @param urls 图片URL数组
   * @returns Map<原始URL, 本地路径>
   */
  static async downloadImages(urls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    const downloadPromises = urls.map(async (url) => {
      try {
        const localPath = await this.downloadImage(url);
        results.set(url, localPath);
      } catch (error) {
        console.error(`批量下载失败: ${url}`, error);
        // 下载失败的不加入结果，继续处理其他图片
      }
    });

    await Promise.allSettled(downloadPromises);
    // console.log(`📊 批量下载完成: 成功 ${results.size}/${urls.length} 张图片`);
    return results;
  }

  /**
   * 预处理图片路径数组，将网络URL替换为本地路径
   * @param imagePaths 混合的图片路径数组（可能包含本地路径和网络URL）
   * @returns Map<原始路径, 处理后路径>
   */
  static async processImagePaths(imagePaths: string[]): Promise<Map<string, string>> {
    const processedPaths = new Map<string, string>();
    
    // 分离网络URL和本地路径
    const networkUrls: string[] = [];
    const localPaths: string[] = [];
    
    imagePaths.forEach(path => {
      if (typeof path === 'string' && path.startsWith('http')) {
        networkUrls.push(path);
      } else {
        localPaths.push(path);
        processedPaths.set(path, path); // 本地路径不需要处理
      }
    });

    // 下载网络图片
    if (networkUrls.length > 0) {
      const downloadedImages = await this.downloadImages(networkUrls);
      downloadedImages.forEach((localPath, originalUrl) => {
        processedPaths.set(originalUrl, localPath);
      });
    }

    return processedPaths;
  }

  /**
   * 检查URL是否为网络地址
   * @param path 路径字符串
   * @returns 是否为网络URL
   */
  static isNetworkUrl(path: string): boolean {
    return typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'));
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  static getCacheStats() {
    return {
      cacheSize: this.cache.size,
      downloadingCount: this.downloadingPromises.size,
      cachedUrls: Array.from(this.cache.keys())
    };
  }

  /**
   * 清空缓存
   */
  static clearCache() {
    this.cache.clear();
    console.log('🗑️ 图片缓存已清空');
  }

  /**
   * 删除指定URL的缓存
   * @param url 要删除的URL
   */
  static removeCacheItem(url: string) {
    if (this.cache.has(url)) {
      this.cache.delete(url);
      console.log(`🗑️ 已删除缓存: ${url}`);
    }
  }
} 