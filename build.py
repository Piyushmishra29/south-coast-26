#!/usr/bin/env python3
"""Assemble index.html from section fragments."""
import glob, os, re

W = os.path.expanduser("~/bkas-site/web")

frags = sorted(glob.glob(f"{W}/sections/*.html"))
css = ["css/base.css"] + [f"css/{os.path.basename(p)}" for p in sorted(glob.glob(f"{W}/css/0*.css"))]
js = ["js/site.js"] + [f"js/{os.path.basename(p)}" for p in sorted(glob.glob(f"{W}/js/0*.js"))]

body_parts, footer = [], ""
for p in frags:
    html = open(p).read()
    if "<!-- FOOTER -->" in html:
        pre, _, post = html.partition("<!-- FOOTER -->")
        body_parts.append(pre)
        footer = post
    else:
        body_parts.append(html)

links = "\n".join(f'  <link rel="stylesheet" href="{c}">' for c in css)
scripts = "\n".join(f'<script src="{j}" defer></script>' for j in js)

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>South Coast '26 — Bro Knows A Spot</title>
  <meta name="description" content="Eight days down Sri Lanka's golden strip. Ahangama to Hiriketiya, four villas, twenty-one seats. 1–8 September 2026. Worth the detour.">
  <link rel="icon" href="assets/brand/sunburst-star-icon-ink.svg" type="image/svg+xml">
  <meta property="og:title" content="South Coast '26 — Bro Knows A Spot">
  <meta property="og:description" content="Eight days. Four spots. Twenty-one seats. Worth the detour.">
  <meta property="og:image" content="assets/img/hero.jpg">
{links}
</head>
<body>
{os.linesep.join(body_parts)}
{footer}
{scripts}
</body>
</html>
"""
open(f"{W}/index.html", "w").write(page)
print(f"index.html assembled: {len(frags)} fragments, {len(css)} css, {len(js)} js")
for f in frags: print("  •", os.path.basename(f))
