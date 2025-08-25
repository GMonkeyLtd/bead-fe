import Taro from "@tarojs/taro";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing/CustomDesignRing";
import { useCallback, useEffect, useState, useRef } from "react";
import api, { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { pageUrls } from "@/config/page-urls";
import apiSession, { AccessoryItem, BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";
import { usePageQuery } from "@/hooks/usePageQuery";

enum SPU_TYPE {
  BEAD = 1,
  ACCESSORY = 2,
}

export interface SkuItem {
  sku_id: number;  // 最细珠子品类
  spu_id: number;  // 珠子
  allow_pre_sale: boolean;
  auto_match: boolean;  // 是否自动匹配
  cost_price: number;
  diameter: number;
  quality: number;  // 质量
  reference_price: number;  // 参考价格
  shape: number;  // 形状
  spu_info: {id: number; name: string; category: string;};
  spu_type: number;
  weight: number;
  width: number;
}

const CustomDesign = () => {
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const [accessoryList, setAccessoryList] = useState<any[]>([]);
  const [accessoryTypeMap, setAccessoryTypeMap] = useState<any>({});
  const { draft, startPolling } = usePollDraft({ showLoading: true });
  const { draftId, sessionId, designId, from } = Taro.getCurrentInstance()?.router?.params || {};

  // 使用ref获取子组件状态
  const customDesignRef = useRef<CustomDesignRingRef>(null);

  // 使用无限滚动hook获取sku列表
  const {
    data: skuList,
    loading: skuLoading,
    error: skuError,
    hasMore: skuHasMore,
    refresh: refreshSkuList,
    loadMore: loadMoreSku,
  } = usePageQuery<any>({
    listKey: "skuList",
    initialPage: 1,
    pageSize: 100,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await beadsApi.getSkuList({ page, size: pageSize }, { showLoading: false });
      const resData = res.data?.items || [];
      const totalCount = res.data?.total || 0;
      return {
        data: resData,
        hasMore: resData.length + (page - 1) * pageSize < totalCount,
        total: totalCount,
      };
    }, [beadsApi]),
    queryItem: useCallback(async (item: any) => {
      // 这里可以根据需要实现单个item的查询逻辑
      return item;
    }, []),
    enabled: true,
  });


  useEffect(() => {
    if (draftId && sessionId) {
      startPolling(sessionId, draftId);
    }
  }, [draftId, sessionId]);

  useEffect(() => {
    if (skuHasMore) {
      loadMoreSku()
    } else if (skuList?.length > 0 && !skuHasMore) {
      const beads = skuList?.filter((item) => item.spu_type === SPU_TYPE.BEAD).map((item) => {
        return {
          ...item,
          ...(item.spu_info || {})
        }
      });
      const accessories = skuList?.filter((item) => item.spu_type === SPU_TYPE.ACCESSORY).map((item) => {
        return {
          ...item,
          ...(item.spu_info || {})
        }
      })
      setAllBeadList(beads);
      setAccessoryList(accessories);

      // 按id对珠子进行聚合
      const aggregatedBeads = beads.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
        } else {
          acc[key] = {
            id: item.id,
            name: item.name,
            wuxing: item.wuxing || [],
            beadList: [item]
          };
        }
        return acc;
      }, {});

      // 转换为数组格式
      const aggregatedBeadList = Object.values(aggregatedBeads);

      setBeadTypeMap(
        aggregatedBeadList.reduce((acc: Record<string, any[]>, item: any) => {
          // 使用第一个item的wuxing属性
          (item.wuxing || []).forEach((wuxingValue: string) => {
            if (acc[wuxingValue]) {
              acc[wuxingValue].push(item);
            } else {
              acc[wuxingValue] = [item];
            }
          })
          return acc;
        }, {})
      );
      const aggregatedAccessories = accessories.reduce((acc: Record<string, AccessoryItem[]>, item: AccessoryItem) => {
        if (acc[item.type]) {
          acc[item.type].push(item);
        } else {
          acc[item.type] = [item];
        }
        return acc;
      }, {});
      setAccessoryTypeMap(aggregatedAccessories);
    }
  }, [skuHasMore, skuList]);

  useEffect(() => {
    refreshSkuList();
  }, [refreshSkuList]);

  const checkDeadsDataChanged = (_oldBeads: any[], _newBeads: any[]) => {
    if (!_oldBeads || !_newBeads || _oldBeads?.length !== _newBeads?.length) {
      return true;
    }
    const oldBeads = _oldBeads?.map((item) => {
      return {
        id: item.id,
        width: item.width || 0,
        diameter: item.diameter,
        quantity: item.quantity,
      };
    });
    const newBeads = _newBeads?.map((item) => {
      return {
        id: item.id,
        width: item.width || 0,
        diameter: item.diameter,  
        quantity: item.quantity,
      };
    });
    return JSON.stringify(oldBeads) !== JSON.stringify(newBeads);
  }

  const backToChatDesign = (session_id: string) => {
    Taro.redirectTo({
      url: `${pageUrls.chatDesign}?session_id=${session_id}`,
    });
  }

  const onCreate = (imageUrl: string, editedBeads: any[], isSaveAndBack: boolean = false) => {

    if ((!isSaveAndBack && !imageUrl) || !sessionId || !draftId) {
      return;
    }
    // const result = getCustomDesignState();
    // 将result返回的图片预览
    // Taro.previewImage({
    //   urls: [result.image_url || ''],
    // })
    if (from === 'result' && !checkDeadsDataChanged((draft as any)?.items || [], editedBeads || [])) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}}`,
      });
      return;
    }

    const beads = editedBeads.map((item) => {
      // 优先使用allBeadList珠子库中的数据
      let _beadData = null;
      if (item.sku_id) {
        _beadData = (item.sku_type === SPU_TYPE.BEAD ? allBeadList : accessoryList)?.find((_item) => _item.sku_id == item.sku_id);
      }
      if (!_beadData) {
        // 如果allBeadList中没有找到，则使用draft中的老数据
        _beadData = draft?.items?.find((_item) => _item.sku_id == item.sku_id && _item.diameter == item.diameter && _item.width == item.width && _item.quantity == item.quantity) || item;
      }
      const newBeadData = {
        ...(_beadData || {}),
        image_aspect_ratio: item.image_aspect_ratio || 1,
      };
      // 删除newBeadData中的frontType
      delete newBeadData.frontType;
      delete newBeadData.scale_height;
      delete newBeadData.uniqueKey;
      return newBeadData;
    })
    apiSession.saveDraft({
      session_id: sessionId,
      beads,
    }).then((res) => {
      const { draft_id, session_id } = res?.data || {};
      if (isSaveAndBack && from === 'chat') {
        backToChatDesign(session_id);
      } else {
        Taro.redirectTo({
          url: `${pageUrls.quickDesign}?sessionId=${session_id}&draftId=${draft_id}&imageUrl=${encodeURIComponent(imageUrl)}`,
        });
      }
    })
  };

  const onSaveAndBack = (beads: BeadItem[]) => {
    onCreate('', beads, true);
  }

  const onDirectBack = () => {
    if (from === 'result') {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}`,
      });
    } else {
      sessionId && backToChatDesign(sessionId);
    }
  }

  const handleBack = () => {
    const { beads } = getCustomDesignState();
    const oldBeads = (draft as any)?.items;

    if (!checkDeadsDataChanged(oldBeads || [], beads || [])) {
      onDirectBack();
    } else {
      Taro.showActionSheet({
        itemList: from === 'chat' ? ['直接返回', '保存并返回'] : ['直接返回'],
        success: function (res) {
          console.log(res, 'res')
          if (res.tapIndex === 1) {
            onSaveAndBack( beads || []);
          } else {
            onDirectBack();
          }
        },
        fail: function (res) {
          console.log(res.errMsg)
        }
      })
    }
  }

  // 在需要获取状态时调用ref方法
  const getCustomDesignState = useCallback(() => {
    if (customDesignRef.current) {
      const state = customDesignRef.current.getState();
      return {
        beads: state.beads,
      }
    }
    return {};
  }, []);

  return (
    <PageContainer onBack={handleBack} headerExtraContent="编辑台">
      <CustomDesignRing
        wuxing={(draft as any)?.wuxing || []}
        accessoryTypeMap={accessoryTypeMap}
        ref={customDesignRef}
        size={300}
        beads={(draft?.items || [])?.map((item: any) => {
          return {
            ...item,
            ...(item.spu_info || {}),
            width: item.width || item.diameter,
          };
        })}
        beadTypeMap={beadTypeMap}
        // 移除onChange回调
        // onChange={onChange}
        onOk={onCreate}
        renderRatio={CUSTOM_RENDER_RATIO}
      />
    </PageContainer>
  );
};

export default CustomDesign;
