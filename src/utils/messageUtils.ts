import Taro from "@tarojs/taro";

type TemplateDecision = "accept" | "reject" | "ban";

export interface SubscriptionsSetting {
  mainSwitch: boolean;
  // 键为模板 ID，值为用户的固定选择：
  // - "accept": 始终允许（不再询问）
  // - "reject": 始终拒绝（不再询问）
  // - "ban": 被禁止（系统或用户设置层面禁用）
  itemSettings?: Record<string, TemplateDecision>;
}

export interface SubscriptionStatus {
  setting: SubscriptionsSetting | null;
  decidedIds: string[];
  undecidedIds: string[];
  decisions: Record<string, TemplateDecision | undefined>;
}

const isWeappEnv = () => Taro.getEnv() === Taro.ENV_TYPE.WEAPP;

/**
 * 读取用户订阅消息设置（含每个模板是否选择了“总是保持以上，不再询问”）。
 */
export async function getSubscriptionsSetting(): Promise<SubscriptionsSetting | null> {
  if (!isWeappEnv()) {
    return null;
  }
  try {
    const res = await Taro.getSetting({ withSubscriptions: true });
    // 部分基础库可能未返回 subscriptionsSetting 字段
    return (res as any)?.subscriptionsSetting ?? null;
  } catch (error) {
    // 读取失败时返回 null，由上层自行兼容
    return null;
  }
}

/**
 * 判断某模板是否已被用户“固定选择”（即点击了“总是保持以上，不再询问”或被禁用）。
 * 固定选择包含：accept / reject / ban。
 */
export function isTemplateDecided(
  setting: SubscriptionsSetting | null,
  templateId: string
): boolean {
  const decision = setting?.itemSettings?.[templateId];
  return decision === "accept" || decision === "reject" || decision === "ban";
}

/**
 * 获取订阅设置状态：哪些模板已固定选择、哪些仍未固定（需要弹窗或后续继续请求）。
 */
export async function getSubscriptionStatus(
  templateIds: string[]
): Promise<SubscriptionStatus> {
  const setting = await getSubscriptionsSetting();
  const decisions: Record<string, TemplateDecision | undefined> = {};
  const decidedIds: string[] = [];
  const undecidedIds: string[] = [];

  for (const id of templateIds) {
    const d = setting?.itemSettings?.[id];
    decisions[id] = d as TemplateDecision | undefined;
    if (d === "accept" || d === "reject" || d === "ban") {
      decidedIds.push(id);
    } else {
      undecidedIds.push(id);
    }
  }

  return { setting, decisions, decidedIds, undecidedIds };
}

export interface EnsureSubscribeOptions {
  // 需要请求订阅的模板 ID 列表
  templateIds: string[];
  // 对于已被“始终允许(accept)”的模板，是否一并提交请求（不会弹窗，会直接返回 accept）。
  // 一次性订阅在发送前通常需要再次请求，建议默认开启。
  includeAlwaysAccept?: boolean;
}

export interface EnsureSubscribeResult {
  // requestSubscribeMessage 的原始返回（按模板 ID 映射到 accept/reject/ban）
  result?: Record<string, TemplateDecision>;
  // 本次是否有触发请求（true 表示执行了 Taro.requestSubscribeMessage）
  requested: boolean;
  // 哪些模板在请求前仍未固定选择（用于判断是否可能出现弹窗）
  undecidedBeforeRequest: string[];
}

/**
 * 确保订阅：
 * - 若用户未对模板点击“总是保持以上，不再询问”，则本次会触发订阅消息请求（可能出现弹窗）。
 * - 若模板已为“始终允许(accept)”，可选择一并请求以获取一次性订阅授权，不会出现弹窗。
 * - 对于“始终拒绝(reject)”或“ban”的模板将跳过请求。
 */
export async function ensureSubscribe(
  options: EnsureSubscribeOptions
): Promise<EnsureSubscribeResult> {
  const { templateIds, includeAlwaysAccept = true } = options;

  if (!isWeappEnv() || !templateIds?.length) {
    return { requested: false, undecidedBeforeRequest: [], result: undefined };
    }

  const status = await getSubscriptionStatus(templateIds);
  const undecided = status.undecidedIds;

  // 可选地把已“始终允许”的模板也加入请求（无需弹窗，直接返回 accept）
  const alwaysAcceptIds = templateIds.filter(
    (id) => status.decisions[id] === "accept"
  );

  // 跳过已“始终拒绝”或“ban”的模板
  const idsToRequest = new Set<string>();
  undecided.forEach((id) => idsToRequest.add(id));
  if (includeAlwaysAccept) {
    alwaysAcceptIds.forEach((id) => idsToRequest.add(id));
  }

  if (idsToRequest.size === 0) {
    return { requested: false, undecidedBeforeRequest: [], result: undefined };
  }

  try {
    const res = (await Taro.requestSubscribeMessage({
      tmplIds: Array.from(idsToRequest),
      // 某些 Taro 类型定义要求提供 entityIds 字段
      entityIds: [],
    } as any)) as unknown as Record<string, TemplateDecision>;
    return {
      requested: true,
      undecidedBeforeRequest: undecided,
      result: res,
    };
  } catch (error) {
    // 失败时依然返回请求过的标记，便于上层处理错误提示或降级
    return { requested: true, undecidedBeforeRequest: undecided, result: undefined };
  }
}


