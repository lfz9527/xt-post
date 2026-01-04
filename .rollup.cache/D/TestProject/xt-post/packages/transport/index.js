import { generateId } from "@/utils";
export class Transport {
    constructor(target = window, role, origin = '*', debug = false, id = generateId()) {
        this.role = role;
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
            window.addEventListener('message', this.handleMessageBound);
        }
        catch (error) {
            this.handleMessageBound = () => { };
            console.error(error);
        }
    }
    // 发送消息
    send(data) {
        if (this.debug) {
            this.log('发送消息', data);
        }
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
            this.log(`通信销毁`);
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
        if (this.debug) {
            this.log('接收消息', data);
        }
        this.listener(data);
    }
    log(key, data) {
        console.group(`[transport]_[${this.origin}]_[${this.role}] [${this.id}] ${key}`);
        console.log(data);
        console.groupEnd();
    }
}
//# sourceMappingURL=index.js.map