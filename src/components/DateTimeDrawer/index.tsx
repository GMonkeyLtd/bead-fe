import { View, Text, PickerView, PickerViewColumn } from "@tarojs/components";
import { useState, useEffect } from "react";
import { CommonEventFunction } from "@tarojs/components/types/common";
import "./index.scss";
import CrystalButton from "../CrystalButton";

interface DateTimeDrawerProps {
  visible: boolean;
  onClose: () => void;
  onQuickCustomize?: (dateTime: { year: number; month: number; day: number; hour: number; gender: string }) => void;
  onPersonalizeCustomize?: (dateTime: { year: number; month: number; day: number; hour: number; gender: string }) => void;
}

const DateTimeDrawer = ({ visible, onClose, onQuickCustomize, onPersonalizeCustomize }: DateTimeDrawerProps) => {
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<number[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [gender, setGender] = useState<string>('女');
  
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() 返回 0-11，需要 +1
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    // 初始化年份（当前年到过去100年）
    const yearList: number[] = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      yearList.push(i);
    }
    setYears(yearList);

    // 初始化月份
    const monthList: number[] = [];
    for (let i = 1; i <= 12; i++) {
      monthList.push(i);
    }
    setMonths(monthList);

    // 初始化小时
    const hourList: number[] = [];
    for (let i = 0; i < 24; i++) {
      hourList.push(i);
    }
    setHours(hourList);

    // 初始化当前月的日期
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayList: number[] = [];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      dayList.push(i);
    }
    setDays(dayList);

    // 计算当前时间对应的索引
    const yearIndex = yearList.findIndex(year => year === 2000); // 当前年份在数组第一位
    const monthIndex = currentMonth - 1; // 月份数组从1开始，索引需要-1
    const dayIndex = currentDay - 1; // 日期数组从1开始，索引需要-1
    const hourIndex = currentHour; // 小时数组从0开始，索引就是小时值

    // 设置初始选中的索引为当前时间
    setSelectedIndexes([yearIndex, monthIndex, dayIndex, hourIndex]);
  }, []);

  const updateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
      const dayList: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      dayList.push(i);
    }
    setDays(dayList);
  };

  const handlePickerChange: CommonEventFunction = (e) => {
    const { value } = e.detail;
    const newIndexes = [...value];
    
    // 检查年份或月份是否改变
    if (newIndexes[0] !== selectedIndexes[0] || newIndexes[1] !== selectedIndexes[1]) {
      const year = years[newIndexes[0]];
      const month = months[newIndexes[1]];

      // 先计算新月份的天数
      const daysInMonth = new Date(year, month, 0).getDate();
      const newDayList: number[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        newDayList.push(i);
      }
      
      // 如果当前选择的日期超出了新月份的天数，重置为最后一天
      if (newIndexes[2] >= daysInMonth) {
        newIndexes[2] = daysInMonth - 1;
      }
      
      // 更新日期列表
      setDays(newDayList);
    }
    
    setSelectedIndexes(newIndexes);
  };

  
  const handleQuickCustomize = () => {
    const selectedDateTime = {
      year: years[selectedIndexes[0]],
      month: months[selectedIndexes[1]],
      day: days[selectedIndexes[2]],
      hour: hours[selectedIndexes[3]],
      gender: gender === '男' ? 1 : 0
    };
    onQuickCustomize?.(selectedDateTime);
    // onClose();

  };

  const handlePersonalizeCustomize = () => {
    const selectedDateTime = {
      year: years[selectedIndexes[0]],
      month: months[selectedIndexes[1]],
      day: days[selectedIndexes[2]],
      hour: hours[selectedIndexes[3]],
      gender: gender
    };
    onPersonalizeCustomize?.(selectedDateTime);
    // onClose();

  };

  const handleGenderToggle = () => {
    setGender(gender === '男' ? '女' : '男');
  };

  if (!visible) return null;

  return (
    <View className="datetime-drawer-mask" onClick={onClose}>
      <View className="datetime-drawer" onClick={(e) => e.stopPropagation()}>
        <View className="drawer-header">
          <Text className="drawer-title">基本信息</Text>
        </View>
        <View className="gender-container">
          <View className="gender-title">性别</View>
          <View className="gender-switch-container">
            <View className={`gender-switch ${gender === '男' ? 'male-selected' : 'female-selected'}`} onClick={handleGenderToggle}>
              <View className={`gender-option ${gender === '女' ? 'selected' : ''}`}>
                <Text className={`gender-text ${gender === '女' ? 'selected' : ''}`}>女生</Text>
              </View>
              <View className={`gender-option ${gender === '男' ? 'selected' : ''}`}>
                <Text className={`gender-text ${gender === '男' ? 'selected' : ''}`}>男生</Text>
              </View>
              <View className="gender-slider"></View>
            </View>
          </View>
        </View>
        <View className="picker-container">
          <View className="picker-title">选择出生日期 「公历」</View>
          <PickerView 
            className="datetime-picker"
            indicatorStyle="height: 40px; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;"
            indicatorClass="picker-indicator"
            // maskStyle="height: 10px;"
            // maskClass="picker-mask"
            value={selectedIndexes}
            onChange={handlePickerChange}
          >
            <PickerViewColumn>
              {years.map((year) => (
                <View key={year} className="picker-item">{year}</View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {months.map((month) => (
                <View key={month} className="picker-item">{month}</View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {days.map((day) => (
                <View key={day} className="picker-item">{day}</View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {hours.map((hour) => (
                <View key={hour} className="picker-item">{hour}</View>
              ))}
            </PickerViewColumn>
          </PickerView>
        </View>
        <View className="button-container">
          <View className="button-row">
            <CrystalButton onClick={handleQuickCustomize} text="一键定制" />
            <CrystalButton onClick={handlePersonalizeCustomize} text="下一步" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default DateTimeDrawer; 