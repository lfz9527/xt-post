import { useEffect, useRef } from "react";
import XtPost from "xt-post";

function App() {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const xtPost = new XtPost({
      container: iframeRef.current,
      targetUrl: "http://127.0.0.1:5500/example-html/index.html",
      id: "parent_1",
      debug: true,
    });
    // console.log("xtPost", xtPost);
    xtPost.onReady(() => {
      console.log(222, "注册");
    });
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
      </div>
    </div>
  );
}

export default App;
