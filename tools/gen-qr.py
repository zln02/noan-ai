#!/usr/bin/env python3
"""assets/qr-*.svg 생성. 주소가 바뀌면 URLS 만 고치고 다시 돌린다.

주소는 추측하지 말고 아래로 확인한 값을 쓴다.
    gh api repos/zln02/noan-ai/pages --jq '.html_url'
"""
import re
import qrcode
import qrcode.image.svg

URLS = {
    "assets/qr-site.svg":    "https://zln02.github.io/noan-ai/",
    "assets/qr-request.svg": "https://zln02.github.io/noan-ai/request/",
}


def make(path: str, url: str) -> None:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image().save(path)

    # width/height 가 mm 단위로 박혀 나온다. CSS 로 크기를 잡으려면 지우고
    # viewBox 만 남겨야 한다.
    svg = open(path, encoding="utf-8").read()
    svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
    if "viewBox" not in svg:
        raise SystemExit(f"{path}: viewBox 가 없다 — 라이브러리 버전 확인")
    open(path, "w", encoding="utf-8").write(svg)
    print("생성", path, "<-", url)


for p, u in URLS.items():
    make(p, u)
