"""Generates the academic-figure covers for Program sessions (fixed seeds). Run: python3 source/scripts/diagrams.py source/shared/diagrams"""
import math, random, sys, os
OUT = sys.argv[1]
W, H = 1600, 1000
def svg(name, bg, body, font="Helvetica, Arial, sans-serif"):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{font}">\n<rect width="{W}" height="{H}" fill="{bg}"/>\n{body}\n</svg>\n'
    open(os.path.join(OUT, name + ".svg"), "w").write(s)
    print(name, len(s)//1024, "KB")
f = lambda v: f"{v:.1f}"

# 1. Network graph (community moderation): clustered communities, dark journal-figure style
def network():
    r = random.Random(3)
    cols = ["#f4a261", "#2a9d8f", "#e76f51", "#8ab17d", "#9d8df1", "#e9c46a"]
    centers = [(380, 300), (760, 220), (1180, 330), (1360, 690), (930, 640), (520, 700)]
    nodes = []
    for c, (cx, cy) in enumerate(centers):
        for _ in range(26):
            a, d = r.uniform(0, 6.28), abs(r.gauss(0, 95))
            nodes.append((cx + math.cos(a) * d, cy + math.sin(a) * d * .8, c, r.uniform(4, 13)))
    edges = []
    for i, a in enumerate(nodes):
        for j, b in enumerate(nodes[:i]):
            dist = math.hypot(a[0]-b[0], a[1]-b[1])
            p = (0.09 if a[2] == b[2] else 0.0045) * (1 if dist < 260 else .3 if a[2] == b[2] else .6)
            if r.random() < p: edges.append((a, b, a[2] == b[2]))
    body = ['<g stroke-linecap="round">']
    for a, b, same in edges:
        body.append(f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}" stroke="{cols[a[2]] if same else "#cfd8e3"}" stroke-opacity="{.35 if same else .14}" stroke-width="{1.4 if same else 1}"/>')
    body.append('</g><g stroke="#0f1724" stroke-width="2">')
    for x, y, c, s in nodes:
        body.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(s)}" fill="{cols[c]}"/>')
    body.append('</g>')
    body.append('<g fill="#cfd8e3" font-size="22" opacity=".7"><text x="1500" y="70" text-anchor="end">modularity Q = 0.61 · n = 156</text></g>')
    svg("network", "#0f1724", "\n".join(body))

# 2. Swimlane flowchart (clinical handoffs): clean white process diagram
def swimlane():
    lanes = ["Nurse", "Physician", "Patient", "Record"]
    lh = 210; top = 80
    body = ['<g font-size="24" fill="#23395b">']
    for i, name in enumerate(lanes):
        y = top + i * lh
        body.append(f'<rect x="40" y="{y}" width="1520" height="{lh}" fill="{"#f3f6fa" if i % 2 == 0 else "#ffffff"}" stroke="#c9d3e0"/>')
        body.append(f'<rect x="40" y="{y}" width="56" height="{lh}" fill="#23395b"/>')
        body.append(f'<text transform="translate(76 {y + lh/2}) rotate(-90)" text-anchor="middle" fill="#fff" font-weight="700">{name}</text>')
    steps = [(0, 160, "Assess"), (1, 360, "Review chart"), (0, 560, "Shift change"), (3, 560, "Log vitals"), (2, 760, "Ask question"), (0, 960, "Brief"), (1, 1160, "Decide"), (3, 1160, "Update plan"), (2, 1360, "Consent")]
    pos = {}
    for k, (lane, x, label) in enumerate(steps):
        y = top + lane * lh + lh / 2
        pos[k] = (x, y)
        shape = f'<rect x="{x}" y="{y-40}" width="170" height="80" rx="10" fill="#fff" stroke="#3d7ea6" stroke-width="3"/>' if label not in ("Decide", "Shift change") else \
                f'<polygon points="{x+85},{y-55} {x+170},{y} {x+85},{y+55} {x},{y}" fill="#fff4e0" stroke="#e08e2b" stroke-width="3"/>'
        body.append(shape)
        body.append(f'<text x="{x+85}" y="{y+8}" text-anchor="middle" font-size="21">{label}</text>')
    links = [(0, 1), (1, 2), (2, 3), (2, 4), (4, 5), (3, 5), (5, 6), (6, 7), (6, 8)]
    body.append('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#3d7ea6"/></marker></defs>')
    for a, b in links:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        sx, ex = x1 + 170, x2
        if abs(x1 - x2) < 5: sx, ex = x1 + 85, x2 + 85
        mx = (sx + ex) / 2
        d = f"M{sx} {y1} C{mx} {y1} {mx} {y2} {ex} {y2 - (40 if abs(x1-x2) < 5 and y2 > y1 else -40 if abs(x1-x2) < 5 else 0)}"
        dash = ' stroke-dasharray="8 7"' if (a, b) in ((2, 4), (3, 5)) else ''
        body.append(f'<path d="{d}" fill="none" stroke="#3d7ea6" stroke-width="3"{dash} marker-end="url(#ah)"/>')
    body.append('</g>')
    svg("swimlane", "#ffffff", "\n".join(body))

# 3. Sankey / alluvial (platform labor): flows between stages, soft print palette
def sankey():
    cols = ["#355070", "#6d597a", "#b56576", "#e56b6f", "#eaac8b"]
    stages = [[220, 180, 160, 140], [300, 200, 200], [260, 230, 210], [380, 320]]
    xs = [140, 560, 980, 1400]; nw = 36
    body = []
    def layout(stage):
        gap = 40; total = sum(stage) + gap * (len(stage) - 1); y = (H - total) / 2; out = []
        for v in stage: out.append([y, v, 0, 0]); y += v + gap
        return out
    L = [layout(s) for s in stages]
    r = random.Random(7)
    for k in range(3):
        src, dst = L[k], L[k + 1]
        flows = []
        for i, s in enumerate(src):
            rem = s[1]
            for j, d in enumerate(dst):
                if j == len(dst) - 1: v = rem
                else: v = min(rem, round(s[1] * r.uniform(.2, .55)))
                rem -= v
                if v > 0: flows.append((i, j, v))
        # scale flows into destination capacity
        for i, j, v in flows:
            s, d = src[i], dst[j]
            dv = v * d[1] / sum(fv for fi, fj, fv in flows if fj == j)
            y1, y2 = s[0] + s[2], d[0] + d[3]
            s[2] += v; d[3] += dv
            x1, x2 = xs[k] + nw, xs[k + 1]; m = (x1 + x2) / 2
            body.append(f'<path d="M{x1} {f(y1)} C{m} {f(y1)} {m} {f(y2)} {x2} {f(y2)} L{x2} {f(y2+dv)} C{m} {f(y2+dv)} {m} {f(y1+v)} {x1} {f(y1+v)} Z" fill="{cols[i % 5]}" fill-opacity=".42"/>')
    for k, stage in enumerate(L):
        for i, (y, v, _, _) in enumerate(stage):
            body.append(f'<rect x="{xs[k]}" y="{f(y)}" width="{nw}" height="{v}" fill="{cols[(i + k) % 5]}"/>')
    labels = ["Sign-up", "First gig", "Rated", "Stay / Leave"]
    for k, t in enumerate(labels):
        body.append(f'<text x="{xs[k] + nw/2}" y="60" text-anchor="middle" font-size="26" fill="#3c3a36">{t}</text>')
    svg("sankey", "#f6f1e7", "\n".join(body), font="Georgia, serif")

# 4. Hand-drawn Venn (privacy practice): sketchbook, jittered pencil strokes
def venn():
    r = random.Random(11)
    def sketch_circle(cx, cy, rad, col, passes=3):
        out = []
        for p in range(passes):
            pts = []; off = r.uniform(0, 6.28)
            for i in range(0, 74):
                a = off + i / 70 * 6.28
                rr = rad + r.gauss(0, 2.5) + p * 3
                pts.append(f"{f(cx + math.cos(a) * rr)} {f(cy + math.sin(a) * rr)}")
            out.append(f'<path d="M{" L".join(pts)}" fill="none" stroke="{col}" stroke-width="{3 - p*.7}" stroke-opacity="{.9 - p*.2}" stroke-linecap="round"/>')
        return "\n".join(out)
    body = ['<defs><pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="14" stroke="#c0504d" stroke-width="2" stroke-opacity=".45"/></pattern></defs>']
    # ruled paper lines
    for y in range(60, H, 44): body.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="#a9c4dc" stroke-opacity=".45"/>')
    body.append('<line x1="120" y1="0" x2="120" y2="1000" stroke="#e39a9a" stroke-width="2"/>')
    circles = [(640, 400, 260, "#2b4c7e", "What I share"), (960, 400, 260, "#2f7d5b", "What apps infer"), (800, 640, 260, "#7a4b8c", "What others see")]
    body.append('<circle cx="800" cy="480" r="95" fill="url(#hatch)"/>')
    for cx, cy, rad, col, label in circles:
        body.append(sketch_circle(cx, cy, rad, col))
    font = 'font-family="Comic Sans MS, Chalkboard SE, Marker Felt, cursive"'
    body.append(f'<g {font} font-size="34"><text x="430" y="150" fill="#2b4c7e">What I share</text><text x="1010" y="150" fill="#2f7d5b">What apps infer</text><text x="1080" y="930" fill="#7a4b8c">What others see</text>'
                f'<text x="800" y="490" text-anchor="middle" fill="#c0504d" font-size="30">exposure?</text></g>')
    body.append('<path d="M1240 300 q40 -60 110 -40" fill="none" stroke="#333" stroke-width="2.5"/><text x="1360" y="270" font-size="26" fill="#333" font-family="Comic Sans MS, Chalkboard SE, cursive">P7: “I never said that”</text>')
    svg("venn", "#fbf8ef", "\n".join(body))

# 5. Spectrogram + waveform (voice and sound): magma heatmap
def spectrogram():
    r = random.Random(5)
    def magma(t):
        stops = [(0, (0, 0, 4)), (.25, (81, 18, 124)), (.5, (183, 55, 121)), (.75, (252, 137, 97)), (1, (252, 253, 191))]
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if t <= b:
                u = (t - a) / (b - a); return "#%02x%02x%02x" % tuple(int(ca[k] + (cb[k] - ca[k]) * u) for k in range(3))
        return "#fcfdbf"
    cols, rows = 80, 40; cw, ch = W / cols, 720 / rows
    body = []
    grid = []
    for i in range(cols):
        voiced = math.sin(i / 7) > -.3
        f0 = 6 + 2 * math.sin(i / 11)
        col = []
        for j in range(rows):
            v = r.random() * .18
            if voiced:
                for hmn in range(1, 7):
                    v += math.exp(-((j - f0 * hmn) ** 2) / 2.2) * (1 - hmn * .12)
            v += .25 * math.exp(-((j - 40) ** 2) / 30) * (r.random() if not voiced else .2)
            col.append(round(max(0, min(1, v)) * 9) / 9)
        grid.append(col)
    # Quantized levels; neighbouring cells of one level in a row merge into one rect.
    for j in range(rows):
        i = 0
        while i < cols:
            k = i
            while k + 1 < cols and grid[k + 1][j] == grid[i][j]: k += 1
            body.append(f'<rect x="{round(i*cw)}" y="{round(1000 - (j+1)*ch)}" width="{round((k-i+1)*cw)+1}" height="{round(ch)+1}" fill="{magma(grid[i][j])}"/>')
            i = k + 1
    pts = []
    for x in range(0, W + 1, 4):
        env = 70 * (0.3 + 0.7 * max(0, math.sin(x / 7 / cw)))
        pts.append(f"{x} {f(140 + env * math.sin(x / 3.1) * (0.6 + 0.4 * r.random()))}")
    body.append(f'<path d="M{" L".join(pts)}" fill="none" stroke="#fcd9a8" stroke-width="2"/>')
    body.append('<line x1="0" y1="280" x2="1600" y2="280" stroke="#fcfdbf" stroke-opacity=".3"/>')
    svg("spectrogram", "#07040f", "\n".join(body))

# 6. Topographic contour map with flood zone (climate adaptation): blueprint
def contour():
    def h(x, y):
        return (math.sin(x / 210) * math.cos(y / 170) * 1.1 + math.sin((x + y) / 330) * .9 + math.cos(x / 95 - y / 140) * .35 + (y / 1000) * -.8)
    step = 16; gx, gy = W // step + 1, H // step + 1
    grid = [[h(i * step, j * step) for i in range(gx)] for j in range(gy)]
    body = []
    for x in range(0, W, 80): body.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}" stroke="#ffffff" stroke-opacity=".08"/>')
    for y in range(0, H, 80): body.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="#ffffff" stroke-opacity=".08"/>')
    # flood zone cells
    cells = []
    for j in range(gy - 1):
        for i in range(gx - 1):
            if grid[j][i] < -1.0: cells.append(f'M{i*step} {j*step}h{step}v{step}h-{step}z')
    # Blur then re-threshold the cell mask so the flood edge is smooth, not stair-stepped.
    body.append('<defs><filter id="smooth" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="9"/><feComponentTransfer><feFuncA type="linear" slope="6" intercept="-2.5"/></feComponentTransfer></filter></defs>')
    body.append(f'<g filter="url(#smooth)" opacity=".3"><path d="{"".join(cells)}" fill="#5fd3f3"/></g>')
    # marching squares
    def iso(level):
        segs = []
        for j in range(gy - 1):
            for i in range(gx - 1):
                c = [grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]]
                p = [(i, j), (i+1, j), (i+1, j+1), (i, j+1)]
                cross = []
                for k in range(4):
                    a, b = c[k], c[(k+1) % 4]
                    if (a < level) != (b < level):
                        t = (level - a) / (b - a); (x1, y1), (x2, y2) = p[k], p[(k+1) % 4]
                        cross.append(((x1 + (x2-x1)*t) * step, (y1 + (y2-y1)*t) * step))
                for k in range(0, len(cross) - 1, 2):
                    (a1, b1), (a2, b2) = cross[k], cross[k+1]
                    segs.append(f"M{f(a1)} {f(b1)}L{f(a2)} {f(b2)}")
        return "".join(segs)
    for n, level in enumerate([x / 4 for x in range(-10, 11)]):
        major = n % 4 == 0
        body.append(f'<path d="{iso(level)}" fill="none" stroke="#e8f4ff" stroke-opacity="{.85 if major else .4}" stroke-width="{2.2 if major else 1.1}"/>')
    for x, y in [(330, 260), (1180, 380), (760, 720), (1420, 820)]:
        body.append(f'<g stroke="#ffd166" stroke-width="3" fill="none"><circle cx="{x}" cy="{y}" r="14"/><line x1="{x-24}" y1="{y}" x2="{x+24}" y2="{y}"/><line x1="{x}" y1="{y-24}" x2="{x}" y2="{y+24}"/></g>')
    body.append('<g fill="#e8f4ff" font-size="22" font-family="Courier New, monospace"><text x="1540" y="60" text-anchor="end">FLOOD EXTENT · 1:25,000</text></g>')
    svg("contour", "#13406b", "\n".join(body))

# 7. Week × hour heatmap with small multiples (wellbeing): data-dashboard style
def heatmap():
    r = random.Random(9)
    pal = ["#f3eefa", "#dccdf0", "#bfa6e3", "#9b77d2", "#7448b8", "#4d2a8a"]
    body = []
    x0, y0, cs = 220, 90, 46
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for d in range(7):
        body.append(f'<text x="{x0-20}" y="{y0 + d*(cs+8) + cs*.68}" text-anchor="end" font-size="22" fill="#5a5466">{days[d]}</text>')
        for hr in range(24):
            work = 1 if d < 5 and 9 <= hr <= 18 else 0
            late = 1 if hr >= 22 or hr <= 1 else 0
            v = work * r.uniform(.5, 1) + late * r.uniform(.3, .9) * (1.3 if d in (0, 3) else .6) + r.random() * .25
            idx = min(5, int(v * 5))
            body.append(f'<rect x="{x0 + hr*(cs+6)}" y="{y0 + d*(cs+8)}" width="{cs}" height="{cs}" rx="6" fill="{pal[idx]}"/>')
    for hr in range(0, 24, 3):
        body.append(f'<text x="{x0 + hr*(cs+6) + cs/2}" y="{y0 - 22}" text-anchor="middle" font-size="20" fill="#5a5466">{hr:02d}:00</text>')
    # small line chart below
    base, top = 960, 560
    body.append(f'<line x1="{x0}" y1="{base}" x2="1560" y2="{base}" stroke="#bdb6c9" stroke-width="2"/>')
    for k, col in enumerate(["#7448b8", "#e07a5f"]):
        pts = []
        for i in range(60):
            x = x0 + i * (1340 / 59)
            y = base - 60 - 120 * (0.5 + 0.4 * math.sin(i / 6 + k * 2)) - r.uniform(0, 30) - (k * i * 1.2)
            pts.append(f"{f(x)} {f(max(top, y))}")
        body.append(f'<path d="M{" L".join(pts)}" fill="none" stroke="{col}" stroke-width="4" stroke-linejoin="round"/>')
    svg("heatmap", "#fdfcff", "\n".join(body))

# 8. 2×2 matrix scatter with error bars (methods and power): monochrome LaTeX-paper style
def matrix():
    r = random.Random(2)
    body = []
    ox, oy, w, hgt = 160, 80, 1340, 840
    body.append(f'<rect x="{ox}" y="{oy}" width="{w}" height="{hgt}" fill="none" stroke="#111" stroke-width="2.5"/>')
    body.append(f'<line x1="{ox + w/2}" y1="{oy}" x2="{ox + w/2}" y2="{oy+hgt}" stroke="#111" stroke-dasharray="10 8" stroke-width="2"/>')
    body.append(f'<line x1="{ox}" y1="{oy + hgt/2}" x2="{ox+w}" y2="{oy + hgt/2}" stroke="#111" stroke-dasharray="10 8" stroke-width="2"/>')
    for t in range(0, 11):
        x = ox + t * w / 10; y = oy + t * hgt / 10
        body.append(f'<line x1="{x}" y1="{oy+hgt}" x2="{x}" y2="{oy+hgt-12}" stroke="#111" stroke-width="2"/><line x1="{ox}" y1="{y}" x2="{ox+12}" y2="{y}" stroke="#111" stroke-width="2"/>')
    quads = [("Consulted", .25, .22), ("Co-owned", .75, .22), ("Extracted", .25, .78), ("Tokenized", .75, .78)]
    for name, qx, qy in quads:
        body.append(f'<text x="{ox + qx*w}" y="{oy + qy*hgt - 150}" text-anchor="middle" font-size="30" font-style="italic" fill="#111">{name}</text>')
    shapes = ["circle", "square", "triangle"]
    for k in range(34):
        x = ox + r.uniform(.06, .94) * w; y = oy + r.uniform(.08, .94) * hgt
        e = r.uniform(18, 60)
        body.append(f'<line x1="{f(x)}" y1="{f(y-e)}" x2="{f(x)}" y2="{f(y+e)}" stroke="#111" stroke-width="1.6"/><line x1="{f(x-8)}" y1="{f(y-e)}" x2="{f(x+8)}" y2="{f(y-e)}" stroke="#111" stroke-width="1.6"/><line x1="{f(x-8)}" y1="{f(y+e)}" x2="{f(x+8)}" y2="{f(y+e)}" stroke="#111" stroke-width="1.6"/>')
        s = shapes[k % 3]
        if s == "circle": body.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="11" fill="#fff" stroke="#111" stroke-width="2.5"/>')
        elif s == "square": body.append(f'<rect x="{f(x-10)}" y="{f(y-10)}" width="20" height="20" fill="#111"/>')
        else: body.append(f'<polygon points="{f(x)},{f(y-13)} {f(x+12)},{f(y+9)} {f(x-12)},{f(y+9)}" fill="#888" stroke="#111" stroke-width="2"/>')
    body.append(f'<text x="{ox + w/2}" y="{oy+hgt+60}" text-anchor="middle" font-size="28" fill="#111">participant control over agenda →</text>')
    body.append(f'<text transform="translate({ox-60} {oy + hgt/2}) rotate(-90)" text-anchor="middle" font-size="28" fill="#111">benefit returned to community →</text>')
    svg("matrix", "#ffffff", "\n".join(body), font="'Times New Roman', Times, serif")

for fn in (network, swimlane, sankey, venn, spectrogram, contour, heatmap, matrix): fn()
