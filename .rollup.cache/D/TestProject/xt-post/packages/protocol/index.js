export class Protocol {
    constructor(debug = false, id) {
        this.debug = debug;
        this.id = id;
        this.version = "1.0.0";
    }
    /** 编码 */
    encode(msg) {
        // 保证带上 sdk 标识和版本 并且序列化
        const data = {
            ...msg,
            sdk: Protocol.SDK,
            version: this.version,
        };
        return JSON.stringify(data);
    }
    /** 解码 */
    decode(raw) {
        try {
            const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (!this.validate(msg))
                return null;
            return msg;
        }
        catch (e) {
            if (this.debug) {
                this.log('协议解码错误', raw);
            }
            return null;
        }
    }
    /** 校验消息是否合法 */
    validate(msg) {
        if (!msg)
            return false;
        // 校验sdk标识符是否匹配
        if (msg.sdk !== Protocol.SDK)
            return false;
        if (!msg.type || !msg.action)
            return false;
        if ((msg.type === 'request' || msg.type === 'response') && !msg.messageId)
            return false;
        return true;
    }
    log(key, data) {
        console.group(`[protocol] [${this.id}] ${key}`);
        console.log(data);
        console.groupEnd();
    }
}
Protocol.SDK = 'xt-post';
//# sourceMappingURL=index.js.map