import { View, Text, RichText } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro, { usePullDownRefresh } from "@tarojs/taro";
import styles from "./index.module.scss";
import apiSession, { TDesign } from "@/utils/api-session";
import { marked } from 'marked';
import CrystalContainer from "@/components/CrystalContainer";
import BraceletDraftCardDisplay from "@/components/BraceletDraftCard/BraceletDraftCardDisplay";


const DesignReport = () => {
  const instance = Taro.getCurrentInstance();
  const params = instance.router?.params;
  const { designId } = params || {};
  const [designData, setDesignData] = useState<TDesign | null>(null);

  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string>("");

  const getDesignData = async () => {
    if (!designId) {
      Taro.showToast({
        title: "缺少设计ID",
        icon: "error",
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
      return;
    }

    try {
      setLoading(true);
      const res = await apiSession.getDesignItem(Number(designId));
      if (res?.data) {
        setDesignData(res.data);
        // 解析markdown为HTML
        if (res.data.info?.personal_report) {
          const rawReport = res.data.info.personal_report;

          // 清理可能的特殊字符和编码问题
          let cleanedReport = rawReport;

          // 检查是否是JSON字符串（有时API会返回转义的字符串）
          if (typeof rawReport === 'string' && rawReport.startsWith('"') && rawReport.endsWith('"')) {
            try {
              cleanedReport = JSON.parse(rawReport);
            } catch (e) {
              // 如果解析失败，使用原始内容
              cleanedReport = rawReport;
            }
          }
          console.log(cleanedReport);
          // 清理换行符和特殊字符
          cleanedReport = cleanedReport
            .replace(/\\n/g, '\n')   // 替换转义的换行符
            .replace(/\\r/g, '\r')   // 替换转义的回车符
            .replace(/\r\n/g, '\n')  // 统一换行符
            .replace(/\r/g, '\n')    // 替换单独的\r
            .replace(/\u0000/g, '')  // 移除null字符
            .replace(/\uFEFF/g, '')  // 移除BOM字符
            .trim();                 // 去除首尾空白

          try {
            const html = await marked.parse(cleanedReport) as string;
            // 替换strong标签的样式，确保颜色生效
            let styledHtml = html.replace(
              /<u>/g,
              '<u style="font-weight: 400; text-decoration: none; color: #F68F20 !important;">'
            );
            styledHtml = styledHtml.replace(
              /<h3>/g,
              '<h3 style="line-height: 2; margin-top: 12px; !important;">'
            );
            styledHtml = styledHtml.replace(
              /<ul>/g,
              '<ul style="margin-left: 12px; padding-left: 12px; !important;">'
            );

            console.log(styledHtml);
            setHtmlContent(styledHtml);
          } catch (parseError) {
            console.error("Markdown解析错误:", parseError);
            // 如果解析失败，直接显示原始内容
            setHtmlContent(`<pre style="white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${cleanedReport}</pre>`);
          }
        }
      } else {
        Taro.showToast({
          title: "设计不存在",
          icon: "error",
        });
      }
    } catch (error) {
      Taro.showToast({
        title: "获取报告失败",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDesignData();
  }, [designId]);

  // 下拉刷新
  usePullDownRefresh(() => {
    getDesignData().finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  return (
    <CrystalContainer 
      headerExtraContent="手串能量分析"
      showHome={false}
      style={{ overflowY: "auto" }}
    >
      {designData && (
        <View className={styles.draftCardContainer}>
          <BraceletDraftCardDisplay
            imageUrl={designData?.draft_url || ""}
            name={designData?.info?.name || ""}
            beadList={designData?.info?.items || []}
          />
        </View>
      )}
      <View
        className={styles.reportContent}
      >
        {
          htmlContent ? (
            <View className={styles.markdownContainer}>
              <RichText
                className={styles.markdownContent}
                nodes={htmlContent}
                selectable={true}
              />
            </View>
          ) : (
            <View className={styles.noReportContainer}>
              <Text className={styles.noReportText}>
                {loading ? "报告生成中，请稍后..." : "暂无分析报告"}
              </Text>
            </View>
          )
        }

      </View>
    </CrystalContainer>
  );
};

export default DesignReport;
