import React from "react";
import { View } from "@tarojs/components";
import QRCodeScanner from "./QRCodeScanner";

const QRCodeScannerDemo: React.FC = () => {
  // 示例二维码URL
  const qrCodeUrl = "https://example.com/qrcode.png";
  
  return (
    <View>
      <QRCodeScanner 
        qrCodeUrl={qrCodeUrl}
        title="加入群聊"
        description="长按或点击二维码识别，加入我们的交流群"
      />
    </View>
  );
};

export default QRCodeScannerDemo; 