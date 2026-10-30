"""Favicon, iconos de la app e imagen para redes a partir del rayo plano.

El dibujo sale de `src/components/BoltMascot.jsx` (silueta, cantos y la cara
tranquila), así que los iconos y el componente no se pueden separar: si cambia
el SVG, basta con volver a ejecutar esto. Sin dependencias aparte de Pillow:
dibuja el SVG a 8x y lo reduce (suavizado).

Uso (desde la raíz del proyecto):
  python design/mascota/iconos.py public
"""
import math
import os
import re
import sys

from PIL import Image, ImageChops, ImageDraw

PUBLIC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = open(os.path.join(ROOT, "src", "components", "BoltMascot.jsx"), encoding="utf-8").read()

# Colores del tema claro (los mismos que usa el componente).
GOLD = (217, 169, 46)  # secondary.main  #D9A92E
SHADE = (184, 137, 26)  # secondary.dark  #B8891A
INK = (31, 42, 60)  # primary          #1F2A3C
BLUSH = (242, 167, 160)  # mofletes        #F2A7A0
NAVY = INK  # fondo de los iconos de la app (theme_color)
OG_BG = (22, 26, 32)  # fondo de la imagen para redes
VIEW = (64, 66)  # viewBox del SVG
K = 8  # sobremuestreo


def constant(name):
    """Une las cadenas de `const NAME = "..." + "...";` del componente."""
    block = re.search(rf"const {name} =(.*?);", SOURCE, re.S).group(1)
    return "".join(re.findall(r'"([^"]*)"', block))


def face_dx():
    return float(re.search(r"const FACE_DX = ([\d.]+);", SOURCE).group(1))


def mood_face(name):
    """Cara de `MOODS[name]`: cejas, boca, ojos (óvalos o trazos) y mofletes."""
    block = re.search(rf"\n  {name}: \{{(.*?)\n  \}},", SOURCE, re.S).group(1)
    brows = re.findall(r'"(M[^"]+)"', re.search(r"brows: \[(.*?)\]", block, re.S).group(1))
    mouth = re.search(r'mouth: "([^"]+)"', block).group(1)
    closed = re.search(r"eyes: \[(.*?)\]", block, re.S)
    if closed:
        eyes = {"lines": re.findall(r'"(M[^"]+)"', closed.group(1))}
    else:
        oval = re.search(r"const OVAL_EYES = \[(.*?)\];", SOURCE, re.S).group(1)
        eyes = {"ovals": [tuple(map(float, m)) for m in re.findall(r"cx: ([\d.]+), cy: ([\d.]+)", oval)]}
    return brows, mouth, eyes, "blush: true" in block


def flatten(d, steps=16):
    """Camino SVG (M, L, Q, T, Z) a listas de puntos."""
    tokens = re.findall(r"[MLQTZ]|-?\d*\.?\d+", d)
    shapes, points = [], []
    pos = ctrl = None
    i = 0
    nums = lambda n: [float(tokens[i + 1 + k]) for k in range(n)]
    while i < len(tokens):
        cmd = tokens[i]
        if cmd == "M":
            if points:
                shapes.append(points)
            x, y = nums(2)
            points, pos, ctrl, i = [(x, y)], (x, y), None, i + 3
        elif cmd == "L":
            x, y = nums(2)
            points.append((x, y))
            pos, ctrl, i = (x, y), None, i + 3
        elif cmd in "QT":
            if cmd == "Q":
                cx, cy, x, y = nums(4)
                i += 5
            else:
                x, y = nums(2)
                cx, cy = (2 * pos[0] - ctrl[0], 2 * pos[1] - ctrl[1]) if ctrl else pos
                i += 3
            for s in range(1, steps + 1):
                t = s / steps
                points.append(
                    (
                        (1 - t) ** 2 * pos[0] + 2 * (1 - t) * t * cx + t * t * x,
                        (1 - t) ** 2 * pos[1] + 2 * (1 - t) * t * cy + t * t * y,
                    )
                )
            pos, ctrl = (x, y), (cx, cy)
        elif cmd == "Z":
            points.append(points[0])
            i += 1
        else:
            i += 1
    if points:
        shapes.append(points)
    return shapes


def scaled(points, scale):
    return [(x * scale, y * scale) for x, y in points]


def stroke(draw, points, width, scale):
    pts = scaled(points, scale)
    w = width * scale
    draw.line(pts, fill=255, width=round(w), joint="curve")
    r = w / 2
    for x, y in (pts[0], pts[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=255)


def layer(size, color, mask):
    out = Image.new("RGBA", size, color + (0,))
    out.putalpha(mask)
    return out


def render(height, face="neutral"):
    """El rayo a `height` px de alto, con fondo transparente. `face`: ánimo o None."""
    scale = height * K / VIEW[1]
    size = (math.ceil(VIEW[0] * scale), math.ceil(VIEW[1] * scale))
    body = flatten(constant("BODY"))[0]

    body_mask = Image.new("L", size)
    ImageDraw.Draw(body_mask).polygon(scaled(body, scale), fill=255)
    shade_mask = Image.new("L", size)
    stroke(ImageDraw.Draw(shade_mask), flatten(constant("SHADE"))[0], 9, scale)
    shade_mask = ImageChops.multiply(shade_mask, body_mask)
    ink_mask = Image.new("L", size)
    ink = ImageDraw.Draw(ink_mask)
    stroke(ink, body, 3, scale)
    blush_mask = Image.new("L", size)
    if face:
        brows, mouth, eyes, blush = mood_face(face)
        fx = face_dx()
        move = lambda pts: [(x + fx, y) for x, y in pts]
        for d in brows:
            stroke(ink, move(flatten(d)[0]), 2, scale)
        stroke(ink, move(flatten(mouth)[0]), 2.4, scale)
        for d in eyes.get("lines", []):
            stroke(ink, move(flatten(d)[0]), 2.4, scale)
        for cx, cy in move(eyes.get("ovals", [])):
            ink.ellipse(((cx - 2.1) * scale, (cy - 3) * scale, (cx + 2.1) * scale, (cy + 3) * scale), fill=255)
        if blush:
            cheeks = ImageDraw.Draw(blush_mask)
            for cx in (15 + fx, 38.5 + fx):
                cheeks.ellipse(((cx - 3) * scale, (37 - 1.8) * scale, (cx + 3) * scale, (37 + 1.8) * scale), fill=255)

    out = Image.new("RGBA", size, (0, 0, 0, 0))
    for color, mask in ((GOLD, body_mask), (SHADE, shade_mask), (BLUSH, blush_mask), (INK, ink_mask)):
        out.alpha_composite(layer(size, color, mask))
    final = (round(size[0] / K), round(size[1] / K))
    return out.resize(final, Image.LANCZOS)


def on_square(size, fraction, bg=None, face="neutral"):
    art = render(round(size * fraction), face)
    canvas = Image.new("RGBA", (size, size), bg + (255,) if bg else (0, 0, 0, 0))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


# Pestaña del navegador: transparente. A 16 px la cara es ruido; queda el rayo.
favicons = {16: on_square(16, 1.0, face=None), 32: on_square(32, 1.0), 48: on_square(48, 1.0)}
favicons[16].save(os.path.join(PUBLIC, "favicon-16x16.png"))
favicons[32].save(os.path.join(PUBLIC, "favicon-32x32.png"))
favicons[48].save(
    os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[favicons[16], favicons[32]]
)

# El favicon cambia de cara con el precio de ahora (`useLiveTitle`): contento
# si es barato, preocupado si es alto o muy alto. La tranquila es el de 32 px.
on_square(32, 1.0, face="happy").save(os.path.join(PUBLIC, "favicon-32x32-happy.png"))
on_square(32, 1.0, face="worried").save(os.path.join(PUBLIC, "favicon-32x32-worried.png"))

# Pantalla de inicio: fondo azul marino de la marca (iOS pinta de negro lo transparente).
on_square(180, 0.7, NAVY).convert("RGB").save(os.path.join(PUBLIC, "apple-touch-icon.png"))
on_square(192, 0.7, NAVY).save(os.path.join(PUBLIC, "android-chrome-192x192.png"))
on_square(512, 0.7, NAVY).save(os.path.join(PUBLIC, "android-chrome-512x512.png"))
# Maskable: Android recorta hasta un círculo del 80 % del lado; el rayo cabe dentro.
on_square(512, 0.56, NAVY).save(os.path.join(PUBLIC, "maskable-512x512.png"))

# Imagen para redes: se conserva el texto de la izquierda y se cambia la mascota.
og_path = os.path.join(PUBLIC, "og-image.png")
og = Image.open(og_path).convert("RGBA")
og.paste(OG_BG + (255,), (700, 0, og.width, og.height))
art = render(400)
og.alpha_composite(art, (700 + (500 - art.width) // 2, (og.height - art.height) // 2))
og.convert("RGB").save(og_path, optimize=True)
print("ok")
