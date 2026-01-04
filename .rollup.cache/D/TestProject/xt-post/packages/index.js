import { Protocol } from './protocol';
import { Runtime } from './runtime';
import { Transport } from './transport';
import { defaultOptions } from './constant';
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
    constructor(options) {
        // 1️⃣ 合并默认配置
        this.config = mergeObject(defaultOptions, options);
        // 自动判定角色
        if (options.role) {
            this.role = options.role;
        }
        else if (this.config.container && this.config.targetUrl) {
            this.role = 'parent';
        }
        else {
            this.role = 'child';
        }
        if (this.role === 'parent') {
            this.initParent();
            return;
        }
        this.initChild();
    }
    initParent() {
        const { container, targetUrl, debug, timeout, id, } = this.config;
        this.iframe = container;
        this.iframe.src = targetUrl;
        const target = this.iframe.contentWindow;
        const origin = new URL(targetUrl).origin;
        // 2️⃣ 初始化 Transport
        this.transport = new Transport(target, this.role, origin, debug);
        // 3️⃣ 初始化 Protocol
        this.protocol = new Protocol(debug, id);
        // 4️⃣ 初始化 Runtime
        this.runtime = new Runtime(this.transport, this.protocol, timeout);
    }
    initChild() {
        const { debug, id, timeout } = this.config;
        const target = window.parent; // 子端通信目标为父窗口
        const origin = '*'; // 子端可接收父端任意 origin，或可进一步限制
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
    call(action, payload) {
        return this.runtime.call(action, payload);
    }
    /**
     * 发送事件
     */
    emit(action, payload) {
        this.runtime.emit(action, payload);
    }
    /**
     * 监听事件
     */
    on(action, cb) {
        this.runtime.on(action, cb);
    }
    /**
     * 暴露 RPC 方法
     */
    expose(action, handler) {
        this.runtime.expose(action, handler);
    }
    /**
     * 销毁 SDK
     */
    destroy() {
        this.runtime.destroy();
    }
    /** 注册 ready 成功回调 */
    onReady(cb) {
        this.runtime.onReady(cb);
    }
}
export default XtPost;
//# sourceMappingURL=index.js.map