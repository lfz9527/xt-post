export var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["INIT"] = 0] = "INIT";
    ConnectionState[ConnectionState["CONNECTING"] = 1] = "CONNECTING";
    ConnectionState[ConnectionState["CONNECTED"] = 2] = "CONNECTED";
    ConnectionState[ConnectionState["READY"] = 3] = "READY"; // 子端 ready
})(ConnectionState || (ConnectionState = {}));
//# sourceMappingURL=constant.js.map