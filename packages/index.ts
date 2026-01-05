import { Protocol } from './protocol';
import { Runtime } from './runtime';
import { Transport } from './transport';
import { defaultOptions, EventName } from './constant';
import { Options } from './types';
import { mergeObject, logger } from './utils';

/**
 * XtPost
 * SDK 最外层封装（Facade）
 * - 对外暴露统一通信 API
*/
class XtPost {
  /** 合并后的配置 */
  private config: Required<Options>;

  /** 通信层 */
  private transport!: Transport;

  /** 协议层 */
  private protocol!: Protocol;

  /** 运行时 */
  private runtime!: Runtime;

  constructor(options: Options) {
    // 1️⃣ 合并默认配置
    this.config = mergeObject(defaultOptions, options) as Required<Options>;
    const { container, targetUrl } = this.config
    // 自动判断父窗口还是子窗口
    const isParent = container && targetUrl

    let target: Window | WindowProxy;
    let origin: string;

    if (isParent) {
      target = container!.contentWindow!;
      origin = new URL(targetUrl!).origin;
    } else {
      target = window.parent;
      origin = '*';
    }
    this.init(target, origin);

    // 嵌套的子窗口支持自动注册
    if (this.config.autoRegister && !isParent) {
      this.emitReady()
    }
  }

  private init(target: Window | WindowProxy, origin: string) {
    const {
      debug,
      timeout,
      id,
      iframeId,
    } = this.config;
    // 2️⃣ 初始化 Transport
    this.transport = new Transport(target, origin, debug, id);

    // 3️⃣ 初始化 Protocol
    this.protocol = new Protocol(debug, id);

    // 4️⃣ 初始化 Runtime
    this.runtime = new Runtime(
      this.transport,
      this.protocol,
      id,
      iframeId,
      {
        debug,
        timeout
      }
    );
  }

  /* ===================== 对外 API ===================== */

  /**
   * 发起 RPC 调用
   */
  call<T = any, R = any>(action: string, payload?: T): Promise<R> {
    return this.runtime.call(action, payload);
  }

  /**
   * 发送事件
   */
  emit<T = any>(action: string, payload?: T): void {
    this.runtime.emit(action, payload);
  }

  /**
   * 监听事件
   */
  on<T = any>(action: string, cb: (payload: T) => void): void {
    this.runtime.on(action, cb);
  }

  /**
   * 暴露 RPC 方法
   */
  expose<T = any, R = any>(
    action: string,
    handler: (payload: T) => R | Promise<R>
  ): void {
    this.runtime.expose(action, handler);
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    this.runtime.destroy();
  }

  /** 注册 ready 成功回调 */
  onReady(cb: () => void) {
    this.runtime.onReady(cb);
  }

  // 对父窗口发起 ready 事件，告知父窗口当前子窗口已经注册完成
  emitReady() {
    if (this.config.debug) {
      logger(`[XtPost]_${this.config.id}_autoRegister 子iframe 发起注册 ready`);
    }
    this.emit(EventName.READY);
  }
}

export default XtPost;
