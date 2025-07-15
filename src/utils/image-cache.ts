import Taro from '@tarojs/taro';

// 简化的缓存项接口
interface CacheItem {
  path: string;
  timestamp: number;
  size: number;
}

/**
 * 优化的图片缓存管理器
 * 简化版本，专注于解决循环渲染和内存问题
 */
export class ImageCacheManager {
  private static cache = new Map<string, CacheItem>();
  private static downloadingPromises = new Map<string, Promise<string>>();
  
  // 配置项
  private static readonly MAX_CACHE_SIZE = 30; // 最大缓存数量
  private static readonly CACHE_EXPIRE_TIME = 30 * 60 * 1000; // 30分钟过期
  private static readonly MAX_MEMORY_USAGE = 50 * 1024 * 1024; // 50MB最大内存使用
  
  private static currentMemoryUsage = 0;
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * 下载单张图片并缓存
   * @param url 图片URL
   * @returns 本地文件路径
   */
  static async downloadImage(url: string): Promise<string> {
    // 检查缓存
    const cacheItem = this.cache.get(url);
    if (cacheItem && !this.isExpired(cacheItem)) {
      return cacheItem.path;
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
      const res = await Taro.downloadFile({
        url: url,
      });
      
      if (res.statusCode === 200) {
        // 获取文件信息
        const fileInfo = await this.getFileInfo(res.tempFilePath);
        
        // 检查内存使用情况
        if (this.currentMemoryUsage + fileInfo.size > this.MAX_MEMORY_USAGE) {
          this.performMemoryCleanup();
        }
        
        // 缓存文件信息
        const cacheItem: CacheItem = {
          path: res.tempFilePath,
          timestamp: Date.now(),
          size: fileInfo.size
        };
        
        this.cache.set(url, cacheItem);
        this.currentMemoryUsage += fileInfo.size;
        
        // 如果超过最大缓存数量，删除最旧的缓存
        if (this.cache.size > this.MAX_CACHE_SIZE) {
          this.performSizeCleanup();
        }
        
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
   * 获取文件信息
   * @param filePath 文件路径
   * @returns 文件信息
   */
  private static async getFileInfo(filePath: string): Promise<{ size: number }> {
    try {
      const stats = await Taro.getFileInfo({ filePath });
      return { size: (stats as any).size || 0 };
    } catch (error) {
      console.warn('获取文件信息失败:', error);
      return { size: 0 };
    }
  }

  /**
   * 检查缓存项是否过期
   * @param item 缓存项
   * @returns 是否过期
   */
  private static isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > this.CACHE_EXPIRE_TIME;
  }

  /**
   * 执行内存清理
   */
  private static performMemoryCleanup() {
    // 按时间排序，删除最旧的缓存
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 删除一半的缓存
    const deleteCount = Math.ceil(entries.length / 2);
    for (let i = 0; i < deleteCount; i++) {
      this.removeCacheItem(entries[i][0]);
    }
    
    console.log(`🧹 内存清理完成: 删除 ${deleteCount} 项缓存`);
  }

  /**
   * 执行大小清理
   */
  private static performSizeCleanup() {
    // 按时间排序，删除最旧的缓存
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 删除多余的缓存项
    const deleteCount = this.cache.size - this.MAX_CACHE_SIZE;
    for (let i = 0; i < deleteCount; i++) {
      this.removeCacheItem(entries[i][0]);
    }
  }

  /**
   * 批量下载图片
   * @param urls 图片URL数组
   * @returns Map<原始URL, 本地路径>
   */
  static async downloadImages(urls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // 限制并发下载数量
    const CONCURRENT_LIMIT = 3;
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += CONCURRENT_LIMIT) {
      chunks.push(urls.slice(i, i + CONCURRENT_LIMIT));
    }
    
    for (const chunk of chunks) {
      const downloadPromises = chunk.map(async (url) => {
        try {
          const localPath = await this.downloadImage(url);
          results.set(url, localPath);
        } catch (error) {
          console.error(`批量下载失败: ${url}`, error);
        }
      });
      
      await Promise.allSettled(downloadPromises);
    }
    
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
    const totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);
    
    return {
      cacheSize: this.cache.size,
      downloadingCount: this.downloadingPromises.size,
      totalMemoryUsage: totalSize,
      maxMemoryUsage: this.MAX_MEMORY_USAGE,
      memoryUsagePercentage: (totalSize / this.MAX_MEMORY_USAGE) * 100,
      cachedUrls: Array.from(this.cache.keys())
    };
  }

  /**
   * 清空缓存
   */
  static clearCache() {
    this.cache.clear();
    this.currentMemoryUsage = 0;
    console.log('🗑️ 图片缓存已清空');
  }

  /**
   * 删除指定URL的缓存
   * @param url 要删除的URL
   */
  static removeCacheItem(url: string) {
    const item = this.cache.get(url);
    if (item) {
      this.cache.delete(url);
      this.currentMemoryUsage -= item.size;
      console.log(`🗑️ 已删除缓存: ${url}`);
    }
  }

  /**
   * 启动定期清理过期缓存
   */
  static startPeriodicCleanup() {
    if (this.cleanupTimer) {
      return;
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 停止定期清理
   */
  static stopPeriodicCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 清理过期缓存项
   */
  private static cleanupExpiredItems() {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.removeCacheItem(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 清理过期缓存: ${expiredKeys.length} 项`);
    }
  }
} 