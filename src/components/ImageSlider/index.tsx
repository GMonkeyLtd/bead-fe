import React from 'react'
import { Swiper, SwiperItem, Image, View } from '@tarojs/components'
import './index.scss'

interface ImageSliderProps {
  images: string[]
  width?: number
  height?: number
  gap?: number
  borderRadius?: number
  showGradientMask?: boolean
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images = [],
  width = 80,
  height = 80,
  gap = 8,
  borderRadius = 10,
  showGradientMask = true
}) => {
  return (
    <View className="image-slider-container">
      <Swiper
        className="image-slider"
        displayMultipleItems={4}
        style={{
          height: `${height}px`
        }}
      >
        {images.map((image, index) => (
          <SwiperItem key={index} className="image-slider-item">
            <Image
              src={image}
              className="image-slider-img"
              mode="aspectFill"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: `${borderRadius}px`
              }}
            />
          </SwiperItem>
        ))}
      </Swiper>
      
      {showGradientMask && (
        <View 
          className="gradient-mask"
          style={{
            height: `${height}px`
          }}
        />
      )}
    </View>
  )
}

export default ImageSlider 