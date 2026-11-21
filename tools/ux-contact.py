# 전후 비교표: 같은 화면을 폰 너비로 찍어 위(전) 아래(후)로 붙인다.
# 사용: python tools/ux-contact.py <전 폴더> <후 폴더> <출력.png>
import sys,threading,http.server,socketserver,functools,io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
SCREENS=[("홈","index.html"),("안내서 카드(회의록)","index.html#04"),("자료실","library/index.html"),("연수","training/index.html"),("막혔을 때","start/index.html#stuck")]
def serve(root):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a):pass
    s=socketserver.ThreadingTCPServer(("127.0.0.1",0),functools.partial(Q,directory=root));threading.Thread(target=s.serve_forever,daemon=True).start();return s.server_address[1]
def shots(pw,root):
    port=serve(root);b=pw.chromium.launch(channel="chrome",args=["--mute-audio"]);c=b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,service_workers="block");out=[]
    for _,u in SCREENS:
        pg=c.new_page();pg.goto(f"http://127.0.0.1:{port}/{u}");pg.wait_for_timeout(900);out.append(Image.open(io.BytesIO(pg.screenshot())).convert("RGB"));pg.close()
    b.close();return out
with sync_playwright() as p:
    B=shots(p,sys.argv[1]);A=shots(p,sys.argv[2])
W,H=300,650;pad=12;top=34;left=60
sheet=Image.new("RGB",(left+len(SCREENS)*(W+pad)+pad,top+2*(H+pad)+pad+4),"#f4f6fa");d=ImageDraw.Draw(sheet)
f=ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf",15)
for i,(name,_) in enumerate(SCREENS):
    x=left+pad+i*(W+pad);d.text((x,8),name,font=f,fill="#0f2338")
    for r,imgs in enumerate((B,A)):
        im=imgs[i].resize((W,int(844*W/390)));sheet.paste(im.crop((0,0,W,H)),(x,top+pad+r*(H+pad)))
for r,t in enumerate(("전","후")):
    d.text((14,top+pad+r*(H+pad)+H//2-10),t,font=ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf",22),fill="#1d4ed8")
sheet=sheet.convert("P",palette=Image.ADAPTIVE,colors=128);sheet.save(sys.argv[3],optimize=True)
print(sys.argv[3])
