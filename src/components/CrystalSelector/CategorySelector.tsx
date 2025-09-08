import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import './styles/CategorySelector.scss';
import crystalIcon from "@/assets/icons/crystal.svg";
import crystalActiveIcon from "@/assets/icons/crystal-active.svg";
import accessoryIcon from "@/assets/icons/accessory.svg";
import accessoryActiveIcon from "@/assets/icons/accessory-active.svg";

export interface CrystalCategory {
  id: string;
  name: string;
  icon?: string;
  iconComponent?: React.ReactNode;
}

interface CrystalCategorySelectorProps {
  categories?: CrystalCategory[];
  selectedCategory?: string;
  onCategoryChange?: (categoryKey: string) => void;
  className?: string;
}

const CrystalCategorySelector: React.FC<CrystalCategorySelectorProps> = ({
  categories = [
    { id: 'crystal', name: '水晶', icon: crystalIcon, activeIcon: crystalActiveIcon },
    { id: 'accessories', name: '配饰', icon: accessoryIcon, activeIcon: accessoryActiveIcon },
  ],
  selectedCategory = 'crystal',
  onCategoryChange,
  className = ''
}) => {
  const [selected, setSelected] = useState(selectedCategory);

  const handleCategoryClick = (categoryId: string) => {
    setSelected(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <View className={`crystal-category-selector ${className}`}>
      {categories.map((category, index) => (
        <View
          key={category.id}
          className={`category-item ${selected === category.id ? 'selected' : ''} ${index === 0 ? 'first' : ''} ${index === categories.length - 1 ? 'last' : ''}`}
          onClick={() => handleCategoryClick(category.id)}
        >
          <View className="category-icon">
            {category.icon && <Image src={selected === category.id ? category.activeIcon :  category.icon} style={{ width: '20px', height: '20px' }} />}
          </View>
          <Text className="category-name">{category.name}</Text>
        </View>
      ))}
    </View>
  );
};

export default CrystalCategorySelector;
