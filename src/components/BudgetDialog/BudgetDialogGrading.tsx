import React, { useState, useMemo } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import api, { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import closeFillIcon from "@/assets/icons/close-fill.svg";
import { PriceTier } from "../PriceTierSelector";
import PriceTierSelector from "../PriceTierSelector";
import qualityCompareIcon from "@/assets/icons/quality-compare-icon.svg";
import QualityComparisonTable from "../QualityComparisonTable";

interface BudgetDialogProps {
    visible: boolean;
    title?: string;
    designNumber?: string;
    productImage?: string;
    onClose?: () => void;
    tierPriceSet?: { [key: string]: number },
    currentTierId?: number,
    tierPriceConfig?: any,
}

const levelMap = {
    1: 'basic',
    2: 'quality',
    3: 'premium',
}


const BudgetDialog: React.FC<BudgetDialogProps> = ({
    visible,
    title = "夏日睡莲",
    designNumber = "0001",
    productImage,
    onClose,
    tierPriceConfig,
    currentTierId,
    tierPriceSet,
}) => {
    console.log(tierPriceConfig, 'tierPriceConfig')
    const priceTiers = useMemo(() => {
        return tierPriceConfig?.map((item: any) => ({
            id: item.level,
            title: item.name,
            description: item.desc,
            price: tierPriceSet?.[`tier${item.level}_price`],
            isRecommended: item.level == 2,
        }));
    }, [tierPriceConfig]);

    const qualityFactors = useMemo(() => {
        const factorsData = tierPriceConfig?.[0]?.factors.map((item: any) => ({
            ...item,
            name: item.key,
            hasHelp: item.image,
            levels: {},
        }));
        tierPriceConfig?.forEach((config: any) => {
            config.factors.forEach((factor: any) => {
                factorsData.find((item: any) => {
                    if (item.name === factor.key) {
                        item.levels[levelMap[config.level]] = factor.value;
                    }
                })
            });
        });
        return factorsData;
    }, [tierPriceConfig]);
    const { keyboardHeight } = useKeyboardHeight();
    const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier | null>(priceTiers?.[currentTierId - 1]);

    const handleConfirm = async (isCustom = false) => {
        const userData = await userApi.getUserInfo();
        const { default_contact, phone, wechat_id } = userData?.data || {} as any;
        if (default_contact === 0 && !phone) {
            Taro.redirectTo({
                url: `${pageUrls.contactPreference}?designId=${designNumber}&tier=${selectedPriceTier?.id}&isCustom=${isCustom}`,
            });
            return;
        }
        if (default_contact === 1 && !wechat_id) {
            Taro.redirectTo({
                url: `${pageUrls.contactPreference}?designId=${designNumber}&tier=${selectedPriceTier?.id}&isCustom=${isCustom}`,
            });
            return;
        }

        api.userHistory
            .createOrder({
                design_id: parseInt(designNumber),
                ...(isCustom ? { is_custom: true } : { tier: parseInt(selectedPriceTier?.id), is_custom: false }),
            })
            .then((res) => {
                const { order_uuid } = res?.data || {};
                Taro.getSetting({
                    success: (res) => {
                        console.log(res, 'res')
                    }
                })
                Taro.requestSubscribeMessage({
                    tmplIds: ["KoXRoTjwgniOQfSF9WN7h-hT_mw-AYRDhwyG_9cMTgI"], // 最多3个
                    entityIds: [order_uuid], // 添加必需的 entityIds 参数
                    complete: () => {
                        Taro.reLaunch({
                            url: `${pageUrls.orderDetail}?orderId=${order_uuid}&from=result`,
                        });

                    },
                    success: () => {
                        Taro.reLaunch({
                            url: `${pageUrls.orderDetail}?orderId=${order_uuid}&from=result`,
                        })
                    },
                    fail: () => Taro.reLaunch({
                        url: `${pageUrls.orderDetail}?orderId=${order_uuid}&from=result`,
                    })
                });
            });
    };

    const handleSelect = (tier: PriceTier) => {
        setSelectedPriceTier(tier);
    }

    return (
        <View
            className={`budget-dialog-overlay ${visible ? "visible" : ""}`}
            onClick={onClose}
            style={{ height: `calc(100vh - ${keyboardHeight}px)` }}
        >
            <View className="budget-dialog" onClick={(e) => e.stopPropagation()}>

                <View className="budget-dialog-header-container">

                    {/* 标题区域 */}
                    <View className="budget-dialog-header">
                        {/* 商品图片 */}
                        {productImage && (
                            <View className="budget-dialog-product-image">
                                <Image
                                    className="budget-dialog-image-tier"
                                    src={productImage}
                                    mode="widthFix"
                                />
                            </View>
                        )}
                        <View className="budget-dialog-title-section">
                            <View className="budget-dialog-title-group">
                                <View className="budget-dialog-main-title-Tier">{title}</View>
                            </View>
                            <View className="budget-dialog-subtitle">
                                设计编号：{designNumber}
                            </View>
                        </View>
                    </View>
                    <View className="budget-dialog-header-close" onClick={onClose}>
                        <Image src={closeFillIcon} mode="aspectFit" style={{ width: "24px", height: "24px" }} />
                    </View>
                </View>

                {/* 主要内容区域 */}
                <View className="budget-dialog-content-grading">
                    <PriceTierSelector tiers={priceTiers} onSelect={handleSelect} selectedTierId={selectedPriceTier?.id} />
                    <View className="budget-dialog-quality-compare-divider">
                        <View className="budget-dialog-quality-compare-left-line"></View>
                        <Image src={qualityCompareIcon} mode="aspectFit" style={{ width: "14px", height: "15px" }} />
                        <View className="budget-dialog-quality-compare-text">品质对比</View>
                        <View className="budget-dialog-quality-compare-right-line"></View>
                    </View>
                    <QualityComparisonTable qualityFactors={qualityFactors} currentLevel={2} />
                </View>

                {/* 确认按钮 */}
                <View className="budget-dialog-button-wrapper" style={{ marginTop: "28px" }}>
                    <View className="budget-dialog-button-link-up" onClick={() => handleConfirm(true)}>
                        <Text className="budget-dialog-button-link-text">决定不了？去找客服</Text>
                        <Text className="budget-dialog-button-link-icon">{" >"}</Text>
                    </View>
                    <View className="budget-dialog-button-wrapper-inner">
                        <CrystalButton
                            onClick={() => handleConfirm(false)}
                            text="支付定金 ¥0"
                            icon={
                                selectedPriceTier?.price && (<View className="budget-dialog-deposit-predict">
                                    <Text className="budget-dialog-button-icon-text">{`¥${(selectedPriceTier?.price * 0.1).toFixed(1)}`}</Text>
                                </View>)
                            }
                            isPrimary
                            style={{ width: "100%", height: "46px", gap: "4px", alignItems: "flex-end", lineHeight: 1, fontSize: "15px", padding: "12px 24px 14px" }}
                            textStyle={{ letterSpacing: 4 }}
                        />
                        <View className="budget-dialog-deposit-tag">
                            限时定金减免
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default BudgetDialog;
