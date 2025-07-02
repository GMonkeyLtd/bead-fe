/**
 * 可取消请求的使用示例
 * 展示如何在不同场景下使用取消令牌功能
 */

import { CancelToken, RequestManager } from './request'
import api, { managedApi, requestManager } from './api'

// 示例1: 基本的取消令牌使用
export class BasicCancelExample {
  private cancelToken?: CancelToken

  async quickGenerate(params: any) {
    try {
      // 创建取消令牌
      this.cancelToken = CancelToken.create()
      
      // 发起请求
      const result = await api.generate.quickGenerate(params, {
        cancelToken: this.cancelToken
      })
      
      console.log('生成成功:', result)
      return result
    } catch (error: any) {
      if (error.message?.includes('请求已取消')) {
        console.log('用户取消了请求')
      } else {
        console.error('请求失败:', error)
      }
      throw error
    }
  }

  // 取消当前请求
  cancel(reason?: string) {
    if (this.cancelToken) {
      this.cancelToken.cancel(reason)
      this.cancelToken = undefined
    }
  }
}

// 示例2: 使用请求管理器管理多个请求
export class RequestManagerExample {
  private manager = new RequestManager()

  async startMultipleRequests() {
    try {
      // 同时发起多个请求
      const promise1 = this.manager.createRequest('generate1', (cancelToken) =>
        api.generate.quickGenerate({ 
          birth_year: 1990, 
          birth_month: 1, 
          birth_day: 1, 
          birth_hour: 12, 
          is_lunar: false 
        }, { cancelToken })
      )

      const promise2 = this.manager.createRequest('generate2', (cancelToken) =>
        api.generate.personalizedGenerate({ 
          birth_year: 1991, 
          birth_month: 2, 
          birth_day: 2, 
          birth_hour: 14, 
          is_lunar: false 
        }, { cancelToken })
      )

      // 等待所有请求完成
      const results = await Promise.all([promise1, promise2])
      console.log('所有请求完成:', results)
      return results
    } catch (error) {
      console.error('请求失败:', error)
      throw error
    }
  }

  // 取消指定请求
  cancelRequest(key: string) {
    this.manager.cancel(key, '用户取消了请求')
  }

  // 取消所有请求
  cancelAllRequests() {
    this.manager.cancelAll('用户取消了所有请求')
  }
}

// 示例3: 在组件中使用（React/Taro组件风格）
export class ComponentExample {
  private uploadCancelToken?: CancelToken
  private generateCancelToken?: CancelToken

  // 文件上传示例
  async uploadFile(filePath: string) {
    try {
      // 如果有正在进行的上传，先取消它
      if (this.uploadCancelToken) {
        this.uploadCancelToken.cancel('开始新的上传')
      }

      // 创建新的取消令牌
      this.uploadCancelToken = CancelToken.create()

      const result = await api.file.upload(filePath, {}, {
        cancelToken: this.uploadCancelToken
      })

      console.log('上传成功:', result)
      return result
    } catch (error: any) {
      if (error.message?.includes('已被取消')) {
        console.log('上传被取消')
      } else {
        console.error('上传失败:', error)
      }
      throw error
    } finally {
      this.uploadCancelToken = undefined
    }
  }

  // 取消上传
  cancelUpload() {
    if (this.uploadCancelToken) {
      this.uploadCancelToken.cancel('用户取消了上传')
    }
  }

  // 组件卸载时清理
  onUnmount() {
    // 取消所有正在进行的请求
    this.uploadCancelToken?.cancel('组件已卸载')
    this.generateCancelToken?.cancel('组件已卸载')
  }
}

// 示例4: 使用全局请求管理器
export class GlobalManagerExample {
  async quickGenerateWithGlobalManager(params: any) {
    try {
      // 使用全局管理器，会自动处理重复请求
      const result = await managedApi.quickGenerate('quick-generate', params)
      console.log('生成成功:', result)
      return result
    } catch (error: any) {
      if (error.message?.includes('已取消')) {
        console.log('请求被取消')
      } else {
        console.error('生成失败:', error)
      }
      throw error
    }
  }

  // 取消特定请求
  cancelQuickGenerate() {
    requestManager.cancel('quick-generate', '用户取消了快速生成')
  }

  // 批量上传文件
  async batchUpload(filePaths: string[]) {
    const uploadPromises = filePaths.map((filePath, index) => 
      managedApi.upload(`upload-${index}`, filePath)
    )

    try {
      const results = await Promise.all(uploadPromises)
      console.log('批量上传成功:', results)
      return results
    } catch (error) {
      console.error('批量上传失败:', error)
      // 取消所有上传
      filePaths.forEach((_, index) => {
        requestManager.cancel(`upload-${index}`, '批量上传失败，取消剩余上传')
      })
      throw error
    }
  }
}

// 示例5: 超时和取消的结合使用
export class TimeoutCancelExample {
  async requestWithTimeout<T>(
    requestFn: (cancelToken: CancelToken) => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const cancelToken = CancelToken.create()
    
    // 设置超时取消
    const timeoutId = setTimeout(() => {
      cancelToken.cancel(`请求超时 (${timeoutMs}ms)`)
    }, timeoutMs)

    try {
      const result = await requestFn(cancelToken)
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // 使用示例
  async generateWithTimeout(params: any) {
    return this.requestWithTimeout(
      (cancelToken) => api.generate.quickGenerate(params, { cancelToken }),
      5000 // 5秒超时
    )
  }
}

// 所有示例类已通过类定义时的 export 关键字导出

// 使用指南
export const USAGE_GUIDE = {
  basic: '基本使用：创建 CancelToken，传递给请求，调用 cancel() 取消',
  manager: '请求管理：使用 RequestManager 管理多个请求，支持批量取消',
  component: '组件中使用：在组件生命周期中管理请求，卸载时自动取消',
  global: '全局管理：使用 managedApi 和全局 requestManager 简化使用',
  timeout: '超时控制：结合定时器实现请求超时自动取消'
} 