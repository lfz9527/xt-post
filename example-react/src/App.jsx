import { useEffect, useRef } from "react";
import XtPost from "xt-post";
import { useXtPost } from "./useXtPost";

function App() {
  const { iframeRef, emit, call } = useXtPost({
    targetUrl: "http://127.0.0.1:5500/example-html/index.html",
    id: "parent-1",
    iframeId: "iframe-1",
    onReady: () => {
      // 子组件准备好后回调
      console.log("parent-1 的子组件注册成功");
    },
    exposes: {
      getParentTitle: () => {
        return "parent-1 title";
      },
    },
    on: {
      eventFromChild: (data) => {
        console.log("parent-1 子元素发送的事件:", data);
      },
    },
  });

  const {
    iframeRef: iframeRef1,
    emit: emitChild2,
    call: callChild2,
  } = useXtPost({
    targetUrl: "http://127.0.0.1:5500/example-html/index1.html",
    id: "parent-2",
    iframeId: "iframe-2",
    onReady: () => {
      // 子组件准备好后回调
      console.log("parent-2 的子组件注册成功");
    },
    exposes: {
      getParentTitle: () => {
        return "parent-2  title";
      },
    },
    on: {
      eventFromChild: (data) => {
        console.log("parent-2 子元素发送的事件:", data);
      },
    },
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
      }}
    >
      <iframe
        ref={iframeRef}
        src="http://127.0.0.1:5500/example-html/index.html"
        style={{ height: "100dvh", border: "none", flex: 4 }}
        border="none"
      />
      <iframe
        ref={iframeRef1}
        src="http://127.0.0.1:5500/example-html/index1.html"
        style={{ height: "100dvh", border: "none", flex: 4 }}
        border="none"
      />
      <div style={{ background: "pink", width: "100%", flex: 3 }}>
        <h1>xt-post Module 测试</h1>
        <button
          onClick={async () => {
            await emit("eventFromParent", {
              name: "parent-1",
              time: Date.now(),
            });
          }}
        >
          测试1发送事件
        </button>
        <button
          onClick={async () => {
            const getChildren = await call("getChildren");
            console.log("getChildren==", getChildren);
          }}
        >
          测试调用子方法getChildren
        </button>
        <br />
        <button
          onClick={async () => {
            await emitChild2("eventFromParent", {
              name: "parent-2",
              time: Date.now(),
            });
          }}
        >
          测试2发送事件
        </button>
        <button
          onClick={async () => {
            const getChildren = await callChild2("getChildren");
            console.log("getChildren==", getChildren);
          }}
        >
          测试调用子方法getChildren
        </button>
      </div>
    </div>
  );
}

export default App;
