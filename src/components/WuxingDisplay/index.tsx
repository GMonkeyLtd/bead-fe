import React from "react";
import "./index.scss";
import jinSvg from "@/assets/xuxing-icons/jin.svg";
import huoSvg from "@/assets/xuxing-icons/huo.svg";
import shuiSvg from "@/assets/xuxing-icons/shui.svg";
import tuSvg from "@/assets/xuxing-icons/tu.svg";
import muSvg from "@/assets/xuxing-icons/mu.svg";
import { Image } from "@tarojs/components";

export interface WuxingElement {
  type: "金" | "火" | "水" | "土" | "木";
  description: string;
  strength?: "身强型" | "身弱型";
  preferences?: string[];
}

interface WuxingDisplayProps {
  element: WuxingElement;
  className?: string;
}

const WuxingDisplay: React.FC<WuxingDisplayProps> = ({
  element,
  className = "",
}) => {
  const getElementConfig = (type: string) => {
    const configs = {
      金: {
        textColor: "#662900",
        iconUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/jin-icon.png',
        bgUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/jin-bg.png'
        
      },
      火: {
        textColor: "#930002",
        iconUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/huo-icon.png',
        bgUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/huo-bg.png'
      },
      水: {
        textColor: "#007193",
        iconUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/shui-icon.png',
        bgUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/shui-bg.png'
      },
      土: {
        textColor: "#7F6340",
        iconUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/tu-icon.png',
        bgUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/tu-bg.png'
      },
      木: {
        textColor: "#609349",
        iconUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/mu-icon.png',
        bgUrl: 'https://zljcdn.gmonkey.top/images-frontend/wu-xing/mu-bg.png'
      },
    };
    return configs[type as keyof typeof configs] || configs.金;
  };

  const config = getElementConfig(element.type);

  return (
    <view
      className="wuxing-card"
      style={{
        background: `url(${config.bgUrl})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <view className="card-content-right">
        <Image className="wuxing-icon" src={config.iconUrl} />
        <view className="wuxing-text" style={{ color: config.textColor }}>
          日<br />主<br />为<br />
          {element.type}
        </view>
      </view>
      <view className="wuxing-description" style={{ color: config.textColor }}>
        {element.description}
      </view>
    </view>
  );
};

export default WuxingDisplay;
