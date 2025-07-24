import Taro from '@tarojs/taro';
import { pageUrls } from '@/config/page-urls';

/**
 * 打开外部链接工具类
 */
export class LinkUtils {
  /**
   * 打开外部网页链接
   * @param url 外部链接地址
   * @param title 页面标题（可选）
   */
  static openExternalUrl(url: string, title?: string) {
    if (!url) {
      Taro.showToast({
        title: '链接地址不能为空',
        icon: 'none'
      });
      return;
    }

    // 编码URL参数
    const encodedUrl = encodeURIComponent(url);
    let targetUrl = `${pageUrls.webview}?url=${encodedUrl}`;
    
    if (title) {
      targetUrl += `&title=${encodeURIComponent(title)}`;
    }

    Taro.navigateTo({
      url: targetUrl
    });
  }

  /**
   * 打开PDF文档
   * @param url PDF文档链接
   * @param title 文档标题（可选）
   */
  static openPdfDocument(url: string, title?: string) {
    this.openExternalUrl(url, title || 'PDF文档');
  }

  /**
   * 打开Word文档
   * @param url Word文档链接
   * @param title 文档标题（可选）
   */
  static openWordDocument(url: string, title?: string) {
    this.openExternalUrl(url, title || 'Word文档');
  }

  /**
   * 打开Excel文档
   * @param url Excel文档链接
   * @param title 文档标题（可选）
   */
  static openExcelDocument(url: string, title?: string) {
    this.openExternalUrl(url, title || 'Excel文档');
  }

  /**
   * 打开在线文档（腾讯文档、石墨文档等）
   * @param url 在线文档链接
   * @param title 文档标题（可选）
   */
  static openOnlineDocument(url: string, title?: string) {
    this.openExternalUrl(url, title || '在线文档');
  }

  /**
   * 预览图片
   * @param urls 图片链接数组
   * @param current 当前显示的图片链接，默认为第一张
   */
  static previewImages(urls: string[], current?: string) {
    if (!urls || urls.length === 0) {
      Taro.showToast({
        title: '图片链接不能为空',
        icon: 'none'
      });
      return;
    }

    Taro.previewImage({
      urls,
      current: current || urls[0],
      success: () => {
        console.log('图片预览成功');
      },
      fail: (error) => {
        console.error('图片预览失败:', error);
        Taro.showToast({
          title: '图片预览失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 下载文件
   * @param url 文件链接
   * @param fileName 文件名（可选）
   */
  static downloadFile(url: string, fileName?: string) {
    if (!url) {
      Taro.showToast({
        title: '文件链接不能为空',
        icon: 'none'
      });
      return;
    }

    Taro.showLoading({
      title: '下载中...'
    });

    Taro.downloadFile({
      url,
      success: (res) => {
        Taro.hideLoading();
        
        if (res.statusCode === 200) {
          // 保存文件到本地
          Taro.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              Taro.showToast({
                title: '文件保存成功',
                icon: 'success'
              });
              console.log('文件保存路径:', saveRes.savedFilePath);
            },
            fail: (error) => {
              console.error('文件保存失败:', error);
              Taro.showToast({
                title: '文件保存失败',
                icon: 'none'
              });
            }
          });
        } else {
          Taro.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        Taro.hideLoading();
        console.error('文件下载失败:', error);
        Taro.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 打开文档链接（自动识别类型）
   * @param url 文档链接
   * @param title 文档标题（可选）
   */
  static openDocument(url: string, title?: string) {
    if (!url) {
      Taro.showToast({
        title: '文档链接不能为空',
        icon: 'none'
      });
      return;
    }

    // 根据URL后缀判断文档类型
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        this.openPdfDocument(url, title);
        break;
      case 'doc':
      case 'docx':
        this.openWordDocument(url, title);
        break;
      case 'xls':
      case 'xlsx':
        this.openExcelDocument(url, title);
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        this.previewImages([url]);
        break;
      default:
        // 默认使用webview打开
        this.openExternalUrl(url, title);
    }
  }

  /**
   * 复制链接到剪贴板
   * @param url 要复制的链接
   */
  static copyToClipboard(url: string) {
    if (!url) {
      Taro.showToast({
        title: '链接不能为空',
        icon: 'none'
      });
      return;
    }

    Taro.setClipboardData({
      data: url,
      success: () => {
        Taro.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('复制失败:', error);
        Taro.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  }
}

export default LinkUtils; 