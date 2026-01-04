import { useEffect, useRef } from "react";
import XtPost from "xt-post";

function App() {
  const iframeRef = useRef(null);
  const postRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const xtPost = new XtPost({
      container: iframeRef.current,
      targetUrl: "http://127.0.0.1:5500",
      id: "parent-1",
      iframeId: "iframe-1",
      debug: true,
    });
    xtPost.onReady(() => {
      // 子组件准备好后回调
      console.log(222, "注册13");
    });
    xtPost.expose("getParentTitle", () => {
      return "getParentTitle";
    });
    xtPost.on("eventFromChild", (data) => {
      console.log("子元素发送的事件:", data);
    });
    postRef.current = xtPost;
    return () => {
      xtPost.destroy();
    };
  }, []);

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
      <div style={{ background: "pink", width: "100%", flex: 3 }}>
        <h1>xt-post Module 测试</h1>
        <button
          onClick={async () => {
            await postRef.current?.emit("eventFromParent", {
              name: "张三",
            });
          }}
        >
          测试发送事件
        </button>
      </div>
    </div>
  );
}

export default App;
