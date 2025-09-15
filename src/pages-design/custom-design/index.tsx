import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing/CustomDesignRing";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { pageUrls } from "@/config/page-urls";
import apiSession, { BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";
import { usePageQuery } from "@/hooks/usePageQuery";
import { imageToBase64 } from "@/utils/imageUtils";
import { getScreenHeight } from "@/utils/style-tools";
import { usePollDesign } from "@/hooks/usePollDesign";
import DIYTutorial from "@/components/DIYTutorial";
import { getTutorialSteps, isTutorialCompleted, markTutorialCompleted } from "@/components/DIYTutorial/tutorialData";

export enum SPU_TYPE {
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
  spu_info: { id: number; name: string; category: string; };
  spu_type: number;
  weight: number;
  width: number;
}

const CustomDesign = () => {
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const [accessoryList, setAccessoryList] = useState<any[]>([]);
  const [accessoryTypeMap, setAccessoryTypeMap] = useState<any>({});
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const { draft, startPolling } = usePollDraft({ showLoading: true });
  const { design, getDesign } = usePollDesign({
    pollingInterval: 5000
  });
  const { draftId, sessionId, designId, from, workId, showTutorial: showTutorialParam } = Taro.getCurrentInstance()?.router?.params || {};


  const oldBeadList = useMemo(() => {
    return design?.info?.items || (draft as any)?.items || [];
  }, [draft, design]);

  const oldWuxing = useMemo(() => {
    return design?.info?.wuxing || (draft as any)?.wuxing || [];
  }, [draft, design]);

  const screenHeight = useMemo(() => getScreenHeight(), []);

  // 从首页直接进diy
  const isFromHome = useMemo(() => {
    return from === 'home';
  }, [from]);

  // 从聊天室进diy
  const isFromChat = useMemo(() => {
    return from === 'chat';
  }, [from]);

  // 从结果页进diy
  const isFromResult = useMemo(() => {
    return from === 'result';
  }, [from]);

  // 从灵感社区进diy
  const isFromInspiration = useMemo(() => {
    return from === 'inspiration';
  }, [from]);

  // 使用ref获取子组件状态
  const customDesignRef = useRef<CustomDesignRingRef>(null);

  // 使用无限滚动hook获取sku列表
  const {
    data: skuList,
    hasMore: skuHasMore,
    refresh: refreshSkuList,
    loadMore: loadMoreSku,
  } = usePageQuery<any>({
    listKey: "skuList",
    initialPage: 1,
    pageSize: 100,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await beadsApi.getSkuList({ page, size: pageSize }, { showLoading: false });
      const resData = (res as any)?.data?.items || [];
      const totalCount = (res as any)?.data?.total || 0;
      return {
        data: resData,
        hasMore: resData.length + (page - 1) * pageSize < totalCount,
        total: totalCount,
      };
    }, []),
    queryItem: useCallback(async (item: any) => {
      // 这里可以根据需要实现单个item的查询逻辑
      return item;
    }, []),
    enabled: true,
  });


  useEffect(() => {
    if ((isFromResult || isFromInspiration) && designId) {
      getDesign({ designId });
      return;
    }
    if (draftId && sessionId) {
      startPolling(sessionId, draftId, false);
    }
  }, [draftId, sessionId]);

  // 教程初始化逻辑
  useEffect(() => {
    // 检查URL参数是否要求显示教程
    if (showTutorialParam === 'true') {
      setShowTutorial(true);
      return;
    }

    // 检查是否是首次使用（从首页进入且未完成教程）
    if (isFromHome && !isTutorialCompleted()) {
      // 延迟显示教程，让页面先完全加载
      setTimeout(() => {
        Taro.showModal({
          title: '新手教程',
          content: '这是您第一次使用DIY设计台，是否需要查看操作教程？',
          confirmText: '查看教程',
          cancelText: '跳过',
          success: (res) => {
            if (res.confirm) {
              setShowTutorial(true);
            } else {
              // 用户选择跳过，标记为已完成以免再次弹出
              markTutorialCompleted();
            }
          }
        });
      }, 1000);
    }
  }, [isFromHome, showTutorialParam]);

  // 获取珠子库
  useEffect(() => {
    if (skuHasMore) {
      loadMoreSku()
    } else if (skuList?.length > 0 && !skuHasMore) {
      const beads = skuList?.filter((item) => item.spu_type === SPU_TYPE.BEAD);
      const accessories = skuList?.filter((item) => item.spu_type === SPU_TYPE.ACCESSORY);
      setAllBeadList(beads);
      setAccessoryList(accessories);

      // 按id对珠子进行聚合
      const aggregatedBeads = beads.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.spu_id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
          acc[key].beadSizeList.push(item.diameter);
        } else {
          acc[key] = {
            image_url: item.image_url,
            id: item.spu_id,
            name: item.name,
            wuxing: item.wuxing || [],
            beadList: [item],
            beadSizeList: [item.diameter]
          };
        }
        acc[key].beadSizeList = [...new Set(acc[key].beadSizeList)]?.sort((a: number, b: number) => a - b);
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

      const aggregatedAccessories = accessories.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.spu_id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
          acc[key].beadSizeList.push(item.diameter);
        } else {
          acc[key] = {
            image_url: item.image_url,
            id: item.spu_id,
            name: item.name,
            type: item.type,
            beadList: [item],
            beadSizeList: [item.diameter]
          };
        }
        acc[key].beadSizeList = [...new Set(acc[key].beadSizeList)]?.sort((a: number, b: number) => a - b);
        return acc;
      }, {});
      const aggregatedAccessoriesList = Object.values(aggregatedAccessories);
      // console.log(aggregatedAccessoriesList, 'aggregatedAccessoriesList')
      // aggregatedAccessoriesList.push({
      //   beadList: [{
      //     allow_pre_sale: true,
      //     associated: null,
      //     auto_match: true,
      //     cost_price: 100,
      //     diameter: 30,
      //     id: 4,
      //     image_aspect_ratio: 0.8,
      //     image_url: "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/test/moon-start-test.png",
      //     name: "爱心钻银环",
      //     quality: 2,
      //     reference_price: 150,
      //     shape: 1,
      //     sku_id: 3001,
      //     spu_id: 2001,
      //     spu_type: 2,
      //     type: 1,
      //     weight: 50,
      //     width: 6,
          
      //   }],
      //   beadSizeList: [30],
      //   id: 2000,
      //   image_url: "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/test/moon-start-test.png",
      //   name: "星星月亮吊坠",
      //   pass_height_ratio: 0.1,
      //   type: 1,
      // })
      // aggregatedAccessoriesList.push({
      //   beadList: [{
      //     allow_pre_sale: true,
      //     associated: null,
      //     auto_match: true,
      //     cost_price: 100,
      //     diameter: 25,
      //     id: 2004,
      //     image_aspect_ratio: 0.7,
      //     image_url: "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/test/diaozhui1.png",
      //     name: "蝴蝶吊坠",
      //     quality: 2,
      //     reference_price: 150,
      //     shape: 1,
      //     sku_id: 3002,
      //     spu_id: 2002,
      //     spu_type: 2,
      //     type: 1,
      //     weight: 50,
      //     width: 4,
      //     pass_height_ratio: 0.1,
      //     pass_width_ratio: 0.2
      //   }],
      //   beadSizeList: [25],
      //   id: 2000,
      //   image_url: "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/test/diaozhui1.png",
      //   name: "蝴蝶吊坠",
      //   type: 1,
      // })
      setAccessoryTypeMap(aggregatedAccessoriesList.reduce((acc: Record<string, any[]>, item: any) => {
        // 使用第一个item的wuxing属性
        if (acc[item.type]) {
          acc[item.type].push(item);
        } else {
          acc[item.type] = [item];
        }
        return acc;
      }, {}));
    }
  }, [skuHasMore, skuList]);

  useEffect(() => {
    refreshSkuList();
  }, [refreshSkuList]);

  const checkBeadsDataChanged = (_oldBeads: any[], _newBeads: any[]) => {
    if (!_oldBeads || !_newBeads || _oldBeads?.length !== _newBeads?.length) {
      return true;
    }
    const oldBeads = _oldBeads?.map((item) => {
      return {
        sku_id: item.sku_id
      };
    });
    const newBeads = _newBeads?.map((item) => {
      return {
        sku_id: item.sku_id
      };
    });
    return JSON.stringify(oldBeads) !== JSON.stringify(newBeads);
  }

  const backToChatDesign = (session_id: string) => {
    Taro.redirectTo({
      url: `${pageUrls.chatDesign}?session_id=${session_id}`,
    });
  }

  const onCreate = async (imageUrl: string, editedBeads: any[], isSaveAndBack: boolean = false) => {
    if (isFromResult && !checkBeadsDataChanged(oldBeadList || [], editedBeads || [])) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}`,
      });
      return;
    }
    
    // 从首页、灵感社区、结果页进diy直接生成新的design
    if (isFromHome || isFromInspiration || isFromResult) {
      const wristSize = customDesignRef.current?.getPredictedLength();
      // 将saveDiyDesign需要的参数传递给quickDesign页面（不包含base64，在目标页面重新生成） 
      const beadItems = editedBeads.map((item) => item.sku_id);

      Taro.redirectTo({
        url: `${pageUrls.quickDesign}?beadItems=${JSON.stringify(beadItems)}&wristSize=${Math.floor(wristSize || 0).toString()}&imageUrl=${encodeURIComponent(imageUrl)}&from=${from}`,
      });
      return;
    }

    if ((!isSaveAndBack && !imageUrl && (!sessionId || !draftId))) {
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
        _beadData = oldBeadList?.find((_item) => _item.sku_id == item.sku_id && _item.diameter == item.diameter && _item.width == item.width && _item.quantity == item.quantity) || item;
      }
      const newBeadData = {
        ...(_beadData || {}),
        image_aspect_ratio: item.image_aspect_ratio || 1,
      };
      // 删除newBeadData中的frontType
      delete (newBeadData as any).frontType;
      delete (newBeadData as any).scale_height;
      delete (newBeadData as any).uniqueKey;
      return newBeadData;
    })

    const imageBase64 = await imageToBase64(imageUrl, true, false, undefined, 'png');

    if (sessionId && imageBase64) {
      apiSession.saveDraft({
        session_id: sessionId,
        beadItems: beads.map((item) => (item as any).sku_id),
        image_base64: imageBase64 as string,
      }, { showLoading: true, loadingText: '方案上传中...' }).then((res) => {
        const { draft_id, session_id } = (res as any)?.data || {};
        if (isSaveAndBack && isFromChat) {
          backToChatDesign(session_id);
        } else {
          Taro.redirectTo({
            url: `${pageUrls.quickDesign}?sessionId=${session_id}&draftId=${draft_id}&imageUrl=${encodeURIComponent(imageUrl)}`,
          });
        }
      })
    }
  };

  const onSaveAndBack = (beads: BeadItem[], imageUrl: string) => {
    onCreate(imageUrl, beads, true);
  }

  const onDirectBack = () => {
    if (isFromResult) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}`,
      });
    } if (isFromInspiration) {
      Taro.redirectTo({
        url: `${pageUrls.inspirationDetail}?workId=${workId}&designId=${designId}`,
      });
    } else if (isFromHome) {
      Taro.redirectTo({
        url: `${pageUrls.home}`,
      });
    } else {
      sessionId && backToChatDesign(sessionId);
    }
  }

  const handleBack = async () => {
    const { beads } = getCustomDesignState();
    const imageUrl = await customDesignRef.current?.generateBraceletImage();
    const oldBeads = oldBeadList;

    if (!checkBeadsDataChanged(oldBeads || [], beads || [])) {
      onDirectBack();
    } else {
      Taro.showActionSheet({
        itemList: isFromChat ? ['直接返回', '保存并返回'] : ['直接返回'],
        success: function (res) {
          if (res.tapIndex === 1) {
            onSaveAndBack(beads || [] as BeadItem[], imageUrl || '');
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

  // 教程相关处理函数
  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleCompleteTutorial = useCallback(() => {
    markTutorialCompleted();
  }, []);

  // 显示教程的函数（可以在页面中添加按钮调用）
  const showTutorialManually = useCallback(() => {
    setShowTutorial(true);
  }, []);

  return (
    <PageContainer 
      onBack={handleBack} 
      headerExtraContent="编辑台" 
      backgroundColor='#F4F1EE'
    >
      <CustomDesignRing
        wuxing={sessionId && oldWuxing ? oldWuxing : []}
        accessoryTypeMap={accessoryTypeMap}
        ref={customDesignRef}
        size={screenHeight > 900 ? 340 : 300}
        beads={(oldBeadList || [])?.map((item: any) => {
          return {
            ...item,
            width: item.spu_type === SPU_TYPE.ACCESSORY ? item.width : item.width || item.diameter,
          };
        })}
        beadTypeMap={beadTypeMap}
        // 移除onChange回调
        // onChange={onChange}
        onOk={onCreate}
        renderRatio={CUSTOM_RENDER_RATIO}
        showTutorial={showTutorialManually}
      />
      {/* DIY教程组件 */}
      <DIYTutorial
        visible={showTutorial}
        onClose={handleCloseTutorial}
        onComplete={handleCompleteTutorial}
        steps={getTutorialSteps()}
        autoPlay={false}
      />
    </PageContainer>
  );
};

export default CustomDesign;
