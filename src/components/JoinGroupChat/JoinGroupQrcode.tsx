import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import qrcodeIcon from "@/assets/icons/qrcode.svg";
import { APP_QRCODE_IMAGE_URL, JOIN_GROUP_AVATAR_IMAGE_URL } from "@/config";
import QRCodeScanner from "./QRCodeScanner";

export interface JoinGroupQrcodeProps {
    groupInfo?: {
        name: string;
        qrCodeUrl?: string;
    };
    showQRCode: boolean;
    onClose: () => void;
}

const defaultGroupInfo = {
    name: "璞光集水晶手串交流群",
    qrCodeUrl: APP_QRCODE_IMAGE_URL
};

const JoinGroupQrcode: React.FC<JoinGroupQrcodeProps> = ({
    groupInfo = defaultGroupInfo,
    showQRCode = false,
    onClose = () => { },
}) => {
    const handleQRCodeClose = () => {
        onClose();
    };

    const handleOverlayClick = () => {
        if (showQRCode) {
            handleQRCodeClose();
        }
    };

    const handleDialogClick = (e: any) => {
        e.stopPropagation();
    };

    // 长按识别二维码
    const handleQRCodeLongPress = () => {
        const qrCodeUrl = groupInfo.qrCodeUrl || "";
        if (qrCodeUrl) {
            Taro.showActionSheet({
                itemList: ['识别二维码', '保存二维码', '分享二维码'],
                success: (res) => {
                    switch (res.tapIndex) {
                        case 0: // 识别二维码
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
                            break;
                        case 1: // 保存二维码
                            Taro.saveImageToPhotosAlbum({
                                filePath: qrCodeUrl,
                                success: () => {
                                    Taro.showToast({
                                        title: '保存成功',
                                        icon: 'success'
                                    });
                                },
                                fail: () => {
                                    Taro.showToast({
                                        title: '保存失败',
                                        icon: 'none'
                                    });
                                }
                            });
                            break;
                        case 2: // 分享二维码
                            Taro.showToast({
                                title: '请点击右上角分享',
                                icon: 'none'
                            });
                            break;
                    }
                }
            });
        }
    };

    // 点击二维码也可以识别
    const handleQRCodeClick = () => {
        handleQRCodeLongPress();
    };

    return (
        <View className={styles.joinGroupChatOverlay} onClick={handleOverlayClick}>
            {/* 二维码弹窗 */}
            {showQRCode && (
                <View className={styles.qrCodeOverlay} onClick={handleQRCodeClose}>
                    <View className={styles.qrCodeDialog} onClick={handleDialogClick}>
                        <View className={styles.qrCodeHeader}>
                            <Text className={styles.qrCodeTitle}>扫码加入群聊</Text>
                            <View className={styles.closeButton} onClick={handleQRCodeClose}>
                                <Image src={qrcodeIcon} className={styles.closeIcon} />
                            </View>
                        </View>
                        <QRCodeScanner
                            qrCodeUrl={groupInfo.qrCodeUrl || ""}
                            title="扫码加入群聊"
                            description="长按或点击二维码识别"
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

export default JoinGroupQrcode; 