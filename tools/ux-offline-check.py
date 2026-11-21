# 서비스 워커 확인: 한 번 열고 → 인터넷을 끊고 → 안내서가 그대로 열리는지.  python tools/ux-offline-check.py
import threading,http.server,socketserver,functools,os
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
s=socketserver.ThreadingTCPServer(("127.0.0.1",0),functools.partial(Q,directory=ROOT));port=s.server_address[1]
threading.Thread(target=s.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{port}/"
with sync_playwright() as p:
    b=p.chromium.launch(channel=os.environ.get("PW_CHANNEL","chrome"));c=b.new_context()
    pg=c.new_page();pg.goto(base+"index.html");pg.evaluate("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(2500)
    pg.reload();pg.wait_for_timeout(800)
    print("controlled:",pg.evaluate("!!navigator.serviceWorker.controller"))
    print("cache entries:",pg.evaluate("caches.keys().then(async k=>{const c=await caches.open(k[0]);return (await c.keys()).length})"))
    pg.goto(base+"index.html#04");pg.wait_for_timeout(500)
    c.set_offline(True)
    pg.goto(base+"index.html");pg.wait_for_timeout(800)
    n=pg.locator(".card-task").count();print("offline cards:",n)
    pg.goto(base+"index.html#04");pg.wait_for_timeout(800);print("offline detail h1:",pg.locator("#gDetailView h1").inner_text())
    pg.goto(base+"ai/index.html");pg.wait_for_timeout(800);print("offline ai page steps:",pg.locator(".ak-steps > li").count())
    pg.goto(base+"nope-never-visited.html");pg.wait_for_timeout(500);print("offline unvisited ->",pg.title())
    print("manifest ok:",pg.evaluate("fetch('manifest.webmanifest').then(r=>r.ok)"))
    b.close()
