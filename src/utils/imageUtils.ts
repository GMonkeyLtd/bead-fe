import Taro from "@tarojs/taro";

interface CompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
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
  compress = true,
  compressOptions?: CompressOptions
) {
  try {
    const finalFilePath = compress 
      ? await compressImage(filePath, compressOptions)
      : filePath;

    return new Promise((resolve, reject) => {
      Taro.getFileSystemManager().readFile({
        filePath: finalFilePath,
        encoding: "base64",
        success: (res) => {
          const base64 = needPrefix
            ? `data:image/jpeg;base64,${res.data}`
            : res.data;
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
