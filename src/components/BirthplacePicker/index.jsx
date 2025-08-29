import Taro, { useState } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Area } from '@vant/weapp'
import './index.scss'

/**
 * 出生地选择组件（中国地区省市县三级联动）
 * @param {Object} props - 组件属性
 * @param {Array} props.value - 当前选中的地区 ['省', '市', '县']
 * @param {Function} props.onChange - 选择变化回调函数
 * @param {string} props.label - 标签文本，默认'出生地'
 */
const BirthplacePicker = (props) => {
  const { value = [], onChange, label = '出生地' } = props
  const [showPicker, setShowPicker] = useState(false)
  const [selectedArea, setSelectedArea] = useState(value)

  // 打开选择器
  const handleOpenPicker = () => {
    setShowPicker(true)
  }

  // 关闭选择器
  const handleClosePicker = () => {
    setShowPicker(false)
  }

  // 确认选择
  const handleConfirm = (event) => {
    const { values } = event.detail
    setSelectedArea(values)
    onChange && onChange(values)
    handleClosePicker()
  }

  // 格式化显示文本
  const getDisplayText = () => {
    return selectedArea.filter(Boolean).join(' ') || '请选择'
  }

  return (
    <View className="birthplace-picker">
      <Text className="birthplace-picker__label">{label}</Text>
      <View 
        className="birthplace-picker__input" 
        onClick={handleOpenPicker}
      >
        <Text className={selectedArea.filter(Boolean).length ? '' : 'placeholder'}>
          {getDisplayText()}
        </Text>
        <View className="birthplace-picker__arrow">
          <Text className="iconfont icon-arrow-right"></Text>
        </View>
      </View>
      
      {/* 省市县选择器 */}
      <Area
        visible={showPicker}
        title="选择出生地"
        confirmButtonText="确定"
        cancelButtonText="取消"
        value={selectedArea}
        onConfirm={handleConfirm}
        onCancel={handleClosePicker}
        // 仅支持中国地区，vant的Area组件默认使用中国地区数据
      />
    </View>
  )
}

export default BirthplacePicker
