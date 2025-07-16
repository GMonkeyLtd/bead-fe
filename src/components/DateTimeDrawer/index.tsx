import { View, Text, PickerView, PickerViewColumn } from "@tarojs/components";
import { useState, useEffect } from "react";
import { CommonEventFunction } from "@tarojs/components/types/common";
import { Lunar, LunarMonth, Solar } from "lunar-typescript";
import "./index.scss";
import CrystalButton from "../CrystalButton";

interface DateTimeDrawerProps {
  visible: boolean;
  onClose: () => void;
  personalizeButtonText?: string;
  onQuickCustomize?: (dateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: number;
    isLunar: boolean;
  }) => void;
  onPersonalizeCustomize?: (dateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: number;
    isLunar: boolean;
  }) => void;
}

const DateTimeDrawer = ({
  visible,
  onClose,
  onQuickCustomize,
  onPersonalizeCustomize,
  personalizeButtonText,
}: DateTimeDrawerProps) => {
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<number[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [gender, setGender] = useState<string>("女");
  const [dateType, setDateType] = useState<string>("公历");
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([
    0, 0, 0, 0,
  ]);

  // 农历月份名称
  const lunarMonths = [
    "正月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "冬月",
    "腊月",
  ];
  // 农历日期名称
  const lunarDays = [
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十",
  ];

  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    // 初始化年份（当前年到过去100年）
    const yearList: number[] = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      yearList.unshift(i);
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
    // 添加一个-1，表示选择未知
    hourList.unshift(-1);
    setHours(hourList);

    // 初始化当前月的日期
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayList: number[] = [];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      dayList.push(i);
    }
    setDays(dayList);

    // 计算当前时间对应的索引
    const yearIndex = yearList.findIndex((year) => year === 2000);
    const monthIndex = currentMonth - 1;
    const dayIndex = currentDay - 1;
    const hourIndex = -1;

    setSelectedIndexes([yearIndex, monthIndex, dayIndex, hourIndex]);
  }, []);

  const updateDays = (year: number, month: number) => {
    if (dateType === "公历") {
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayList: number[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        dayList.push(i);
      }
      setDays(dayList);
    } else {
      // 农历月份的天数
      const lunarMonth = LunarMonth.fromYm(year, month);
      const daysInLunarMonth = lunarMonth?.getDayCount() || 30;

      const dayList: number[] = [];
      for (let i = 1; i <= daysInLunarMonth; i++) {
        dayList.push(i);
      }
      setDays(dayList);
    }
  };

  const handlePickerChange: CommonEventFunction = (e) => {
    const { value } = e.detail;
    const newIndexes = [...value];

    const year = years[newIndexes[0]];
    const month = months[newIndexes[1]];

    if (
      newIndexes[0] !== selectedIndexes[0] ||
      newIndexes[1] !== selectedIndexes[1]
    ) {
      updateDays(year, month);

      if (newIndexes[2] >= days.length) {
        newIndexes[2] = days.length - 1;
      }
    }

    setSelectedIndexes(newIndexes);
  };

  const handleDateTypeToggle = () => {
    const newDateType = dateType === "公历" ? "农历" : "公历";
    setDateType(newDateType);

    // 在切换日期类型时转换日期
    const year = years[selectedIndexes[0]];
    const month = months[selectedIndexes[1]];
    const day = days[selectedIndexes[2]];

    if (newDateType === "农历") {
      // 从公历转农历
      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();

      const yearIndex = years.findIndex((y) => y === lunar.getYear());
      const monthIndex = lunar.getMonth();
      const dayIndex = lunar.getDay();

      setSelectedIndexes([yearIndex, monthIndex, dayIndex, selectedIndexes[3]]);
      updateDays(lunar.getYear(), lunar.getMonth());
    } else {
      // 从农历转公历
      const lunar = Lunar.fromYmd(year, month, day);
      const solar = lunar.getSolar();

      const yearIndex = years.findIndex((y) => y === solar.getYear());
      const monthIndex = solar.getMonth() - 1;
      const dayIndex = solar.getDay() - 1;

      setSelectedIndexes([yearIndex, monthIndex, dayIndex, selectedIndexes[3]]);
      updateDays(solar.getYear(), solar.getMonth());
    }
  };

  const handleGenderToggle = () => {
    setGender(gender === "男" ? "女" : "男");
  };

  const getTransformedData = () => {
    const year = years[selectedIndexes[0]];
    const month = months[selectedIndexes[1]];
    const day = days[selectedIndexes[2]];
    console.log(year, month, day, dateType, 'year, month, day')
    return {
      year: year,
      month: month,
      day: day,
      hour: hours[selectedIndexes[3]] === -1 ? 0 : hours[selectedIndexes[3]],
      gender: gender === "男" ? 1 : 0,
      isLunar: dateType === "农历",
    };
  };

  const handleQuickCustomize = () => {
    const selectedDateTime = getTransformedData();
    onQuickCustomize?.(selectedDateTime);
  };

  const handlePersonalizeCustomize = () => {
    const selectedDateTime = getTransformedData();
    onPersonalizeCustomize?.(selectedDateTime);
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
            <View
              className={`gender-switch ${
                gender === "男" ? "male-selected" : "female-selected"
              }`}
              onClick={handleGenderToggle}
            >
              <View
                className={`gender-option ${gender === "女" ? "selected" : ""}`}
              >
                <Text
                  className={`gender-text ${gender === "女" ? "selected" : ""}`}
                >
                  女生
                </Text>
              </View>
              <View
                className={`gender-option ${gender === "男" ? "selected" : ""}`}
              >
                <Text
                  className={`gender-text ${gender === "男" ? "selected" : ""}`}
                >
                  男生
                </Text>
              </View>
              <View className="gender-slider"></View>
            </View>
          </View>
        </View>
        <View className="gender-container">
          <View className="gender-title">选择出生日期</View>
          <View className="gender-switch-container">
            <View
              className={`gender-switch ${
                dateType === "公历" ? "female-selected" : "male-selected"
              }`}
              onClick={handleDateTypeToggle}
            >
              <View
                className={`gender-option ${
                  dateType === "公历" ? "selected" : ""
                }`}
              >
                <Text
                  className={`gender-text ${
                    dateType === "公历" ? "selected" : ""
                  }`}
                >
                  公历
                </Text>
              </View>
              <View
                className={`gender-option ${
                  dateType === "农历" ? "selected" : ""
                }`}
              >
                <Text
                  className={`gender-text ${
                    dateType === "农历" ? "selected" : ""
                  }`}
                >
                  农历
                </Text>
              </View>
              <View className="gender-slider"></View>
            </View>
          </View>
        </View>
        <View className="picker-container">
          <PickerView
            className="datetime-picker"
            // style={{ backgroundColor: 'red' }}
            indicatorStyle="height: 40px; border-top: 1px solid rgb(245, 230, 220); border-bottom: 1px solid rgb(246, 230, 220);"
            indicatorClass="picker-indicator"
            value={selectedIndexes}
            onChange={handlePickerChange}
          >
            <PickerViewColumn>
              {years.map((year) => (
                <View key={year} className="picker-item">
                  {year}年
                </View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {months.map((month, index) => (
                <View key={month} className="picker-item">
                  {dateType === "农历" ? lunarMonths[index] : `${month}月`}
                </View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {days.map((day, index) => (
                <View key={day} className="picker-item">
                  {dateType === "农历" ? lunarDays[index] : `${day}日`}
                </View>
              ))}
            </PickerViewColumn>
            <PickerViewColumn>
              {hours.map((hour) => (
                <View key={hour} className="picker-item">
                  {hour === -1 ? "未知" : `${hour}时`}
                </View>
              ))}
            </PickerViewColumn>
          </PickerView>
        </View>
        <View className="button-container">
          <View className="button-row">
            <CrystalButton
              isPrimary
              onClick={handlePersonalizeCustomize}
              text={personalizeButtonText || "下一步"}
              style={{ width: "200px" }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default DateTimeDrawer;
