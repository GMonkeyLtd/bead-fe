import Taro from '@tarojs/taro'
import { AuthManager } from './auth'

// 定义请求配置接口
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  loadingText?: string
  showError?: boolean
  skipAuth?: boolean // 是否跳过认证检查
}

// 定义响应数据接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 默认配置
const defaultConfig = {
  baseURL: '', // 在这里设置你的API基础URL
  timeout: 60000,
  showLoading: true,
  loadingText: '定制中...',
  showError: true,
}

// 请求拦截器 - 在发送请求前的处理
const requestInterceptor = async (config: RequestConfig) => {
  // 添加通用headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.header,
  }

  // 如果不跳过认证，则添加认证信息
  if (!config.skipAuth) {
    try {
      // 获取token，如果没有则自动登录
      const token = await AuthManager.getToken();
      console.log(token, 'token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('已添加认证token到请求头');
      } else {
        console.warn('获取token失败，可能登录失败');
        // 可以选择抛出错误或者继续请求
        // throw new Error('用户未登录');
      }
    } catch (error) {
      console.error('获取认证信息失败:', error);
      // 根据业务需求，可以选择抛出错误或继续请求
      throw new Error('认证失败，请重试');
    }
  }
  return {
    ...config,
    header: headers,
    url: defaultConfig.baseURL + config.url,
  }
}

// 响应拦截器 - 处理响应数据
const responseInterceptor = <T>(response: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    const { statusCode, data } = response

    // HTTP状态码检查
    if (statusCode === 200) {
      // 检查业务状态码
      if (data.code !== undefined) {
        if (data.code === 200 || data.success) {
          resolve(data)
        } else if (data.code === 401) {
          // token过期或无效，清除本地认证信息
          AuthManager.clearAuth();
          reject(new Error('登录已过期，请重新登录'));
        } else {
          reject(new Error(data.message || '请求失败'));
        }
      } else {
        // 没有业务状态码，直接返回data
        resolve(data.data || data)
      }
    } else if (statusCode === 401) {
      // HTTP 401，认证失败
      AuthManager.clearAuth();
      reject(new Error('登录已过期，请重新登录'));
    } else {
      // 其他HTTP错误
      let errorMessage = '网络请求失败'
      switch (statusCode) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 403:
          errorMessage = '无权限访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 503:
          errorMessage = '服务暂不可用'
          break
      }
      reject(new Error(errorMessage))
    }
  })
}

// 核心请求函数
const request = async <T = any>(config: RequestConfig): Promise<T> => {
  let retryCount = 0;
  const maxRetries = 1; // 最多重试1次（用于token过期后重新登录）
  const executeRequest = async (): Promise<T> => {
    // 请求前拦截处理
    const finalConfig = await requestInterceptor(config)

    // 显示加载提示
    if (config.showLoading !== false) {
      Taro.showLoading({
        title: config.loadingText || defaultConfig.loadingText,
        mask: true,
      })
    }

    try {
      const response = await Taro.request({
        url: finalConfig.url,
        method: finalConfig.method || 'GET',
        data: finalConfig.data,
        header: finalConfig.header,
        timeout: finalConfig.timeout || defaultConfig.timeout,
      })

      // 隐藏加载提示
      if (config.showLoading !== false) {
        Taro.hideLoading()
      }

      return await responseInterceptor<T>(response)
    } catch (error: any) {
      // 隐藏加载提示
      if (config.showLoading !== false) {
        Taro.hideLoading()
      }

      // 如果是认证错误且还有重试次数，尝试重新登录后重试
      if (error.message?.includes('登录已过期') && retryCount < maxRetries) {
        retryCount++;
        console.log(`认证失败，尝试重新登录后重试 (${retryCount}/${maxRetries})`);
        
        try {
          // 清除旧的认证信息并重新登录
          AuthManager.clearAuth();
          await AuthManager.login();
          
          // 递归重试请求
          return await executeRequest();
        } catch (loginError) {
          console.error('重新登录失败:', loginError);
          throw new Error('登录失败，请手动重试');
        }
      }

      // 显示错误提示
      if (config.showError !== false) {
        Taro.showToast({
          title: error.message || '请求失败',
          icon: 'none',
          duration: 2000,
        })
      }

      throw error
    }
  }

  return await executeRequest();
}

// 封装常用的HTTP方法
export const http = {
  // GET请求
  get: <T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      url: params ? `${url}?${new URLSearchParams(params).toString()}` : url,
      method: 'GET',
      ...config,
    })
  },

  // POST请求
  post: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    })
  },

  // PUT请求
  put: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    })
  },

  // DELETE请求
  delete: <T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      url,
      method: 'DELETE',
      ...config,
    })
  },

  // PATCH请求
  patch: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    })
  },

  // 文件上传 - 统一使用token认证
  upload: async (url: string, filePath: string, formData?: Record<string, any>): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 获取认证token
        const token = await AuthManager.getToken();
        
        // 显示上传进度
        Taro.showLoading({ title: '上传中...', mask: true })

        const uploadTask = Taro.uploadFile({
          url: defaultConfig.baseURL + url,
          filePath,
          name: 'file',
          formData,
          header: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          success: (res) => {
            Taro.hideLoading()
            try {
              const data = JSON.parse(res.data)
              if (data.code === 200 || data.success) {
                resolve(data)
              } else if (data.code === 401) {
                // token过期，清除认证信息
                AuthManager.clearAuth();
                reject(new Error('登录已过期，请重新登录'))
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } catch (error) {
              reject(new Error('响应数据格式错误'))
            }
          },
          fail: (error) => {
            Taro.hideLoading()
            Taro.showToast({ title: '上传失败', icon: 'none' })
            reject(error)
          },
        })

        // 可以通过uploadTask监听上传进度
        uploadTask.progress((res) => {
          console.log('上传进度', res.progress)
        })
      } catch (error) {
        Taro.hideLoading()
        reject(error)
      }
    })
  },
}

// 设置基础URL
export const setBaseURL = (baseURL: string) => {
  defaultConfig.baseURL = baseURL
}

// 设置默认配置
export const setDefaultConfig = (config: Partial<typeof defaultConfig>) => {
  Object.assign(defaultConfig, config)
}

// 导出核心请求函数，用于特殊场景
export { request }

// 默认导出
export default http
