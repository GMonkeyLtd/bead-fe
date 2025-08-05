import React from "react";
import { Text, View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import rightArrowIcon from "@/assets/icons/right-arrow.svg";
import Taro from "@tarojs/taro";
import addressLine from "@/assets/icons/order-address-line.png";
import logisticsIcon from "@/assets/icons/logistics.svg";

export interface AddressInfo {
    cityName: string;
    countyName: string;
    detailInfo: string;
    nationalCode: string;
    postalCode: string;
    provinceName: string;
    telNumber: string;
    userName: string;
}

interface LogisticsCardProps {
    address?: AddressInfo;
    onAdressChange?: (address: AddressInfo) => void;
    enableChangeAddress?: boolean;
    logisticsStatus?: number;
    onViewLogistics?: () => void;
}

const LogisticsCard: React.FC<LogisticsCardProps> = ({
    address,
    onAdressChange,
    logisticsStatus,
    enableChangeAddress = true,
    onViewLogistics,
}) => {

    console.log(address, 'address')
    const transformLogisticsStatus = (status: number) => {
        switch (status) {
            case 0:
                return '等待快递小哥揽收';
            case 1:
                return '已揽件';
            case 2:
                return '运输中';
            case 3:
                return '派件中';
            case 4:
                return '已签收';
            case 5:
                return '异常';
            case 6:
                return '代签收';
            default:
                return '未知状态';
        }
    }

    const onSelectAddress = () => {
        if (!enableChangeAddress) return;
        Taro.chooseAddress({
            success: (result) => {
                onAdressChange?.(result);
            }
        });
    };

    const renderReceiverInfo = () => {
        if (!address) return (
            <View className={styles.addressPlaceholder}>
                请添加收货地址
            </View>
        );
        return (
            <View className={styles.receiverInfo}>
                {logisticsStatus !== undefined && (<View className={styles.logisticsStatus} onClick={onViewLogistics}>
                    <View className={styles.logisticsStatusContent}>
                        <Image src={logisticsIcon} className={styles.logisticsIcon} />
                        <Text className={styles.logisticsStatusText}>{transformLogisticsStatus(logisticsStatus)}</Text>
                    </View>
                    <Image src={rightArrowIcon} className={styles.rightArrowIcon} />
                </View>)}
                {logisticsStatus !== undefined && (<View className={styles.logisticsStatusDivider} />)}
                <View className={styles.addressInfo}>
                    <Text className={styles.regionText}>
                        {address.provinceName}{address.cityName}{address.countyName}
                    </Text>
                    <Text className={styles.detailAddressText}>
                        {address.detailInfo}
                    </Text>
                </View>
                <View className={styles.contactInfo}>
                    <Text className={styles.receiverName}>{address.userName}</Text>
                    <Text className={styles.phoneNumber}>
                        {address.telNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className={styles.logisticsCard} onClick={onSelectAddress}>
            <View className={styles.addressContent}>
                {renderReceiverInfo()}
                {enableChangeAddress && <Image src={rightArrowIcon} className={styles.rightArrowIcon} />}
            </View>
            <View className={styles.addressLineContainer} />
        </View>
    );
};

export default LogisticsCard;
