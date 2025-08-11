import Taro from "@tarojs/taro";
import CustomDesignRing, { CustomDesignRingRef } from "@/components/CustomDesignRing";
import { useCallback, useEffect, useState, useRef } from "react";
import api, { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { pageUrls } from "@/config/page-urls";
import apiSession, { BeadItem } from "@/utils/api-session";
import { usePollDraft } from "@/hooks/usePollDraft";
import { CUSTOM_RENDER_RATIO } from "@/config/beads";

const CustomDesign = () => {
  const [beadTypeMap, setBeadTypeMap] = useState<any>({});
  const [allBeadList, setAllBeadList] = useState<any[]>([]);
  const { draft, startPolling } = usePollDraft({ showLoading: true });
  const [designData, setDesignData] = useState<any>({});

  const { draftId, sessionId, designId, from } = Taro.getCurrentInstance()?.router?.params || {};

  // 使用ref获取子组件状态
  const customDesignRef = useRef<CustomDesignRingRef>(null);

  useEffect(() => {

    if (draftId && sessionId) {
      startPolling(sessionId, draftId);
    }
  }, [draftId, sessionId]);

  useEffect(() => {
    beadsApi.getBeadList({ showLoading: true }).then((res) => {
      const resData = res.data;
      setAllBeadList(resData);
      setBeadTypeMap(
        resData.reduce((acc, item) => {
          (item.wuxing || []).forEach((wuxingValue) => {
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
  }, []);

  const checkDeadsDataChanged = (_oldBeads: any[], _newBeads: any[]) => {
    if (!_oldBeads || !_newBeads || _oldBeads?.length !== _newBeads?.length) {
      return true;
    }
    const oldBeads = _oldBeads?.map((item) => {
      return {
        id: item.id || item.bead_id,
        diameter: item.diameter,
      };
    });
    const newBeads = _newBeads?.map((item) => {
      return {
        id: item.id,
        diameter: item.diameter,
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

    if (!imageUrl || !sessionId || !draftId) {
      return;
    }
    if (from === 'result' && !checkDeadsDataChanged(draft?.beads || [], editedBeads || [])) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${designId}&imageUrl=${encodeURIComponent(imageUrl)}`,
      });
      return;
    }
    const beads = editedBeads.map((item) => {
      const _beadData = allBeadList?.find((_item) => _item.id == item.id);
      return {
        ..._beadData,
        diameter: item.diameter,
        bead_id: item.bead_id,
      };
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
    const oldBeads = draft?.beads;
   
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
    <PageContainer onBack={handleBack}>
      <CustomDesignRing
        ref={customDesignRef}
        beads={(draft?.beads || [])?.map((item) => {
          return {
            id: item.id,
            image_url: item.image_url,
            render_diameter: item.diameter * CUSTOM_RENDER_RATIO,
            diameter: item.diameter,
          };
        })}
        beadTypeMap={beadTypeMap}
        // 移除onChange回调
        // onChange={onChange}
        onOk={onCreate}
        renderRatio={3}
      />
    </PageContainer>
  );
};

export default CustomDesign;
