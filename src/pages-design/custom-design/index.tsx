import Taro from "@tarojs/taro";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing/CustomDesignRing";
import { useCallback, useEffect, useState, useRef } from "react";
import api, { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { pageUrls } from "@/config/page-urls";
import apiSession, { AccessoryItem, BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

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
  } = useInfiniteScroll<any>({
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
    } 
  }, [skuHasMore, skuList]);

  useEffect(() => {
    refreshSkuList();
  }, [refreshSkuList]);
  console.log(skuList, 'skuList')

  const checkDeadsDataChanged = (_oldBeads: any[], _newBeads: any[]) => {
    if (!_oldBeads || !_newBeads || _oldBeads?.length !== _newBeads?.length) {
      return true;
    }
    const oldBeads = _oldBeads?.map((item) => {
      return {
        id: item.id,
        width: item.width || 0,
        diameter: item.diameter,
      };
    });
    const newBeads = _newBeads?.map((item) => {
      return {
        id: item.id,
        width: item.width || 0,
        diameter: item.diameter,
      };
    });
    console.log(oldBeads, newBeads, 'oldBeads, newBeads')
    return JSON.stringify(oldBeads) !== JSON.stringify(newBeads);
  }

  const backToChatDesign = (session_id: string) => {
    Taro.redirectTo({
      url: `${pageUrls.chatDesign}?session_id=${session_id}`,
    });
  }

  const onCreate = (imageUrl: string, editedBeads: any[], isSaveAndBack: boolean = false) => {

    if (!imageUrl || !sessionId || !draftId) {
      return;
    }
    // const result = getCustomDesignState();
    // 将result返回的图片预览
    // Taro.previewImage({
    //   urls: [result.image_url || ''],
    // })
    if (from === 'result' && !checkDeadsDataChanged((draft as any)?.beads || [], editedBeads || [])) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}&imageUrl=${encodeURIComponent(imageUrl)}`,
      });
      return;
    }
    const beads = editedBeads.map((item) => {
      // 优先使用allBeadList珠子库中的数据
      let _beadData = null;
      if (item.frontType) {
        _beadData = (item.frontType === 'crystal' ? allBeadList : accessoryList)?.find((_item) => _item.id == item.id);
      }
      if (!_beadData) {
        // 如果allBeadList中没有找到，则使用draft中的老数据
        _beadData = draft?.beads?.find((_item) => _item.bead_id == item.id) || item;
      }
      const newBeadData = {
        ...(_beadData || {}),
        diameter: item.diameter,
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

  const onSaveAndBack = (image_url: string | undefined, beads: BeadItem[]) => {
    if (!image_url) {
      return;
    }
    onCreate(image_url, beads, true);
  }

  const onDirectBack = (image_url: string | undefined) => {
    if (from === 'result') {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}&imageUrl=${encodeURIComponent(image_url || '')}`,
      });
    } else {
      sessionId && backToChatDesign(sessionId);
    }
  }

  const handleBack = () => {
    const { image_url, beads } = getCustomDesignState();
    const oldBeads = (draft as any)?.beads;
   
    if (!checkDeadsDataChanged(oldBeads || [], beads || [])) {
      onDirectBack(image_url);
    } else {
      Taro.showActionSheet({
        itemList: from === 'chat' ? ['直接返回','保存并返回'] : ['直接返回'],
        success: function (res) {
          console.log(res, 'res')
          if (res.tapIndex === 1) {
            onSaveAndBack(image_url, beads || []);
          } else {
            onDirectBack(image_url);
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
        image_url: state.imageUrl,
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
        beads={(draft?.beads || [])?.map((item: any) => {
          return {
            ...item,
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
