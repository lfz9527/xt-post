export type Options = {
  // 是否自动注册
  autoRegister?: boolean
  // 角色
  role?: 'parent' | 'child';
  // 是否开启调试模式
  debug?: boolean
  // 容器元素
  container?: HTMLIFrameElement
  // 指定目标窗口URL
  targetUrl?: string
  // 注册id 唯一
  id: string
  // 超时
  timeout?: number
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
  payload?: T;            // 请求或事件数据
  error?: {
    code: string;
    message: string;
  };
}