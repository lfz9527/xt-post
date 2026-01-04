import { Protocol } from './protocol';
import { Runtime } from './runtime';
import { Transport } from './transport';
import { defaultOptions } from './constant';
import { Options } from './types';
import { mergeObject } from './utils';

/**
 * XtPost
 *
 * SDK 最外层封装（Facade）
 *
 * 职责：
 * - 合并配置
 * - 初始化 Transport / Protocol / Runtime
 * - 对外暴露统一通信 API
*/
class XtPost {
  public readonly role: 'parent' | 'child';
  private iframe!: HTMLIFrameElement;
  /** 合并后的配置 */
  private config: Options;

  /** 通信层 */
  private transport!: Transport;

  /** 协议层 */
  private protocol!: Protocol;

  /** 运行时 */
  private runtime!: Runtime;

  constructor(options: Options) {
    // 1️⃣ 合并默认配置
    this.config = mergeObject(defaultOptions, options);
    // 自动判定角色
    if (options.role) {
      this.role = options.role;
    } else if (this.config.container && this.config.targetUrl) {
      this.role = 'parent';
    } else {
      this.role = 'child';
    }
    if (this.role === 'parent') {
      this.initParent();

      return
    }
    this.initChild();
  }

  private initParent() {
    const {
      container,
      targetUrl,
      debug,
      timeout,
      id,
    } = this.config;

    this.iframe = container!;
    this.iframe.src = targetUrl!;

    const target = this.iframe.contentWindow!;
    const origin = new URL(targetUrl!).origin;

    // 2️⃣ 初始化 Transport
    this.transport = new Transport(target, this.role, origin, debug);

    // 3️⃣ 初始化 Protocol
    this.protocol = new Protocol(debug, id);

    // 4️⃣ 初始化 Runtime
    this.runtime = new Runtime(
      this.transport,
      this.protocol,
      timeout
    );
  }

  private initChild() {
    const { debug, id, timeout } = this.config;

    const target = window.parent; // 子端通信目标为父窗口
    const origin = '*';           // 子端可接收父端任意 origin，或可进一步限制

    this.transport = new Transport(target, this.role, origin, debug);
    this.protocol = new Protocol(debug, id);
    this.runtime = new Runtime(this.transport, this.protocol, timeout);

    // 子端可自动发送 ready
    if (this.config.autoRegister) {
      this.emit('__ready__');
    }
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
}

export default XtPost;
