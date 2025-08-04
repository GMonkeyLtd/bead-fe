import React from "react";
import { Text, View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import rightArrowIcon from "@/assets/icons/right-arrow.svg";
import Taro from "@tarojs/taro";
import addressLine from "@/assets/icons/order-address-line.png";

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
}

const LogisticsCard: React.FC<LogisticsCardProps> = ({
    address,
    onAdressChange
}) => {

    console.log(address, 'address')

    const onSelectAddress = () => {
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
                <Image src={rightArrowIcon} className={styles.rightArrowIcon} />
            </View>
            <View className={styles.addressLineContainer} />
        </View>
    );
};

export default LogisticsCard;
