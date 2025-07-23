import { View, Video, Image } from "@tarojs/components";
import { useEffect, useRef, useState } from "react";
import "./index.scss";

interface BackgroundMediaProps {
  type: 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  type,
  imageUrl,
  videoUrl,
  className = "",
  style = {}
}) => {
  const videoRef = useRef<any>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      // 视频加载完成
      const handleLoadedData = () => {
        setIsVideoLoaded(true);
      };

      // 视频加载错误
      const handleError = () => {
        setIsVideoError(true);
        console.error('Video loading error');
      };

      const videoElement = videoRef.current;
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleError);

      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [type]);

  if (type === 'video' && videoUrl) {
    return (
      <View className={`background-media ${className}`} style={style}>
        <Video
          ref={videoRef}
          src={videoUrl}
          className="background-video"
          autoplay={true}
          loop={true}
          muted={true}
          showPlayBtn={false}
          showCenterPlayBtn={false}
          showFullscreenBtn={false}
          showProgress={false}
          objectFit="cover"
          enableProgressGesture={false}
          onError={() => setIsVideoError(true)}
        />
        {/* 视频加载时的占位背景 */}
        {!isVideoLoaded && !isVideoError && imageUrl && (
          <Image
            src={imageUrl}
            className="background-fallback"
            mode="aspectFill"
          />
        )}
        {/* 视频加载失败时的占位背景 */}
        {isVideoError && imageUrl && (
          <Image
            src={imageUrl}
            className="background-fallback"
            mode="aspectFill"
          />
        )}
      </View>
    );
  }

  if (type === 'image' && imageUrl) {
    return (
      <View className={`background-media ${className}`} style={style}>
        <Image
          src={imageUrl}
          className="background-image"
          mode="aspectFill"
        />
      </View>
    );
  }

  return null;
};

export default BackgroundMedia; 