import { generateId, logger } from "@/utils";
export class Transport {
    constructor(target = window, origin = '*', debug = false, id = generateId()) {
        this.origin = origin;
        this.debug = debug;
        this.id = id;
        this.listener = null;
        this.target = window;
        try {
            if (!this.target) {
                throw new Error("目标iframe 不能为空");
            }
            this.target = target;
            // 绑定一次，保证 destroy 可移除
            this.handleMessageBound = this.handleMessage.bind(this);
            if (this.debug) {
                logger(`[transport]_${this.id} 通信初始化`);
            }
            window.addEventListener('message', this.handleMessageBound);
        }
        catch (error) {
            this.handleMessageBound = () => { };
            console.error(error);
        }
    }
    // 发送消息
    send(data) {
        this.target.postMessage(data, this.origin);
    }
    // 接收消息
    onMessage(cb) {
        this.listener = cb;
    }
    // 销毁
    destroy() {
        this.listener = null;
        window.removeEventListener('message', this.handleMessageBound);
        if (this.debug) {
            logger(`[transport]_${this.id} 通信销毁`);
        }
    }
    handleMessage(event) {
        const { data, origin, source } = event;
        if (!this.listener)
            return;
        if (this.origin !== '*' && origin !== this.origin)
            return;
        if (source !== this.target)
            return;
        if (typeof data === 'string' && this.debug && data.includes('xt-post')) {
            logger(`[transport]_${this.origin}_${this.id}_handleMessage 接收消息`, event);
        }
        this.listener(data);
    }
}
//# sourceMappingURL=index.js.map