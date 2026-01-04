
export type Options = {
  // 是否自动注册
  autoRegister?: boolean
  // 是否开启调试模式
  debug?: boolean
  // 容器元素
  container?: HTMLIFrameElement
  // 指定目标窗口URL
  targetUrl?: string
  // 超时
  timeout?: number
  // 注册通信id
  id: 'string'
  // 源目标一致时，通过iframeId 去判断
  iframeId: 'string'
}

export type MessageType = 'request' | 'response' | 'event';

/**
 * 消息结构
 */
export interface Message<T = any> {
  sdk: string;     // SDK 标识
  version: string;          // 协议版本
  type: MessageType;
  messageId?: string
  action: string;           // 方法名或事件名
  from?: string;            // 来源
  iframeId?: string
  payload?: T;            // 请求或事件数据
  error?: {
    code: string;
    message: string;
  };
}