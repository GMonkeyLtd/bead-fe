import React, { useState } from "react";
import { View, Text, Image, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./QRCodeScanner.module.scss";

interface QRCodeScannerProps {
    qrCodeUrl: string;
    title?: string;
    description?: string;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
    qrCodeUrl,
    title = "扫描二维码",
    description = "长按或点击二维码进行识别"
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // 方法一：直接预览图片（最简单）
    const handleSimplePreview = () => {
        Taro.previewImage({
            current: qrCodeUrl,
            urls: [qrCodeUrl],
            success: () => {
                console.log('二维码预览成功');
            },
            fail: (err) => {
                console.error('二维码预览失败:', err);
                Taro.showToast({
                    title: '二维码识别失败',
                    icon: 'none'
                });
            }
        });
    };

    // 方法二：长按显示操作菜单
    const handleLongPress = () => {
        Taro.showActionSheet({
            itemList: ['识别二维码', '保存二维码', '复制二维码链接'],
            success: (res) => {
                switch (res.tapIndex) {
                    case 0: // 识别二维码
                        handleSimplePreview();
                        break;
                    case 1: // 保存二维码
                        handleSaveQRCode();
                        break;
                    case 2: // 复制链接
                        handleCopyLink();
                        break;
                }
            }
        });
    };

    // 保存二维码到相册
    const handleSaveQRCode = async () => {
        setIsLoading(true);
        try {
            // 先下载图片
            const downloadRes = await Taro.downloadFile({
                url: qrCodeUrl
            });

            if (downloadRes.statusCode === 200) {
                // 保存到相册
                await Taro.saveImageToPhotosAlbum({
                    filePath: downloadRes.tempFilePath
                });

                Taro.showToast({
                    title: '保存成功',
                    icon: 'success'
                });
            }
        } catch (error) {
            console.error('保存失败:', error);
            Taro.showToast({
                title: '保存失败',
                icon: 'none'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 复制二维码链接
    const handleCopyLink = () => {
        Taro.setClipboardData({
            data: qrCodeUrl,
            success: () => {
                Taro.showToast({
                    title: '链接已复制',
                    icon: 'success'
                });
            },
            fail: () => {
                Taro.showToast({
                    title: '复制失败',
                    icon: 'none'
                });
            }
        });
    };


    return (
        <View className={styles.container}>
            <Image
                src={qrCodeUrl}
                className={styles.qrCodeImage}
                // onLongPress={handleLongPress}
                onClick={handleSimplePreview}
                showMenuByLongpress={true}
                mode="aspectFit"
            />
            <Text className={styles.description}>{description}</Text>
        </View>
    );
};

export default QRCodeScanner; 