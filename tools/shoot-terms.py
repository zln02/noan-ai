"""tools/shoot-terms.py — AI 알기 썸네일을 다시 찍는다.
terms/anim/<id>.html?poster=1 을 960x540 으로 찍어 assets/terms/<id>.webp 로 저장한다.
필요: python playwright (chrome, 또는 PW_CHANNEL=msedge), Pillow.  사용: python tools/shoot-terms.py"""
import json, os
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items = json.load(open(os.path.join(ROOT, "data", "terms.json"), encoding="utf8"))["items"]
os.makedirs(os.path.join(ROOT, "assets", "terms"), exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel=os.environ.get("PW_CHANNEL", "chrome"))
    pg = b.new_page(viewport={"width": 960, "height": 540})
    for it in items:
        url = "file:///" + os.path.join(ROOT, it["file"]).replace("\\", "/") + "?poster=1"
        pg.goto(url); pg.wait_for_timeout(250)
        tmp = os.path.join(ROOT, "assets", "terms", "_tmp.png"); pg.screenshot(path=tmp)
        Image.open(tmp).save(os.path.join(ROOT, it["poster"]), "WEBP", quality=82); os.remove(tmp)
        print("썸네일", it["poster"])
