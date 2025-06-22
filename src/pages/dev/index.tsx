import PosterGenerator from "@/components/PosterGenerator";
import { QR_CODE_IMAGE_URL } from "@/config";
import { View, Text, Image } from "@tarojs/components";
import { useState } from "react";
import Taro from "@tarojs/taro";

const Dev = () => {
  const [posterData, setPosterData] = useState({
    title: "四季福缘",
    description: "这款四季福缘手串精选绿东陵与黄水晶为主珠，配以白水晶与海蓝宝，象征春夏秋冬四季轮回。绿东陵带来生机与财运，黄水晶招财聚福，白水晶净化心灵，海蓝宝守护平安。佩戴此串，四季平安，福缘深厚。",
    mainImage:
      "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
    crystals: [
      {
        "color": "绿色",
        "english": "Green Aventurine",
        "function": "招财旺运",
        "id": "59",
        "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%BB%BF%E4%B8%9C%E9%99%B5.png",
        "name": "绿东陵",
        "wuxing": "木"
      },
      {
        "color": "浅黄色",
        "english": "Citrine",
        "function": "聚财纳福",
        "id": "38",
        "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%84%E6%B0%B4%E6%99%B6.png",
        "name": "黄水晶",
        "wuxing": "土"
      }
    ],
    qrCode: QR_CODE_IMAGE_URL,
  });

  const [posterImageUrl, setPosterImageUrl] = useState('');

  const handleGenerated = (tempFilePath: string) => {
    console.log(tempFilePath, 'tempFilePath')
    setPosterImageUrl(tempFilePath);
  }

  const handleSave = () => {
    Taro.saveImageToPhotosAlbum({
      filePath: posterImageUrl,
      success: () => {
        Taro.showToast({ title: '保存成功' });
      },
    });
  }

  return (
    <View style={{ width: '100vw', height: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: '50px', paddingBottom: '50px' }}>
      <PosterGenerator data={posterData} onGenerated={handleGenerated} />
      {/* {posterImageUrl && <Image src={posterImageUrl} />} */}
      <View onClick={handleSave}>
        保存
      </View>
    </View>
  );
};

export default Dev;
