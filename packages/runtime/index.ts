import { Protocol } from "@/protocol";
import { Transport } from "@/transport";
import { Message } from "@/types";
import { logger, generateId } from "../utils";
import { ConnectionState } from './constant'

type PendingItem = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timer: number;
}

export class Runtime {

  // 连接状态
  private state = ConnectionState.INIT;


  // ready 回调队列
  private readyCallbacks: Array<() => void> = [];

  // 请求列表
  private pending = new Map<
    string,
    PendingItem
  >();

  // 方法列表
  private handlers = new Map<string, Function>();

  // 监听队列
  private listeners = new Map<string, Function[]>();

  constructor(
    private transport: Transport,
    private protocol: Protocol,
    private id: string,
    private iframeId: string,
    private options: {
      timeout: number,
      debug: boolean
    } = {
        timeout: 5000,
        debug: true
      }
  ) {
    // 统一从 transport 接收原始消息
    this.transport.onMessage(this.handleRawMessage);
  }
  /**
   * 发起 RPC 调用（request）
   * 返回 Promise，等待 response
   */
  call<T = any, R = any>(action: string, payload?: T): Promise<R> {
    const messageId = generateId();

    const msg: Message = {
      sdk: '',
      version: '',
      type: 'request',
      action,
      messageId,
      payload,
      from: this.id,
      iframeId: this.iframeId,
    };

    const encoded = this.protocol.encode(msg);

    if (this.options.debug) {
      logger(`[runtime]_${this.id}_call 回调`, encoded);
    }

    return new Promise<R>((resolve, reject) => {
      // 超时控制，防止 pending 泄漏
      const timer = window.setTimeout(() => {
        this.pending.delete(messageId);
        reject(new Error('Request timeout'));
      }, this.options.timeout);

      // 注册 pending 请求
      this.pending.set(messageId, { resolve, reject, timer });

      // 通过 Transport 发送
      this.transport.send(encoded);
    });
  }

  /**
 * 发送事件（event）
 * 无返回值、无 messageId
 */
  emit<T = any>(action: string, payload?: T): void {
    const msg: Message = {
      sdk: '',
      version: '',
      type: 'event',
      action,
      payload,
      from: this.id,
      iframeId: this.iframeId,
    };
    const data = this.protocol.encode(msg)

    if (this.options.debug) {
      logger(`[runtime]_${this.id}_emit 发送事件`, data);
    }
    this.transport.send(data);
  }

  /**
 * 订阅事件
 * 同一个 action 可注册多个监听器
 */
  on<T = any>(action: string, cb: (payload: T) => void): void {
    const list = this.listeners.get(action) || [];
    list.push(cb);
    if (this.options.debug) {
      logger(`[runtime]_${this.id}_on 监听事件：`, action);
    }
    this.listeners.set(action, list);
  }

  /**
 * 暴露方法（作为被调用方）
 */
  expose<T = any, R = any>(
    action: string,
    handler: (payload: T) => R | Promise<R>
  ): void {
    if (this.options.debug) {
      logger(`[runtime]_${this.id}_expose 暴露方法`, action);
    }
    this.handlers.set(action, handler);
  }

  private handleEvent(message: Message) {
    const { action, payload } = message;
    // 系统事件
    if (action === '__ready__') {
      if (this.state !== ConnectionState.READY) {
        if (this.options.debug) {
          logger(`[runtime]_${this.id}_注册状态`, this.state);
          logger(`[runtime]_${this.id}_ready 子窗口注册成功`);
        }
        this.state = ConnectionState.READY;
        this.readyCallbacks.forEach(cb => cb());
        if (this.options.debug) {
          logger(`[runtime]_${this.id}_注册状态`, this.state);
          logger(`[runtime]_${this.id}_注册成功回调readyCallbacks`, this.readyCallbacks);
        }
        this.readyCallbacks = [];
      }
      return;
    }

    this.listeners.get(action)?.forEach(fn => fn(payload));
  }

  private handleRawMessage = (raw: string) => {
    const message = this.protocol.decode(raw);
    if (!message) return;
    const { type, action, messageId, payload, error, iframeId, from } = message;

    if (this.options.debug) {
      logger(`[runtime]_${this.id}_ message`, message);
      logger(`[runtime]_${this.id}_ this`, this);
    }

    // 过滤掉自己发送的消息
    if (from === this.id) return;

    // 当源一致时，有可能是两个iframe 可能会会互相干扰
    if (iframeId !== this.iframeId) return

    if (this.options.debug) {
      logger(`[runtime]_${this.id}_ 接收消息`, message);
    }


    /**
     * event：单向事件通知
     */
    if (type === 'event') {
      this.handleEvent(message)
      return;
    }

    /**
     * response：匹配 pending 请求
     */
    if (type === 'response' && messageId) {
      const task = this.pending.get(messageId);
      logger(`[runtime]_${this.id}response 匹配到 response 请求`, task);
      if (!task) return;
      clearTimeout(task.timer);
      this.pending.delete(messageId);
      error ? task.reject(error) : task.resolve(payload);
      return;
    }


    /**
     * request：执行本地 handler
     */
    if (type === 'request' && messageId) {
      const handler = this.handlers.get(action);
      // 未暴露的方法，直接返回错误
      if (!handler) {
        this.replyError(action, messageId, '方法没找到');
        return;
      }

      // 执行 handler，支持同步 / 异步
      Promise.resolve(handler(payload))
        .then(res => this.replySuccess(action, messageId, res))
        .catch(err =>
          this.replyError(
            action,
            messageId,
            '执行失败',
            err?.message
          )
        );
    }
  }


  /**
 * 返回成功响应
 */
  private replySuccess(action: string, messageId: string, payload: any) {
    const msg: Message = {
      sdk: '',
      version: '',
      type: 'response',
      action,
      messageId,
      payload,
      from: this.id,
      iframeId: this.iframeId,
    };

    this.transport.send(this.protocol.encode(msg));
  }

  /**
 * 返回错误响应
 */
  private replyError(
    action: string,
    messageId: string,
    code: string,
    message = code
  ) {
    const msg: Message = {
      sdk: '',
      version: '',
      type: 'response',
      action,
      messageId,
      from: this.id,
      iframeId: this.iframeId,
      error: { code, message },
    };

    this.transport.send(this.protocol.encode(msg));
  }
  destroy(): void {
    this.pending.forEach(task => clearTimeout(task.timer));
    this.pending.clear();
    this.handlers.clear();
    this.listeners.clear();
    this.transport.destroy();
    this.readyCallbacks = [];
  }

  /** 注册 ready 成功回调 */
  onReady(cb: () => void) {
    if (this.state === ConnectionState.READY) {
      // 异步调用保证调用顺序一致，不阻塞注册逻辑
      setTimeout(() => cb(), 0);
    } else {
      this.readyCallbacks.push(cb);
    }
  }
}

