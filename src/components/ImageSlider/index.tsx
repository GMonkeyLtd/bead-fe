import React, { useState } from 'react'
import Taro from '@tarojs/taro'
import { Swiper, SwiperItem, Image, View } from '@tarojs/components'
import './index.scss'

interface ImageSliderProps {
  images: string[]
  width?: number
  height?: number
  gap?: number
  borderRadius?: number
  showGradientMask?: boolean
  showIndicator?: boolean
  autoplay?: boolean
  circular?: boolean
  onImageClick?: (image: string, index: number) => void
  showImageCount?: boolean
  containerWidth?: number // 容器宽度
  visibleCount?: number // 同时显示的图片数量
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images = [],
  width = 80,
  height = 80,
  gap = 8,
  borderRadius = 10,
  showGradientMask = true,
  showIndicator = false,
  autoplay = false,
  circular = true,
  onImageClick,
  showImageCount = false,
  containerWidth = 4 * 80 + 3 * 8, // 默认容器宽度
  visibleCount = 4 // 默认显示4张图片
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // 计算每个item的宽度，确保能显示指定数量的图片
  const itemWidth = (containerWidth - (gap * (visibleCount - 1))) / visibleCount

  // 处理图片点击
  const handleImageClick = (image: string, index: number) => {
    onImageClick?.(image, index)
  }

  // 处理滑动变化
  const handleSwiperChange = (e: any) => {
    setCurrentIndex(e.detail.current)
  }

  return (
    <View 
      className="image-slider-container"
      style={{
        width: `${containerWidth}px`,
        height: `${height}px`
      }}
    >
      <Swiper
        className="image-slider"
        style={{
          height: `${height}px`
        }}
        indicatorDots={showIndicator}
        indicatorColor="rgba(0, 0, 0, 0.3)"
        indicatorActiveColor="#000"
        autoplay={autoplay}
        circular={circular}
        skipHiddenItemLayout={true}
        onChange={handleSwiperChange}
        displayMultipleItems={visibleCount}
      >
        {images.map((image, index) => (
          <SwiperItem 
            key={index} 
            className="image-slider-item"
          >
            <View 
              className="image-container"
              onClick={() => handleImageClick(image, index)}
              style={{
                marginRight: index < images.length - 1 ? `${gap}px` : '0'
              }}
            >
              <Image
                src={image}
                className="image-slider-img"
                mode="aspectFill"
                style={{
                  width: `${itemWidth}px`,
                  height: `${height}px`,
                  borderRadius: `${borderRadius}px`
                }}
                onClick={() => {
                  Taro.previewImage({
                    urls: images,
                    current: image,
                  })
                }}
              />
            </View>
          </SwiperItem>
        ))}
      </Swiper>
      
      {/* 图片计数显示 */}
      {showImageCount && images.length > visibleCount && (
        <View className="image-count">
          {currentIndex + 1} / {images.length}
        </View>
      )}
      
      {/* {showGradientMask && (
        <View 
          className="gradient-mask"
          style={{
            height: `${height}px`
          }}
        />
      )} */}
    </View>
  )
}

export default ImageSlider 