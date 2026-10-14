"""Stages 7 (vectorize) and 6b (label layer) of the anatomy pipeline.

usage: python3 trace_and_label.py <image> <anchors.json> <out.svg>

anchors.json: [{"id": "scapula", "label": "Scapula", "x": 0.31, "y": 0.42}, ...]  (normalised 0..1)
"""
import json, sys, re
import cv2, numpy as np, vtracer

src, anchors_path, out = sys.argv[1:4]
img = cv2.imread(src)
H, W = img.shape[:2]

# --- 7. clean + trace -------------------------------------------------------
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
g = cv2.fastNlMeansDenoising(g, None, 7, 7, 21)
# keep greys (hatching) but push paper to pure white so the tracer ignores it
# adaptive threshold keeps thin grey hatching lines that a global 128 cut would drop
g = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 12)
g = cv2.morphologyEx(g, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))  # drop 1px speckle
clean = "clean.png"
cv2.imwrite(clean, g)
vtracer.convert_image_to_svg_py(
    clean, "drawing.svg",
    colormode="binary", hierarchical="stacked", mode="spline",
    filter_speckle=4, corner_threshold=60, length_threshold=4.0,
    splice_threshold=45, path_precision=3,
)
drawing = open("drawing.svg").read()
inner = re.search(r"<svg[^>]*>(.*)</svg>", drawing, re.S).group(1)

# --- 6b. label layout --------------------------------------------------------
anchors = json.load(open(anchors_path))
margin = int(W * 0.22)            # label columns outside the drawing
fs = max(12, int(W * 0.018))      # font size
line_gap = int(fs * 1.5)
left = [a for a in anchors if a["x"] < 0.5]
right = [a for a in anchors if a["x"] >= 0.5]

def column(items, x_text, anchor_side):
    items = sorted(items, key=lambda a: a["y"])
    ys, last = [], -1e9
    for a in items:                              # greedy: push down to avoid overlap
        y = max(a["y"] * H, last + line_gap)
        ys.append(y); last = y
    # centre the stack vertically if it overflowed
    shift = min(0, H - fs - ys[-1]) if ys else 0
    out = []
    for a, y in zip(items, ys):
        y += shift
        ax, ay = a["x"] * W + margin, a["y"] * H
        out.append(
            f'<circle cx="{ax:.1f}" cy="{ay:.1f}" r="{fs*0.22:.1f}" fill="#c0392b"/>'
            f'<path d="M{ax:.1f},{ay:.1f} L{x_text + (fs*0.6 if anchor_side=="left" else -fs*0.6):.1f},{y:.1f}" '
            f'stroke="#c0392b" stroke-width="{max(1, fs*0.08):.1f}" fill="none"/>'
            f'<text x="{x_text:.1f}" y="{y + fs*0.35:.1f}" font-size="{fs}" '
            f'font-family="Georgia, serif" text-anchor="{"end" if anchor_side=="left" else "start"}" fill="#222">{a["label"]}</text>'
        )
    return "\n".join(out)

labels = column(left, margin - fs * 0.8, "left") + "\n" + column(right, W + margin + fs * 0.8, "right")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W + 2*margin} {H}" width="{W + 2*margin}" height="{H}">
<rect width="100%" height="100%" fill="#fff"/>
<g id="drawing" transform="translate({margin},0)">{inner}</g>
<g id="labels">
{labels}
</g>
</svg>'''
open(out, "w").write(svg)
paths = inner.count("<path")
print(f"traced {paths} paths; {len(anchors)} labels; wrote {out}")
