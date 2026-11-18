# 사용: python tools/ux-axe-detail.py index.html [more pages]  — axe 위반의 요소·색을 자세히 본다
import sys,glob,threading,http.server,socketserver,functools,os
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ax=open(glob.glob(r"C:\Users\User\Downloads\teacher-studio\shared\vendor\axe-core\axe*.min.js")[0],encoding="utf8").read()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
s=socketserver.ThreadingTCPServer(("127.0.0.1",0),functools.partial(Q,directory=ROOT));port=s.server_address[1]
threading.Thread(target=s.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome");pg=b.new_page(viewport={"width":390,"height":844})
    for u in sys.argv[1:]:
        pg.goto(f"http://127.0.0.1:{port}/{u}");pg.wait_for_timeout(600);pg.evaluate(ax)
        r=pg.evaluate("axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,6).map(n=>n.target.join(' ')+' :: '+(n.any[0]&&n.any[0].message||n.failureSummary||'').slice(0,110))})))")
        print('==',u)
        for v in r:
            print(v['id'])
            for n in v['nodes']: print('   ',n)
    b.close()
