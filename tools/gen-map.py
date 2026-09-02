# -*- coding: utf-8 -*-
import math

CX, CY = 560, 380
RING = 260

# (name, icon, jne, desc, use)
cats = [
    ("대화·글쓰기", [
        ("ChatGPT","openai",0,"범용. 개인 계정 필요, 학생 정보 입력 금지",
         "범용으로 쓴다. 단, 개인 계정으로만 쓰고 학생 정보는 입력하지 않는다"),
        ("Gemini","googlegemini",0,"구글 계정으로 바로. 공문 요약, 수업자료 초안, 긴 문서 질문",
         "구글 계정으로 바로 열어 공문을 요약하고, 수업자료 초안을 잡고, 긴 문서에 질문한다"),
        ("Claude","anthropic",0,"긴 글. 개인 계정",
         "긴 글을 쓸 때 개인 계정으로 쓴다"),
        ("Copilot","microsoftcopilot",0,"",""),
        ("Perplexity","perplexity",0,"",""),
        ("뤼튼","wrtn",0,"",""),
        ("클로바X","clovax",0,"",""),
    ]),
    ("이미지·디자인", [
        ("미리캔버스","miricanvas",1,"교직원 무료 Pro. 통신문·팜플렛·발표자료. AI 라이팅·AI 이미지 포함",
         "가정통신문·팜플렛·발표자료를 템플릿으로 만든다. AI 라이팅·AI 이미지도 쓸 수 있다"),
        ("캔바","canva",0,"",""),
        ("Adobe Firefly","adobe",0,"",""),
        ("DALL·E","dalle",0,"",""),
        ("Midjourney","midjourney",0,"",""),
    ]),
    ("영상", [
        ("브루","vrew",0,"영상 자막 자동. 글자 지우면 영상 잘림. 무료",
         "영상에 자막을 자동으로 넣는다. 자막 글자를 지우면 영상도 함께 잘리니 주의한다"),
        ("CapCut","capcut",0,"",""),
        ("Runway","runway",0,"",""),
        ("Sora","sora",0,"",""),
    ]),
    ("음성·회의", [
        ("클로바노트","clovanote",0,"회의·상담 녹음 → 글 → 요약. 무료",
         "회의나 상담을 녹음하면 글로 바꾸고 요약까지 해준다"),
        ("클로바더빙","clovadubbing",0,"",""),
        ("ElevenLabs","elevenlabs",0,"",""),
        ("타입캐스트","typecast",0,"",""),
    ]),
    ("문서·자료", [
        ("Gemini","googlegemini",1,"구글 계정으로 바로. 공문 요약, 수업자료 초안, 긴 문서 질문",
         "구글 계정으로 바로 열어 공문을 요약하고, 수업자료 초안을 잡고, 긴 문서에 질문한다"),
        ("NotebookLM","notebooklm",0,"",""),
        ("Gamma","gamma",0,"",""),
        ("미리캔버스 AI프레젠테이션","miricanvas",1,"교직원 무료 Pro. 통신문·팜플렛·발표자료. AI 라이팅·AI 이미지 포함",
         "가정통신문·팜플렛·발표자료를 템플릿으로 만든다. AI 라이팅·AI 이미지도 쓸 수 있다"),
    ]),
    ("수업·학급", [
        ("아이모두","imodu",1,"Google Workspace for Education Plus. 클래스룸+Gemini+연습세트",
         "클래스룸·Gemini·연습세트가 묶인 교육용 구글 워크스페이스로 쓴다"),
        ("구글 클래스룸","googleclassroom",1,"과제 배부·수합, 유튜브 양방향 퀴즈",
         "과제를 배부하고 수합하며, 유튜브로 양방향 퀴즈를 만든다"),
        ("클래스이음","classeum",1,"Microsoft 365. 웹 오피스, OneDrive, Teams",
         "웹 오피스, OneDrive, Teams가 포함된 Microsoft 365로 쓴다"),
        ("패들렛","padlet",0,"학생 의견 게시판. 학생 계정은 절차 필요",
         "학생 의견을 모으는 게시판으로 쓴다. 학생 계정 개설에는 절차가 필요하다"),
        ("띵커벨","thinkerbell",0,"국산 퀴즈·보드",
         "국산 퀴즈·보드 도구로 쓴다"),
        ("멘티미터","mentimeter",0,"",""),
        ("카훗","kahoot",0,"",""),
        ("클래스팅","classting",0,"",""),
    ]),
    ("코딩·만들기", [
        ("엔트리","entry",0,"블록코딩. 교육부 AI 수업 표준",
         "블록코딩 수업에 쓴다. 교육부 AI 수업 표준 도구다"),
        ("티처블머신","teachablemachine",0,"코딩 없이 이미지 분류 AI 만들기",
         "코딩 없이 이미지 분류 AI를 학생들과 함께 만든다"),
        ("Scratch","scratch",0,"",""),
        ("Claude Code","claudecode",0,"",""),
        ("Cursor","cursor",0,"",""),
    ]),
]

# manual line-split for names > 8 chars
SPLIT = {
    "Perplexity": ("Perplex","ity"),
    "Adobe Firefly": ("Adobe","Firefly"),
    "Midjourney": ("Mid","journey"),
    "ElevenLabs": ("Eleven","Labs"),
    "NotebookLM": ("Notebook","LM"),
    "미리캔버스 AI프레젠테이션": ("미리캔버스","AI프레젠테이션"),
    "Claude Code": ("Claude","Code"),
}

def esc(s):
    return (s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
             .replace('"',"&quot;"))

n_cat = len(cats)
step = 360.0 / n_cat

out = []
out.append('<section class="slide slide-map" id="s9" data-t="12" data-title="AI 전체 지도">')
out.append('  <div class="slide-inner">')
out.append('    <svg class="aimap" viewBox="0 0 1200 760" data-zoom="0" role="img" aria-label="AI 도구 전체 지도" preserveAspectRatio="xMidYMid meet">')
out.append('      <g class="zoomer">')

all_nodes = []

for i,(cat_name, nodes) in enumerate(cats):
    theta_deg = -90 + step*i
    theta = math.radians(theta_deg)
    cat_cx = CX + RING*math.cos(theta)
    cat_cy = CY + RING*math.sin(theta)

    n = len(nodes)
    R = 78 if n>=7 else 60
    gap = 15
    label_radius = RING + R + gap
    label_x = round(CX + label_radius*math.cos(theta),1)
    label_y = round(CY + label_radius*math.sin(theta),1)

    out.append('        <g class="cat" data-cat="' + esc(cat_name) + '">')
    out.append('          <text class="cat-label" x="' + str(label_x) + '" y="' + str(label_y) + '" text-anchor="middle">' + esc(cat_name) + '</text>')

    start = -90 + (i*7)
    for j,(name,icon,jne,desc,use) in enumerate(nodes):
        a = math.radians(start + (360.0/n)*j)
        nx = round(cat_cx + R*math.cos(a),1)
        ny = round(cat_cy + R*math.sin(a),1)
        all_nodes.append((cat_name,name,nx,ny))

        jne_attr = ' data-jne="1"' if jne==1 else ''
        desc_attr = ' data-desc="' + esc(desc) + '"'
        use_attr = ' data-use="' + esc(use) + '"'

        ico_x = round(nx-13,1)
        ico_y = round(ny-13,1)
        label_ty = round(ny+44,1)

        out.append('          <g class="node" data-cat="' + esc(cat_name) + '"' + jne_attr + ' data-name="' + esc(name) + '"' + desc_attr + use_attr + ' tabindex="0" role="button" aria-label="' + esc(name) + '">')
        out.append('            <circle cx="' + str(nx) + '" cy="' + str(ny) + '" r="26" class="node-bg"/>')
        out.append('            <g class="node-ico" data-icon="' + esc(icon) + '" data-icon-size="26" transform="translate(' + str(ico_x) + ',' + str(ico_y) + ')"></g>')
        if name in SPLIT:
            l1,l2 = SPLIT[name]
            out.append('            <text class="node-label" x="' + str(nx) + '" y="' + str(label_ty) + '" text-anchor="middle">' + esc(l1) + '<tspan x="' + str(nx) + '" dy="16">' + esc(l2) + '</tspan></text>')
        else:
            out.append('            <text class="node-label" x="' + str(nx) + '" y="' + str(label_ty) + '" text-anchor="middle">' + esc(name) + '</text>')
        out.append('          </g>')

    out.append('        </g>')

out.append('      </g>')
out.append('    </svg>')
out.append('    <div class="map-panel" id="mapPanel" aria-live="polite">')
out.append('      <p class="panel-title">AI 도구 전체 지도</p>')
out.append('      <p class="panel-desc">Z 키로 확대합니다. 노드에 마우스를 올리면 여기에 설명이 뜹니다.</p>')
out.append('    </div>')
out.append('  </div>')
out.append('  <aside class="notes">')
out.append('    <p>Z키로 0→1→2. 줌 0에서 10초 "이렇게 많습니다", 줌 1에서 "이 중 다섯 개는 이미 갖고 계십니다", 줌 2는 다음 장면으로 넘어가는 다리.</p>')
out.append('  </aside>')
out.append('</section>')

html = "\n".join(out) + "\n"

OUT_PATH = "C:/Users/User/dev/noan-ai/tools/map-fragment.html"
with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
    f.write(html)

print("WROTE", OUT_PATH)
print("TOTAL NODES:", len(all_nodes))
jne_count = sum(1 for _,nodes in cats for (name,icon,jne,desc,use) in nodes if jne==1)
print("JNE COUNT:", jne_count)

bad_bounds = [n for n in all_nodes if not (40 <= n[2] <= 1080 and 40 <= n[3] <= 720)]
print("OUT OF BOUNDS:", len(bad_bounds))
for b in bad_bounds: print("  ", b)

import math as _m
overlaps = []
for i in range(len(all_nodes)):
    for j in range(i+1, len(all_nodes)):
        c1,n1,x1,y1 = all_nodes[i]
        c2,n2,x2,y2 = all_nodes[j]
        d = _m.hypot(x1-x2, y1-y2)
        if d < 56:
            overlaps.append((n1,n2,round(d,1)))
print("OVERLAP PAIRS (<56):", len(overlaps))
for o in overlaps: print("  ", o)
