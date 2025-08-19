import Taro from "@tarojs/taro";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing/CustomDesignRing";
import { useCallback, useEffect, useState, useRef } from "react";
import api, { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { pageUrls } from "@/config/page-urls";
import apiSession, { AccessoryItem, BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";

const CustomDesign = () => {
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const [accessoryList, setAccessoryList] = useState<any[]>([]);
  const [accessoryTypeMap, setAccessoryTypeMap] = useState<any>({});
  const { draft, startPolling } = usePollDraft({ showLoading: true });

  const { draftId, sessionId, designId, from } = Taro.getCurrentInstance()?.router?.params || {};

  // 使用ref获取子组件状态
  const customDesignRef = useRef<CustomDesignRingRef>(null);

  useEffect(() => {

    if (draftId && sessionId) {
      startPolling(sessionId, draftId);
    }
  }, [draftId, sessionId]);

  const getBeads = () => {
    beadsApi.getBeadList({ showLoading: true }).then((res) => {
      const resData = res.data;

      (resData || []).forEach((item: any) => {
        item.frontType = 'crystal';
      })
      setAllBeadList(resData);
      
      // 按id对珠子进行聚合
      const aggregatedBeads = resData.reduce((acc: Record<string, any>, item: any) => {
        const key = `${item.id}_${item.name}`;
        if (acc[key]) {
          acc[key].beadList.push(item);
        } else {
          acc[key] = {
            id: item.id,
            name: item.name,
            wuxing: item.wuxing || [] ,
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
    });
  }

  const getAccessories = () => {
    beadsApi.getAccessories({ showLoading: true }).then((res) => {
      const resData: AccessoryItem[] = res.data || [];
      (resData || []).forEach((item: any) => {
        item.frontType = 'accessory';
      })
      // 按类型聚合
      const aggregatedAccessories = resData.reduce((acc: Record<string, AccessoryItem[]>, item: AccessoryItem) => {
        if (acc[item.type]) {
          acc[item.type].push(item);
        } else {
          acc[item.type] = [item];
        }
        return acc;
      }, {});
      setAccessoryList(resData || []);
      setAccessoryTypeMap(aggregatedAccessories);
    });
  } 

  useEffect(() => {
    getBeads();
    getAccessories();
  }, []);

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
