import Taro from "@tarojs/taro";

interface CompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 检查是否为网络 URL
 */
function isNetworkUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * 下载网络图片到本地临时文件
 */
async function downloadNetworkImage(url: string): Promise<string> {
  try {
    const downloadResult = await Taro.downloadFile({
      url: url,
    });
    
    if (downloadResult.statusCode === 200) {
      return downloadResult.tempFilePath;
    } else {
      throw new Error(`下载图片失败，状态码: ${downloadResult.statusCode}`);
    }
  } catch (err) {
    console.error("下载网络图片失败:", err);
    throw err;
  }
}

export async function compressImage(filePath: string, options: CompressOptions = {}) {
  const { quality = 80, maxWidth = 1024, maxHeight = 1024 } = options;
  
  try {
    const compressedResult = await Taro.compressImage({
      src: filePath,
      quality,
      compressedWidth: maxWidth,
      compressedHeight: maxHeight,
    });
    return compressedResult.tempFilePath;
  } catch (err) {
    console.error("压缩图片失败:", err);
    return filePath; // 如果压缩失败，返回原图
  }
}

export async function imageToBase64(
  filePath: string, 
  needPrefix = true,
  compress = false,
  compressOptions?: CompressOptions,
  format: 'jpeg' | 'png' = 'png'
) {
  try {
    // 如果是网络 URL，先下载到本地
    let localFilePath = filePath;
    if (isNetworkUrl(filePath)) {
      console.log("检测到网络图片，开始下载:", filePath);
      localFilePath = await downloadNetworkImage(filePath);
    }

    // 如果需要压缩，进行压缩处理
    const finalFilePath = compress 
      ? await compressImage(localFilePath, compressOptions)
      : localFilePath;

    return new Promise<string>((resolve, reject) => {
      Taro.getFileSystemManager().readFile({
        filePath: finalFilePath,
        encoding: "base64",
        success: (res) => {
          const base64 = needPrefix
            ? `data:image/${format};base64,${res.data as string}`
            : res.data as string;
          resolve(base64);
        },
        fail: (err) => {
          console.error("图片转 Base64 失败:", err);
          reject(err);
        },
      });
    });
  } catch (err) {
    console.error("处理图片失败:", err);
    throw err;
  }
}

/**
 * 专门处理网络图片转 Base64 的便捷函数
 * @param imageUrl 网络图片 URL
 * @param needPrefix 是否需要添加 data:image 前缀
 * @param compress 是否压缩图片
 * @param compressOptions 压缩选项
 * @param format 图片格式
 * @returns Promise<string> Base64 字符串
 */
export async function networkImageToBase64(
  imageUrl: string,
  needPrefix = true,
  compress = false,
  compressOptions?: CompressOptions,
  format: 'jpeg' | 'png' = 'png'
): Promise<string> {
  if (!isNetworkUrl(imageUrl)) {
    throw new Error('提供的 URL 不是有效的网络图片地址');
  }
  
  return imageToBase64(imageUrl, needPrefix, compress, compressOptions, format);
}

export function uploadImageBinary(filePath: string, uploadUrl: string) {
  return Taro.uploadFile({
    url: uploadUrl,
    filePath,
    name: 'file',
    header: {
      'content-type': 'multipart/form-data'
    }
  });
}
