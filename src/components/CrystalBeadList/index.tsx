import React from "react";
import { View, Text, ScrollView, Picker, Input } from "@tarojs/components";
import { BeadItem } from "@/utils/api-session";
import styles from "./index.module.scss";
import { BeadItemWithCount } from "../ProductPriceForm";

export interface CrystalBeadListItem {
  spuId: number;
  items: BeadItem[];
  name: string;
}

interface CrystalBeadListProps {
  data: BeadItemWithCount[];
  spuList: CrystalBeadListItem[];
  onChange?: (data: BeadItemWithCount[]) => void;
}

const CrystalBeadList: React.FC<CrystalBeadListProps> = ({
  data,
  spuList,
  onChange
}) => {

  // 获取珠子名称选项（从现有数据中提取去重）
  const getNameOptions = () => {
    const names = new Set<string>();
    spuList.forEach(item => {
      if (item.name) names.add(item.name);
    });
    return Array.from(names).map(name => ({ label: name, value: name }));
  };

  // 获取直径选项（常见的珠子直径）
  const getDiameterOptions = (items: BeadItem[]) => {
    const diameters = items.map(item => item.diameter);
    return diameters.sort((a, b) => a - b).map(d => ({ label: `${d}mm`, value: d }));
  };

  // 处理名称变化
  const handleNameChange = (bead: BeadItemWithCount, nameIndex: number) => {
    const nameOptions = getNameOptions();
    if (nameOptions[nameIndex]) {
      const newName = nameOptions[nameIndex].value as string;
      const spu = spuList.find(item => item.name === newName);
      if (spu) {
        const newBead = spu.items.find(item => item.diameter === bead.diameter);
        if (newBead) {
          const newData = data.map(item => {
            if (item.sku_id === bead.sku_id) {
              return { ...item, ...newBead };
            }
            return item;
          });
          onChange?.(newData);
        }
      }
    }
  };

  // 处理直径变化
  const handleDiameterChange = (bead: BeadItemWithCount, diameterIndex: number) => {
    const diameterOptions = getDiameterOptions(spuList.find(item => item.spuId == bead.spu_id)?.items || []);
    if (diameterOptions[diameterIndex]) {
      const newDiameter = diameterOptions[diameterIndex].value;
      const spu = spuList.find(item => item.spuId === bead.spu_id);
      if (spu) {
        const newBead = spu.items.find(item => item.diameter === newDiameter);
        if (newBead) {
          const newData = data.map(item => {
            if (item.sku_id === bead.sku_id) {
              return { ...item, ...newBead };
            }
            return item;
          });
          onChange?.(newData);
        }
      }
    }
  };

  // 获取名称在选项中的索引
  const getNameIndex = (name: string) => {
    const nameOptions = getNameOptions();
    const index = nameOptions.findIndex(option => option.value === name);
    return index >= 0 ? index : 0;
  };

  // 处理数量输入变化
  const handleQuantityInput = (skuId: number, value: string) => {
    // 只允许输入数字
    console.log(value, typeof value, 'value')
    if (value !== '') {
      const numericValue = value.replace(/[^\d]/g, "");
      const quantity = parseInt(numericValue) || 0;
      console.log(quantity, 'quantity')
      handleEditConfirm(skuId, 'quantity', quantity);
    }
  };

  // 确认编辑
  const handleEditConfirm = (skuId: number, type: 'name' | 'diameter' | 'quantity', value: string | number) => {
    const newData = data.map(item => {
      if (item.sku_id === skuId) {
        const updatedItem = { ...item };

        switch (type) {
          case 'name':
            updatedItem.name = value as string;
            break;
          case 'diameter':
            updatedItem.diameter = value as number;
            break;
          case 'quantity':
            updatedItem.count = value as number;
            break;
        }

        return updatedItem;
      }
      return item;
    });

    onChange?.(newData);
  };

  // 删除行
  const handleDeleteItem = (skuId: number) => {
    const newData = data.filter(item => item.sku_id !== skuId);
    onChange?.(newData);
  };

  // 添加新珠子
  const handleAddNewBead = () => {
    const newBead: BeadItemWithCount = {
      ...spuList[0].items[0],
      count: 1,
    };
    newBead.count = 1;

    const newData = [...data, newBead];
    onChange?.(newData);
  };

  return (
    <View className={styles.container}>
      {/* 表头 */}
      <View className={styles.tableHeader}>
        <View className={styles.nameColumn}>
          <Text className={styles.headerText}>名称</Text>
        </View>
        <View className={styles.diameterColumn}>
          <Text className={styles.headerText}>直径</Text>
        </View>
        <View className={styles.quantityColumn}>
          <Text className={styles.headerText}>数量</Text>
        </View>
        <View className={styles.deleteColumn}>
          <Text className={styles.headerText}>操作</Text>
        </View>
      </View>

      <ScrollView
        className={styles.listContainer}
        scrollY
        showScrollbar={false}
      >
        {data.map((bead: BeadItemWithCount) => {
          return (
            <View key={bead.sku_id} className={styles.tableRow}>
              <View className={styles.nameColumn}>
                <Picker
                  style={{
                    width: '100%',
                  }}
                  mode="selector"
                  range={getNameOptions().map(option => option.label)}
                  value={getNameIndex(bead.name)}
                  onChange={(e) => handleNameChange(bead, e.detail.value as number)}
                >
                  <View className={styles.pickerContainer}>
                    <View className={styles.cellValue}>
                      {bead.name || '未设置'}
                    </View>
                    <View className={styles.pickerArrow}>▼</View>
                  </View>
                </Picker>
              </View>

              <View className={styles.diameterColumn}>
                {(() => {
                  const diameterOptions = getDiameterOptions(spuList.find(item => item.spuId == bead.spu_id)?.items || []);
                  const diameterIndex = diameterOptions.findIndex(option => option.value === bead.diameter);
                  return (
                    <Picker
                      mode="selector"
                      range={diameterOptions.map(option => option.label)}
                      value={diameterIndex >= 0 ? diameterIndex : 0}
                      onChange={(e) => handleDiameterChange(bead, e.detail.value as number)}
                    >
                      <View className={styles.pickerContainer}>
                        <View className={styles.cellValue}>
                          {bead.diameter > 0 ? `${bead.diameter}` : '未设置'}
                        </View>
                        <Text className={styles.pickerArrow}>▼</Text>
                      </View>
                    </Picker>
                  );
                })()}
              </View>

              <View className={styles.quantityColumn}>
                <Input
                  className={styles.quantityInput}
                  type="number"
                  defaultValue={bead.count?.toString() || '0'}
                  onInput={(e) => handleQuantityInput(bead.sku_id, e.detail.value)}
                />
              </View>

              <View className={styles.deleteColumn}>
                <View
                  className={styles.deleteButton}
                  onClick={() => handleDeleteItem(bead.sku_id)}
                >
                  <View className={styles.deleteIcon}>X</View>
                </View>
              </View>
            </View>
          );
        })}

        {data.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无珠子数据</Text>
          </View>
        )}
      </ScrollView>

      {/* 添加新珠子按钮 */}
      <View className={styles.addButtonContainer}>
        <View
          className={styles.addButton}
          onClick={handleAddNewBead}
        >
          <Text className={styles.addButtonText}>+ 添加</Text>
        </View>
      </View>

    </View>
  );
};

export default CrystalBeadList;
