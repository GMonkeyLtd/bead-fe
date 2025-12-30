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
import DateTimeDrawer from "@/components/DateTimeDrawer";
import { generateApi, WuXingInfo } from "@/utils/api";

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
    pollingInterval: 5000,
    checkStopPoll: () => {
      return true;
    }
  });
  const { draftId, sessionId, designId, from, workId, showTutorial: showTutorialParam } = Taro.getCurrentInstance()?.router?.params || {};

  const [showBirthDrawer, setShowBirthDrawer] = useState(false);
  const [wuxingInfo, setWuxingInfo] = useState<WuXingInfo | null>(null);
  const [birthInfo, setBirthInfo] = useState<any>(null); // To store birth details

  useEffect(() => {
    try {
      const storedBirthInfo = Taro.getStorageSync('birthInfo');
      const storedWuxingInfo = Taro.getStorageSync('wuxingInfo');
      if (storedBirthInfo) setBirthInfo(storedBirthInfo);
      if (storedWuxingInfo) setWuxingInfo(storedWuxingInfo);
    } catch (e) {
      console.error('Failed to load birth info from storage', e);
    }
  }, []);

  const handleBirthClick = () => {
    if (birthInfo) {
      // Show info and reset option
      const hourDisplay = (birthInfo.hour !== undefined && birthInfo.hour !== null && birthInfo.hour !== '') ? birthInfo.hour : '未知';
      const calendarType = birthInfo.isLunar ? '农历' : '公历'; // 添加公历/农历标识
      const dateStr = `${calendarType} ${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${hourDisplay}时`;
      const wuxingStr = wuxingInfo?.xi_yong?.join('、') || '';
      Taro.showModal({
        title: '已选生辰',
        content: `生辰：${dateStr}\n喜用：${wuxingStr}`, // \n 会自动分成两行
        confirmText: '重置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            setBirthInfo(null);
            setWuxingInfo(null);
            Taro.removeStorageSync('birthInfo');
            Taro.removeStorageSync('wuxingInfo');
            setShowBirthDrawer(true);
          }
        }
      });
    } else {
      setShowBirthDrawer(true);
    }
  };

  const handleBirthDateConfirm = async (dateTime: any) => {
    try {
      Taro.showLoading({ title: "计算五行中..." });
      // Call API
      const res = await generateApi.bazi({
        birth_year: dateTime.year,
        birth_month: dateTime.month,
        birth_day: dateTime.day,
        birth_hour: dateTime.hour,
        is_lunar: dateTime.isLunar,
        sex: dateTime.gender,
      });

      setWuxingInfo(res.data);
      setBirthInfo(dateTime);
      Taro.setStorageSync('birthInfo', dateTime);
      Taro.setStorageSync('wuxingInfo', res.data);
      setShowBirthDrawer(false);
      Taro.hideLoading();
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: "获取五行信息失败", icon: "none" });
    }
  };

  const handleResetBirth = () => {
    setWuxingInfo(null);
    setBirthInfo(null);
    // Don't close drawer immediately, maybe let user select again or close it?
    // User said: "Click Reset -> Re-start using DateTimeDrawer... and clear cache"
    // "Click Reset ->" implies the drawer or a popup shows the reset button.
    // The requirement says: "Bottom popup content is current birth... and a Reset button".
    // This implies simple "DateTimeDrawer" needs to support a "View/Reset" mode OR we use a different view.
    // Simplifying: If I just clear state and keep drawer open (or re-open it), it works.
    // Actually, if `birthInfo` is present, `DateTimeDrawer` (or the button click) should show the Info+Reset view.
    // But `DateTimeDrawer` currently only picks date.
    // I will implement a check: if `birthInfo` exists, `handleBirthClick` shows a ActionSheet or a custom Modal?
    // Requirement 3: "Bottom popup content is current birth... and a Reset button".
    // I will assume I can just use a simple modal or ActionSheet for "Reset" for now, or if I strictly follow "Bottom popup", I might need a new component or modify DateTimeDrawer.
    // Let's use ActionSheet for simplicity first to "Reset" or "Re-select".
    // Wait, requirement 3.1: "Click Reset after restart... DateTimeDrawer".
    // I will implement this logic inside `handleBirthClick`.
  }


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
      console.log(resData, "resData");
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
          content: '这是您第一次使用DIY编辑台，是否需要查看操作教程？',
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
  // 获取珠子库
  useEffect(() => {
    if (skuHasMore) {
      loadMoreSku()
    } else if (skuList?.length > 0 && !skuHasMore) {
      const beads = skuList?.filter((item) => item.spu_type === SPU_TYPE.BEAD);
      const accessories = skuList?.filter((item) => item.spu_type === SPU_TYPE.ACCESSORY);
      setAllBeadList(beads);
      setAccessoryList(accessories);
    }
  }, [skuList, skuHasMore]);

  // Process beads and accessories
  useEffect(() => {
    if (allBeadList.length > 0 || accessoryList.length > 0) {
      // 按id对珠子进行聚合
      const aggregatedBeads = allBeadList.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.spu_id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
          acc[key].beadSizeList.push(item.diameter);
          acc[key].minimalPrice = Math.min(acc[key].minimalPrice, item.reference_price);
        } else {
          acc[key] = {
            image_url: item.image_url,
            id: item.spu_id,
            name: item.name,
            wuxing: item.wuxing || [],
            beadList: [item],
            beadSizeList: [item.diameter],
            minimalPrice: item.reference_price
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
          const itemWuxing = item.wuxing || [];
          itemWuxing.forEach((wuxingValue: string) => {
            if (acc[wuxingValue]) {
              acc[wuxingValue].push(item);
            } else {
              acc[wuxingValue] = [item];
            }
          });

          // Check for recommendations
          if (wuxingInfo?.xi_yong && wuxingInfo.xi_yong.length > 0) {
            const isRecommended = itemWuxing.some((w: string) => wuxingInfo.xi_yong.includes(w));
            if (isRecommended) {
              if (acc['推荐']) {
                acc['推荐'].push(item);
              } else {
                acc['推荐'] = [item];
              }
            }
          }

          return acc;
        }, {})
      );

      const aggregatedAccessories = accessoryList.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.spu_id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
          acc[key].beadSizeList.push(item.diameter);
          acc[key].minimalPrice = Math.min(acc[key].minimalPrice, item.reference_price);
        } else {
          acc[key] = {
            image_url: item.image_url,
            id: item.spu_id,
            name: item.name,
            type: item.type,
            beadList: [item],
            beadSizeList: [item.diameter],
            minimalPrice: item.reference_price
          };
        }
        acc[key].beadSizeList = [...new Set(acc[key].beadSizeList)]?.sort((a: number, b: number) => a - b);
        return acc;
      }, {});
      const aggregatedAccessoriesList = Object.values(aggregatedAccessories);

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
  }, [allBeadList, accessoryList, wuxingInfo]);

  // 初始化时加载 SKU 列表，只执行一次
  useEffect(() => {
    refreshSkuList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在组件挂载时执行一次

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
    // Taro.previewImage({
    //   urls: [imageUrl],
    // });
    // return;
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
        url: `${pageUrls.quickDesign}?beadItems=${JSON.stringify(beadItems)}&wristSize=${Math.round(wristSize || 0).toString()}&imageUrl=${encodeURIComponent(imageUrl)}&from=${from}`,
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
        wuxing={wuxingInfo?.xi_yong || (sessionId && oldWuxing ? oldWuxing : [])}
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
        onBirthClick={handleBirthClick}
        isBirthSet={!!wuxingInfo}
      />
      {/* DIY教程组件 */}
      <DIYTutorial
        visible={showTutorial}
        onClose={handleCloseTutorial}
        onComplete={handleCompleteTutorial}
        steps={getTutorialSteps()}
        autoPlay={false}
      />

      <DateTimeDrawer
        visible={showBirthDrawer}
        onClose={() => setShowBirthDrawer(false)}
        onPersonalizeCustomize={handleBirthDateConfirm}
        personalizeButtonText="确认"
      />
    </PageContainer>
  );
};

export default CustomDesign;
