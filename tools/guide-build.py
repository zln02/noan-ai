#!/usr/bin/env python3
"""노안중 AI 안내서 — 업무 기준 카드형 빌더.

tasks.json 하나가 원본이다. 인쇄본(A4 가로)과 웹이 같은 데이터에서 나온다.

  python3 build2.py        guide-print.html 생성
"""
import json
import pathlib

D = json.loads(pathlib.Path("tasks.json").read_text(encoding="utf-8"))
META, GROUPS, TASKS = D["meta"], D["groups"], D["tasks"]
GMAP = {g["id"]: g for g in GROUPS}

# ── 노안중 ──────────────────────────────────────────────────────────
SCHOOL = dict(
    name="노안중학교", opened=1984, year=2026,
    motto="근면 · 성실", flower="장미", tree="백합나무", color="녹색",
    addr="전남 나주시 노안면 노안로 373",
    grads="2,876",           # 2022년 38회 기준
)
AGE = SCHOOL["year"] - SCHOOL["opened"]

# 로고가 오면 assets/logo.svg 로 두면 워터마크가 로고로 바뀐다.
LOGO = pathlib.Path("assets/logo.svg")

CSS = """
:root{--ink:#0E3B33;--ink2:#155146;--mint:#3FAE93;--mint2:#7FD6C2;--warm:#D97A38;
      --stop:#B4524A;--paper:#F6F9F8;--mute:#61756F;--line:#D9E5E1;--gold:#E3B341;--red:#D6362F;}
@page{size:A4 landscape;margin:0;}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{font-family:"Noto Sans CJK KR","Noto Sans KR",sans-serif;color:var(--ink);
     -webkit-print-color-adjust:exact;print-color-adjust:exact;background:#DFE8E5;}
.slide{position:relative;width:297mm;height:210mm;background:#fff;overflow:hidden;
       page-break-after:always;padding:14mm 16mm 12mm;margin:0 auto 6mm;}
.slide:last-child{page-break-after:auto;}
.bar{position:absolute;top:0;left:0;right:0;height:7px;
     background:linear-gradient(90deg,var(--ink) 0%,var(--mint) 55%,var(--mint2) 100%);}

/* 워터마크 — 로고가 없으면 교표 자리 도형 + 학교명 */
.wm{position:absolute;right:14mm;bottom:12mm;opacity:.05;pointer-events:none;
    display:flex;align-items:center;gap:5mm;}
.wm svg{width:24mm;height:24mm;}
.wm .t{font-size:20pt;font-weight:900;letter-spacing:-1px;}
.wm img{width:24mm;height:24mm;}

.bignum{position:absolute;left:-10mm;top:9mm;font-size:88pt;font-weight:900;letter-spacing:-4px;
        color:var(--ink);opacity:.9;line-height:1;}
.head{display:flex;justify-content:space-between;align-items:flex-start;
      margin-left:31mm;border-bottom:1px solid var(--line);padding-bottom:6px;}
.head h1{font-size:27pt;font-weight:900;margin:0;line-height:1.12;letter-spacing:-1px;}
.head .r{text-align:right;padding-top:3px;}
.tag{display:inline-block;font-size:10pt;font-weight:700;padding:2px 11px;border-radius:11px;color:#fff;}
.tag.mint{background:var(--mint);} .tag.warm{background:var(--warm);}
.head .when{font-size:12pt;color:var(--ink2);margin-top:4px;max-width:118mm;word-break:keep-all;line-height:1.45;}
.path{margin:7mm 0 4mm;font-size:12pt;color:var(--ink2);}
.path b{color:var(--red);font-weight:700;}
.tip{margin:4mm 0 0;background:#F1F8F5;border-left:4px solid var(--mint);border-radius:4px;
     padding:2.6mm 4.5mm;font-size:9.5pt;line-height:1.45;color:var(--ink2);word-break:keep-all;}
.tip b{color:var(--ink);font-size:10.5pt;margin-right:3mm;}

.body{display:flex;gap:9mm;align-items:flex-start;min-height:112mm;}
.left{flex:1.25;min-width:0;} .right{flex:1;min-width:0;}
ol.st{margin:0 0 5mm;padding-left:0;list-style:none;counter-reset:s;}
ol.st li{font-size:12.5pt;line-height:1.55;margin-bottom:7px;padding-left:9mm;position:relative;counter-increment:s;}
ol.st li:before{content:counter(s);position:absolute;left:0;top:1px;width:6mm;height:6mm;border-radius:50%;
                background:var(--ink);color:#fff;font-size:9.5pt;font-weight:700;
                display:flex;align-items:center;justify-content:center;}
.pr{background:#0E3B33;color:#EAF6F2;border-radius:6px;padding:7mm 8mm;margin:0 0 4mm;position:relative;}
.pr .lab{position:absolute;top:-9px;left:9mm;background:var(--gold);color:#3a2c00;
         font-size:9pt;font-weight:700;padding:2px 10px;border-radius:9px;}
.pr pre{margin:0;font-family:"Noto Sans CJK KR","Noto Sans KR",sans-serif;
        font-size:11.5pt;line-height:1.62;white-space:pre-wrap;word-break:keep-all;}
.prnote{background:#EAF6F2;border:1px solid var(--mint);border-radius:6px;
        padding:6mm 7mm;font-size:11.5pt;line-height:1.55;margin:0 0 4mm;}
.cau{background:#FAEDEC;border-left:6px solid var(--stop);border-radius:5px;
     padding:9px 13px;font-size:11pt;line-height:1.55;}
.shotwrap{position:relative;border:1px solid var(--line);border-radius:4px;overflow:hidden;background:#F2F9F7;}
.shotwrap img{width:100%;display:block;}
.mark{position:absolute;border:3px solid var(--red);border-radius:50%;}
.mark span{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:3px;
           background:var(--red);color:#fff;font-size:8.5pt;font-weight:700;
           padding:1px 7px;border-radius:9px;white-space:nowrap;}
.mins{margin-top:4mm;font-size:11pt;color:var(--mute);}
.mins b{color:var(--ink);font-size:13pt;}

/* 표지 */
.cover{display:flex;flex-direction:column;justify-content:center;height:100%;}
.cover .est{font-size:12pt;color:var(--mute);letter-spacing:2px;}
.cover h1{font-size:52pt;font-weight:900;margin:3mm 0 0;letter-spacing:-3px;line-height:1.05;}
.cover .s{font-size:19pt;color:var(--ink2);margin-top:4mm;}
.cover .line{width:46mm;height:5px;background:var(--mint);margin:9mm 0;}
.cover .meta{font-size:11.5pt;color:var(--mute);line-height:1.9;}
.cover .qr{position:absolute;right:20mm;bottom:34mm;text-align:center;}
.cover .qr img{width:33mm;height:33mm;}
.cover .qr div{font-size:9.5pt;color:var(--mute);margin-top:2mm;}

/* 목차 */
.gsec{margin-top:2mm;}
.gsec h2{font-size:12.5pt;margin:0 0 1.8mm;display:flex;align-items:center;gap:4mm;}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:2.2mm;}
.card{border:1.5px solid var(--line);border-radius:7px;padding:2.6mm 3.4mm;position:relative;min-height:17mm;}
.card .n{font-size:9.5pt;font-weight:900;color:var(--mint);}
.card .t{font-size:11pt;font-weight:700;margin:.6mm 0 .9mm;letter-spacing:-.5px;line-height:1.2;}
.card .w{font-size:8pt;color:var(--mute);line-height:1.3;}
.card.warm{border-color:#F0D9C4;}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;
      font-size:8.5pt;color:var(--mute);border-top:1px solid var(--line);padding-top:4px;}
"""

# 백합나무 잎 — 로고가 오기 전까지 쓰는 모티프 (교목이 백합나무)
LEAF = """<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 6c-6 12-18 18-30 20 4 6 4 12 2 18 8-2 14 0 19 5-3-13 1-26 9-33zm0 0c6 12 18 18 30 20-4 6-4 12-2 18-8-2-14 0-19 5 3-13-1-26-9-33zM47 52h6v42h-6z"/></svg>"""


def wm():
    if LOGO.exists():
        inner = f'<img src="{LOGO}" alt="">'
    else:
        inner = LEAF
    return f'<div class="wm">{inner}<div class="t">{SCHOOL["name"]}</div></div>'


def foot(l, r):
    return f'<div class="foot"><span>{l}</span><span>{r}</span></div>'


def cover():
    return f"""<section class="slide"><div class="bar"></div>{wm()}
<div class="cover">
  <div class="est">SINCE {SCHOOL['opened']} · {AGE}년</div>
  <h1>노안중학교<br>AI 안내서</h1>
  <div class="s">무엇을 하시려고요? — 그것부터 찾으시면 됩니다.</div>
  <div class="line"></div>
  <div class="meta">
    교훈 {SCHOOL['motto']} &nbsp;·&nbsp; 교화 {SCHOOL['flower']} &nbsp;·&nbsp; 교목 {SCHOOL['tree']} &nbsp;·&nbsp; 교색 {SCHOOL['color']}<br>
    {SCHOOL['opened']}년 개교 · 졸업생 {SCHOOL['grads']}명이 지나간 학교입니다<br>
    이 안내서의 색은 우리 학교 교색에서 가져왔습니다.
  </div>
</div>
<div class="qr" style="position:absolute;right:20mm;bottom:34mm;text-align:center">
  <img src="qr-guide.svg" alt="안내서 웹 주소 QR"><div>휴대폰으로 열기</div>
</div>
{foot(f"{SCHOOL['addr']}", f"{META['updated']} · AI교육 코디네이터 박진영")}
</section>"""


def toc():
    out = [f'<section class="slide"><div class="bar"></div>{wm()}',
           '<div class="head" style="margin-left:0"><h1>무엇을 하시려고요?</h1>',
           '<div class="r"><div class="when">하시려는 일을 찾아 그 쪽만 보시면 됩니다.<br>'
           '필요한 쪽만 뽑아 인쇄하셔도 됩니다.</div></div></div>']
    if META.get("tip"):
        out.append(f'<div class="tip"><b>도구가 안 보이실 때</b>{META["tip"]}</div>')
    for g in GROUPS:
        items = [t for t in TASKS if t["group"] == g["id"]]
        out.append(f'<div class="gsec"><h2><span class="tag {g["color"]}">{g["label"]}</span>'
                   f'<span style="font-size:11.5pt;color:var(--mute);font-weight:400">{g["sub"]}</span></h2>'
                   '<div class="cards">')
        for t in items:
            out.append(f'<div class="card {"warm" if g["id"]=="class" else ""}">'
                       f'<div class="n">{t["no"]}</div><div class="t">{t["title"]}</div>'
                       f'<div class="w">{t["when"]}</div></div>')
        out.append('</div></div>')
    out.append(foot("노안중학교 AI 안내서", f"모두 {len(TASKS)}가지 · {META['site']}"))
    out.append('</section>')
    return "".join(out)


def shot(t):
    """캡처가 있으면 오른쪽 칸을 만들고, 없으면 빈 문자열을 준다.

    없는 캡처를 점선 자리로 채우지 않는다 — 파일명은 선생님께 보일 것이 아니다.
    파일이 assets/guide/ 에 들어오는 순간 저절로 다시 살아난다.
    """
    if not t.get("shot"):
        return ""
    for base in ("../assets/guide", "shots"):
        p = pathlib.Path(base) / t["shot"]
        if p.exists():
            marks = "".join(
                f'<div class="mark" style="left:{l}%;top:{tp}%;width:{w}%;height:{h}%">'
                f'{f"<span>{lb}</span>" if lb else ""}</div>'
                for l, tp, w, h, lb in t.get("marks", []))
            src = p.as_posix()
            return f'<div class="shotwrap"><img src="{src}" alt="{t["title"]} 화면">{marks}</div>'
    return ""


def card(t, i, n):
    g = GMAP[t["group"]]
    parts = list(t["path"])
    seq = " &gt; ".join(parts[:-1] + [f'<b>{parts[-1]}</b>'])
    left = [f'<div class="path">[ {seq} ]</div>' if False else '']
    left.append('<ol class="st">' + "".join(f'<li>{s}</li>' for s in t["steps"]) + '</ol>')
    if t.get("prompt"):
        pr = t["prompt"].replace("\n", "\n")
        left.append(f'<div class="pr"><span class="lab">그대로 붙여넣으세요</span><pre>{pr}</pre></div>')
    if t.get("prompt_note"):
        left.append(f'<div class="prnote">{t["prompt_note"]}</div>')
    left.append(f'<div class="cau">{t["caution"]}</div>')
    sh = shot(t)
    right = f'<div class="right">{sh}</div>' if sh else ''
    mn = t.get("min") or [0, 0]
    mins = (f'<div class="mins">보통 <b>{mn[0]}분</b> 걸리던 일이 <b>{mn[1]}분</b> 쯤으로 줄어듭니다. '
            f'<span style="font-size:9.5pt">— 초기 추정입니다. 해보시고 알려주세요.</span></div>') if mn[0] else ''
    return (f'<section class="slide"><div class="bar"></div>{wm()}'
            f'<div class="bignum">{t["no"]}</div>'
            f'<div class="head"><h1>{t["title"]}</h1><div class="r">'
            f'<span class="tag {g["color"]}">{g["label"]}</span>'
            f'<div class="when">{t["when"]}</div></div></div>'
            f'<div class="path">[ {seq} ]</div>'
            f'<div class="body"><div class="left">{"".join(left)}{mins}</div>'
            f'{right}</div>'
            + foot(f'{t["tool"]} · 노안중학교 AI 안내서', f'{i} / {n} · {META["updated"]}')
            + '</section>')


def main():
    n = len(TASKS) + 2
    body = cover() + toc() + "".join(card(t, i + 3, n) for i, t in enumerate(TASKS))
    doc = ('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'
           f'<title>{SCHOOL["name"]} AI 안내서</title><style>{CSS}</style></head>'
           f'<body>{body}</body></html>')
    pathlib.Path("guide-print.html").write_text(doc, encoding="utf-8")
    print(f"표지1 + 목차1 + 카드{len(TASKS)} = {n}장 → guide-print.html")


if __name__ == "__main__":
    main()
