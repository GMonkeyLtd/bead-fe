// 静态导入所有mock数据文件
import beadlistMock from '../mock/beadlist.json'
import loginMock from '../mock/login.json'
import personalizationstep1Mock from '../mock/personalizationstep1.json'
import personalizationstep3Mock from '../mock/personalizationstep3.json'
import queryorderMock from '../mock/queryorder.json'

// Mock数据映射表
const mockDataMap: Record<string, any> = {
  beadlist: beadlistMock,
  login: loginMock,
  personalizationstep1: personalizationstep1Mock,
  personalizationstep3: personalizationstep3Mock,
  queryorder: queryorderMock,
}

/**
 * Mock数据管理器
 * 
 * 使用示例:
 * ```typescript
 * // 根据URL获取Mock数据
 * const data = MockManager.getMockDataByUrl('/api/beadlist');
 * 
 * // 直接根据键名获取Mock数据
 * const data = MockManager.getMockData('beadlist');
 * 
 * // 检查是否存在Mock数据
 * if (MockManager.hasMockData('login')) {
 *   // 处理逻辑
 * }
 * 
 * // 获取所有可用的Mock数据键名
 * const keys = MockManager.getAvailableKeys();
 * ```
 */
export class MockManager {
  /**
   * 获取Mock数据
   * @param key 数据键名
   * @returns Mock数据或null
   */
  static getMockData(key: string): any {
    return mockDataMap[key] || null
  }

  /**
   * 检查是否存在对应的Mock数据
   * @param key 数据键名
   * @returns 是否存在
   */
  static hasMockData(key: string): boolean {
    return key in mockDataMap
  }

  /**
   * 获取所有可用的Mock数据键名
   * @returns 键名数组
   */
  static getAvailableKeys(): string[] {
    return Object.keys(mockDataMap)
  }

  /**
   * 根据URL获取对应的Mock数据
   * @param url 请求URL
   * @returns Mock数据或null
   */
  static getMockDataByUrl(url: string): any {
    const urlArr = url?.split('/')
    const key = urlArr?.length > 0 ? urlArr[urlArr.length - 1] : ''
    const mockData = this.getMockData(key.replace('?', ''))
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData)
      }, 500)
    })
  }
}

export default MockManager 