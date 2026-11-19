# tools/snap-spacing.py — CSS 의 padding·margin·gap 의 px 값을 4px 눈금으로 맞춘다(반올림, 딱 중간이면 8의 배수 쪽).
# 새 CSS 를 쓴 뒤 한 번 돌리면 간격 리듬이 흐트러지지 않는다:  python tools/snap-spacing.py
# 1·2px(가는 선) 은 건드리지 않는다. deck.css(연수 슬라이드)와 vendor/ 는 대상이 아니다.
# snap padding/margin/gap px values to a 4px grid (ties -> nearest multiple of 8)
import re, io, sys
ROOT=r"C:\Users\User\Downloads\noan-ai\\"
FILES=["shared/tokens.css","shared/site.css","shared/portal.css","shared/portal-pages.css","shared/app.css","shared/premium.css",
       "guide/guide.css","guide/home-alpine.css","iamodu/iamodu.css","ai/ai.css","terms/terms.css","how-ai-answers/how.css"]
PROP=re.compile(r'(?<![-\w])((?:padding|margin)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?|gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)(\s*:\s*)([^;}{]+)')
def snap(v):
    if v < 3: return v
    lo=(v//4)*4; hi=lo+4
    if v-lo < hi-v: return lo
    if v-lo > hi-v: return hi
    return lo if lo%8==0 else hi
def fix_val(val):
    def r(m):
        sign=m.group(1) or ''; num=float(m.group(2))
        if num!=int(num): n=int(round(num))
        else: n=int(num)
        s=snap(n)
        return sign+str(s)+'px'
    return re.sub(r'(-?)(\d+(?:\.\d+)?)px', lambda m: (m.group(1) or '')+str(snap(int(round(float(m.group(2))))))+'px', val)
tot=0
for f in FILES:
    p=ROOT+f; s=io.open(p,encoding='utf8',newline='').read()
    n=[0]
    def rep(m):
        new=fix_val(m.group(3))
        if new!=m.group(3): n[0]+=1
        return m.group(1)+m.group(2)+new
    out=PROP.sub(rep,s)
    if out!=s: io.open(p,'w',encoding='utf8',newline='').write(out)
    print(f,n[0]); tot+=n[0]
print('total',tot)
