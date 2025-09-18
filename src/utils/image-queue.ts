/**
 * 图片加载队列管理器
 * 用于控制并发图片加载数量，避免内存峰值过高
 */

interface QueueTask<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class ImageLoadQueue {
  private queue: QueueTask<any>[] = [];
  private running: number = 0;
  private maxConcurrent: number;
  private isDestroyed: boolean = false;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加图片加载任务到队列
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    if (this.isDestroyed) {
      throw new Error('ImageLoadQueue has been destroyed');
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue() {
    if (this.isDestroyed) {
      return;
    }

    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const queueItem = this.queue.shift();
    if (!queueItem) {
      return;
    }

    this.running++;

    try {
      const result = await queueItem.task();
      queueItem.resolve(result);
    } catch (error) {
      console.warn('图片加载任务失败:', error);
      queueItem.reject(error);
    } finally {
      this.running--;
      // 继续处理队列
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      running: this.running,
      pending: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      isDestroyed: this.isDestroyed,
    };
  }

  /**
   * 清空队列并停止所有任务
   */
  destroy() {
    this.isDestroyed = true;
    
    // 拒绝所有待处理的任务
    while (this.queue.length > 0) {
      const queueItem = this.queue.shift();
      if (queueItem) {
        queueItem.reject(new Error('Queue destroyed'));
      }
    }
    
    console.log('ImageLoadQueue destroyed, cleared all pending tasks');
  }

  /**
   * 动态调整并发数量
   */
  setMaxConcurrent(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
    this.processQueue(); // 重新处理队列
  }
}

// 全局图片加载队列实例
export const globalImageQueue = new ImageLoadQueue(3);

/**
 * 带重试机制的图片加载函数
 */
export const loadImageWithRetry = async (
  src: string,
  maxRetries: number = 2
): Promise<{ path: string; width: number; height: number }> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await globalImageQueue.add(async () => {
        return new Promise<{ path: string; width: number; height: number }>((resolve, reject) => {
          // 使用 Taro 的图片加载 API
          const Taro = require('@tarojs/taro').default;
          
          Taro.getImageInfo({
            src,
            success: (res: any) => {
              resolve({
                path: res.path,
                width: res.width,
                height: res.height,
              });
            },
            fail: (err: any) => {
              reject(new Error(`图片加载失败: ${err.errMsg || '未知错误'}`));
            },
          });
        });
      });

      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // 指数退避重试
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`图片 ${src} 加载失败，${delay}ms 后重试 (${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('图片加载失败');
};

