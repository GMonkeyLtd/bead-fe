import { View, Image } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import AppHeader from "@/components/AppHeader";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import logoSvg from "@/assets/icons/logo.svg";
import expendImage from "@/assets/icons/expend.svg";
import CrystalButton from "@/components/CrystalButton";
import { CRYSTALS_BG_IMAGE_URL, LOGO_IMAGE_URL, LOGO_WITH_BACKGROUND_IMAGE_URL, QR_CODE_IMAGE_URL } from "@/config";
import { useDesign } from "@/store/DesignContext";
import createBeadImage from "@/assets/icons/create-bead.svg";
import shareDesignImage from "@/assets/icons/share-design.svg";
import PosterGenerator from "@/components/PosterGenerator";
import BudgetDialog from "@/components/BudgetDialog";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";

const Result = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();
  const [braceletName, setBraceletName] = useState("");
  const [braceletDescription, setBraceletDescription] = useState("");
  const { designData } = useDesign();
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [beadDescriptions, setBeadDescriptions] = useState<any[]>([]);
  const [designNo, setDesignNo] = useState("");
  const [budgetDialogShow, setBudgetDialogShow] = useState(false);
  const [orderList, setOrderList] = useState<any[]>([]);

  console.log(orderList, "orderList");

  const posterData = useMemo(() => {
    return {
      title: braceletName,
      description: braceletDescription,
      crystals: beadDescriptions,
      qrCode: QR_CODE_IMAGE_URL,
      mainImage: imageUrl,
    };
  }, [braceletName, braceletDescription, beadDescriptions, imageUrl]);


  const getOrderData = (orderUuid: string[]) => {
    api.userHistory.getOrderById(orderUuid).then((res) => {
      res.data.orders?.length > 0 && setOrderList(res.data.orders);
    });
  }

  const getDesignData = (designId: string) => {
    api.userHistory.getDesignById(parseInt(designId)).then((res) => {
      const {
        id,
        image_url,
        word_info,
        order_uuid
      } = res?.data || {};
      if (order_uuid?.length > 0) {
        getOrderData(order_uuid);
      }

      const {
        bracelet_name,
        recommendation_text,
        bead_ids_deduplication
      } = word_info;

      setImageUrl(image_url);
      setBraceletName(bracelet_name);
      setBeadDescriptions(bead_ids_deduplication);
      setDesignNo(id);
      setBraceletDescription(recommendation_text);
    }).catch((err) => {
      console.log(err, "err");
      Taro.showToast({
        title: "加载失败",
        icon: "none",
      });
    });
  }

  useEffect(() => {
    // 获取传入的图片URL参数
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    if (params?.designBackendId) {
      const imageUrl = params?.imageUrl || "";
      imageUrl && setImageUrl(decodeURIComponent(imageUrl));
      getDesignData(params?.designBackendId);
    }

    if (params?.designId) {
      const result = designData.find(
        (item: any) => item.design_id === params.designId
      );
      const {
        image_urls,
        bracelet_name,
        recommendation_text,
        bead_ids_deduplication,
        design_backend_id
      } = result;

      setImageUrl(image_urls[0]);
      setBraceletName(bracelet_name);
      setBraceletDescription(recommendation_text);
      setBeadDescriptions(bead_ids_deduplication);
      setDesignNo(design_backend_id);
    }
  }, []);

  // 保存图片到相册
  const saveImage = async () => {
    if (!shareImageUrl) {
      Taro.showToast({
        title: "没有图片可保存",
        icon: "none",
      });
      return;
    }
    try {
      Taro.showToast({
        title: "保存中",
        icon: "loading",
      });

      await Taro.saveImageToPhotosAlbum({
        filePath: shareImageUrl,
      });

      Taro.showToast({
        title: "保存成功",
        icon: "success",
      });
    } catch (error) {
      console.error("保存图片失败:", error);
      Taro.showToast({
        title: "保存失败",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 分享图片
  const doCreate = () => {
    setBudgetDialogShow(true);
  };

  const viewImage = () => {
    if (!imageUrl) {
      Taro.showToast({
        title: "暂无图片",
        icon: "none",
      });
      return;
    }

    Taro.previewImage({
      current: imageUrl,
      urls: [imageUrl],
    });
  };

  return (
    <View
      className="result-container"
      style={{
        height: "100vh",
        paddingTop: `-${navBarTop}px`,
        "--bg-image": `url(${imageUrl})`,
      }}
    >
      <AppHeader isWhite />
      <View
        className="result-content-container"
        style={{
          position: "relative",
          paddingTop: `${navBarTop + navBarHeight + 20}px`,
          height: `calc(100vh - ${120}px)`,
          overflowY: "auto",
        }}
      >
        <View
          className="result-content-bg-image"
          style={{
            top: 0,
          }}
        >
          <Image
            src={CRYSTALS_BG_IMAGE_URL}
            mode="widthFix"
            style={{ width: "100%" }}
          />
        </View>
        <View className="result-content-card">
          <View className="result-content-card-image" onClick={viewImage}>
            {/* <Image mode="widthFix" src={imageUrl} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} /> */}
            <View className="logo-image-container" onClick={viewImage}>
              <Image className="logo-image" src={LOGO_IMAGE_URL} mode="widthFix" />
            </View>
            <Image className="expend-image" src={expendImage} mode="widthFix" />
          </View>
          <View className="result-content-card-text-container">
            <View className="result-content-card-text">
              {designNo && (
                <View className="result-content-card-subtitle">{`设计编号：${designNo}`}</View>
              )}
              <View className="result-content-card-text-title">
                {braceletName}
              </View>
              <View className="result-content-card-text-content">
                {braceletDescription}
              </View>
            </View>
            <View className="bead-description-container">
              <View className="bead-description-list">
                {beadDescriptions.length > 0 &&
                  beadDescriptions.map((item, index) => (
                    <View className="bead-item" key={index}>
                      <View className="bead-title" key={index}>
                        <Image
                          src={item.image_url}
                          style={{
                            width: "15px",
                            height: "15px",
                            marginRight: "4px",
                          }}
                        />
                        <View>{`${item.name}「${item.wuxing}」`}</View>
                      </View>
                      <View className="bead-description">{item.function}</View>
                    </View>
                  ))}
              </View>
              <View className="bead-share-qrcode">
                <Image
                  src={QR_CODE_IMAGE_URL}
                  mode="widthFix"
                  style={{ width: "62px", height: "62px" }}
                />
                <View className="bead-share-qrcode-text">开启专属定制</View>
              </View>
            </View>
          </View>
        </View>

        {orderList?.length > 0 && (
          <View className="result-order-list-container">
            <View className="result-order-list-title">
              {`相关订单（${orderList.length}）`}
            </View>
            <OrderListComp
              orders={orderList.map((item) => ({
                id: item.order_uuid,
                orderNumber: item.order_uuid,
                status: item.order_status,
                merchantName: item.merchant_info?.name,
                createTime: item.created_at,
                budget: item.price,
              }))}
              showActions={false}
              showImage={false}
              onItemClick={(item) => {
                console.log(item, "item");
                if ([OrderStatus.PendingDispatch, OrderStatus.PendingAcceptance, OrderStatus.Dispatching].includes(item.status)) {
                  Taro.navigateTo({
                    url: `${pageUrls.orderDispatching}?orderId=${item.id}`,
                  });
                } else {
                  Taro.navigateTo({
                    url: `${pageUrls.orderDetail}?orderId=${item.id}`,
                  });
                }
              }}
            />
          </View>
        )}
      </View>
      <View className="result-content-card-action">
        <CrystalButton
          onClick={saveImage}
          text="分享"
          style={{ marginTop: "20px", marginLeft: "24px" }}
          prefixIcon={
            <Image
              src={shareDesignImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
        <CrystalButton
          onClick={doCreate}
          isPrimary
          text="制作成品"
          style={{ flex: 1, marginTop: "20px", marginRight: "24px" }}
          prefixIcon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
      </View>
      {budgetDialogShow && (<BudgetDialog
        visible={budgetDialogShow}
        title={braceletName}
        designNumber={designNo}
        productImage={imageUrl}
        onClose={() => setBudgetDialogShow(false)}
      />)}
      <PosterGenerator data={posterData} onGenerated={setShareImageUrl} />
    </View>
  );
};

export default Result;
