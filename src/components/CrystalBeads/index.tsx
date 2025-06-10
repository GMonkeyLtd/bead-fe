import { View } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface CrystalBead {
  id: number
  color: string
  name: string
  x: number
  y: number
  isActive: boolean
}

const CrystalBeads = () => {
  // 定义十种不同颜色的水晶
  const crystalColors = [
    { color: '#FF6B6B', name: '红水晶' },
    { color: '#4ECDC4', name: '青水晶' },
    { color: '#45B7D1', name: '蓝水晶' },
    { color: '#96CEB4', name: '绿水晶' },
    { color: '#FFEAA7', name: '黄水晶' },
    { color: '#DDA0DD', name: '紫水晶' },
    { color: '#FFB347', name: '橙水晶' },
    { color: '#FFB6C1', name: '粉水晶' },
    { color: '#98FB98', name: '翡翠' },
    { color: '#F0E68C', name: '金水晶' }
  ]

  const [beads, setBeads] = useState<CrystalBead[]>([])
  const [containerWidth, setContainerWidth] = useState(450)
  const [containerHeight, setContainerHeight] = useState(100) // 增加高度以更好居中
  const beadSize = 30
  const beadSpacing = 60 // 水晶珠之间的间距

  // 初始化水晶珠
  useEffect(() => {
    // 精确计算垂直居中位置，考虑边框等因素
    const centerY = (containerHeight - beadSize) / 2
    const initialBeads: CrystalBead[] = crystalColors.map((crystal, index) => ({
      id: index,
      color: crystal.color,
      name: crystal.name,
      x: -50 - (index * beadSpacing), // 按间距排列，从左侧外部开始
      y: centerY, // 精确居中
      isActive: false
    }))
    setBeads(initialBeads)
  }, [containerHeight, beadSpacing, beadSize])

  // 动画循环
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setBeads(prevBeads => 
        prevBeads.map(bead => {
          let newX = bead.x + 1.5 // 移动速度
          
          // 如果超出右边界，从左边界外重新开始
          if (newX > containerWidth + 50) {
            newX = -50 // 直接从左边界外重新开始
          }
          
          // 计算圆弧形轨迹的Y位置
          // 使用正弦函数创建波浪形轨迹
          const centerY = (containerHeight - beadSize) / 2
          const amplitude = 20 // 圆弧的振幅
          const frequency = 0.01 // 频率，控制圆弧的密度
          const arcY = centerY + Math.sin(newX * frequency) * amplitude
          
          return { ...bead, x: newX, y: arcY }
        })
      )
    }, 50) // 50ms刷新一次，创造流畅动画

    return () => clearInterval(animationInterval)
  }, [containerWidth, containerHeight, beadSize, beadSpacing])

  // 处理水晶珠点击
  const handleBeadTouch = (beadId: number) => {
    setBeads(prevBeads =>
      prevBeads.map(bead =>
        bead.id === beadId ? { ...bead, isActive: true } : bead
      )
    )

    // 2秒后取消激活状态
    setTimeout(() => {
      setBeads(prevBeads =>
        prevBeads.map(bead =>
          bead.id === beadId ? { ...bead, isActive: false } : bead
        )
      )
    }, 2000)
  }

  return (
    <View className="crystal-beads-container">
      <View className="animation-area" 
            style={{ 
              width: `${containerWidth}px`, 
              height: `${containerHeight}px` 
            }}>
        {beads.map(bead => (
          <View
            key={bead.id}
            className={`crystal-bead ${bead.isActive ? 'active' : ''}`}
            style={{
              left: `${bead.x}px`,
              top: `${bead.y}px`,
              backgroundColor: bead.color,
              transform: bead.isActive ? 'scale(1.2)' : 'scale(1)',
              border: bead.isActive ? '3px solid #000' : '3px solid transparent'
            }}
            onClick={() => handleBeadTouch(bead.id)}
          >
            <View className="bead-glow" style={{ backgroundColor: bead.color }} />
          </View>
        ))}
      </View>
      
      <View className="crystal-info">
        <View className="title">✨ 水晶能量珠 ✨</View>
        <View className="subtitle">点击水晶珠感受它们的能量</View>
      </View>
    </View>
  )
}

export default CrystalBeads 