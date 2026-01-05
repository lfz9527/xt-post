import { logger, generateId } from "@/utils";
import { ConnectionState } from './constant';
export class Runtime {
    constructor(transport, protocol, id, iframeId, options = {
        timeout: 5000,
        debug: true
    }) {
        this.transport = transport;
        this.protocol = protocol;
        this.id = id;
        this.iframeId = iframeId;
        this.options = options;
        // 连接状态
        this.state = ConnectionState.INIT;
        // ready 回调队列
        this.readyCallbacks = [];
        // 请求列表
        this.pending = new Map();
        // 方法列表
        this.handlers = new Map();
        // 监听队列
        this.listeners = new Map();
        this.handleRawMessage = (raw) => {
            const message = this.protocol.decode(raw);
            if (!message)
                return;
            const { type, action, messageId, payload, error, iframeId, from } = message;
            // 过滤掉自己发送的消息
            if (from === this.id)
                return;
            // 当源一致时，有可能是两个iframe 可能会会互相干扰
            if (iframeId !== this.iframeId)
                return;
            if (this.options.debug) {
                logger(`[runtime]_${this.id}_ 接收消息`, message);
            }
            /**
             * event：单向事件通知
             */
            if (type === 'event') {
                this.handleEvent(message);
                return;
            }
            /**
             * response：匹配 pending 请求
             */
            if (type === 'response' && messageId) {
                const task = this.pending.get(messageId);
                if (!task)
                    return;
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
                    .catch(err => this.replyError(action, messageId, '执行失败', err === null || err === void 0 ? void 0 : err.message));
            }
        };
        // 统一从 transport 接收原始消息
        this.transport.onMessage(this.handleRawMessage);
    }
    /**
     * 发起 RPC 调用（request）
     * 返回 Promise，等待 response
     */
    call(action, payload) {
        const messageId = generateId();
        const msg = {
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
        return new Promise((resolve, reject) => {
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
    emit(action, payload) {
        const msg = {
            sdk: '',
            version: '',
            type: 'event',
            action,
            payload,
            from: this.id,
            iframeId: this.iframeId,
        };
        const data = this.protocol.encode(msg);
        if (this.options.debug) {
            logger(`[runtime]_${this.id}_emit 发送事件`, data);
        }
        this.transport.send(data);
    }
    /**
   * 订阅事件
   * 同一个 action 可注册多个监听器
   */
    on(action, cb) {
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
    expose(action, handler) {
        if (this.options.debug) {
            logger(`[runtime]_${this.id}_expose 暴露方法`, action);
        }
        this.handlers.set(action, handler);
    }
    handleEvent(message) {
        var _a;
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
        (_a = this.listeners.get(action)) === null || _a === void 0 ? void 0 : _a.forEach(fn => fn(payload));
    }
    /**
   * 返回成功响应
   */
    replySuccess(action, messageId, payload) {
        const msg = {
            sdk: '',
            version: '',
            type: 'response',
            action,
            messageId,
            payload,
        };
        this.transport.send(this.protocol.encode(msg));
    }
    /**
   * 返回错误响应
   */
    replyError(action, messageId, code, message = code) {
        const msg = {
            sdk: '',
            version: '',
            type: 'response',
            action,
            messageId,
            error: { code, message },
        };
        this.transport.send(this.protocol.encode(msg));
    }
    destroy() {
        this.pending.forEach(task => clearTimeout(task.timer));
        this.pending.clear();
        this.handlers.clear();
        this.listeners.clear();
        this.transport.destroy();
        this.readyCallbacks = [];
    }
    /** 注册 ready 成功回调 */
    onReady(cb) {
        if (this.state === ConnectionState.READY) {
            // 异步调用保证调用顺序一致，不阻塞注册逻辑
            setTimeout(() => cb(), 0);
        }
        else {
            this.readyCallbacks.push(cb);
        }
    }
}
//# sourceMappingURL=index.js.map