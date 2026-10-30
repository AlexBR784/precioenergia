"""Genera los archivos de marca y la página para revisarlos.

Uso (desde la raíz del proyecto):
  python design/marca/generar.py

Escribe en `design/marca/`: el símbolo y el logotipo en SVG (con la fuente
incrustada, así que se ven igual en cualquier sitio) y `index.html`, la página
de marca con la construcción, las versiones y las normas de uso.
"""
import base64
import os

from geometria import LOWER, RISE, UPPER, rounded_path, symbol_points

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FONT = os.path.join(
    ROOT, "node_modules", "@fontsource-variable", "ibm-plex-sans", "files", "ibm-plex-sans-latin-wght-normal.woff2"
)

GOLD = "#D9A92E"
NAVY = "#1F2A3C"
WHITE = "#FFFFFF"
DARK = "#0F1216"

NAME_LIGHT = "Precio de la "  # en peso 500
NAME_BOLD = "luz"  # en peso 700
# Anchura del nombre a 100 px con espaciado -2 (medida en el navegador con la
# fuente real): "Precio de la " a 500 + "luz" a 700, y todo a 700.
WIDTH_B = 667.2
WIDTH_A = 682.1
ASCENT = 72  # altura de la "l" y la "P" sobre la línea base, a 100 px

FONT_FACE = (
    "@font-face{font-family:'Plex Marca';font-weight:100 700;"
    "src:url(data:font/woff2;base64," + base64.b64encode(open(FONT, "rb").read()).decode() + ") format('woff2')}"
)

POINTS = symbol_points()
MIN_X = min(p[0] for p in POINTS)
MAX_X = max(p[0] for p in POINTS)
MIN_Y = min(p[1] for p in POINTS)
MAX_Y = max(p[1] for p in POINTS)
RAW_W, RAW_H = MAX_X - MIN_X, MAX_Y - MIN_Y

# Versiones: relleno, contorno del símbolo y color del nombre.
VARIANTS = {
    "color": {"fill": GOLD, "stroke": NAVY, "text": NAVY},
    "negativo": {"fill": GOLD, "stroke": None, "text": WHITE},
    "mono": {"fill": NAVY, "stroke": None, "text": NAVY},
    "blanco": {"fill": WHITE, "stroke": None, "text": WHITE},
}


def symbol(x, y, height, variant):
    """El rayo con su caja (sin contorno) en (x, y) y `height` de alto."""
    v = VARIANTS[variant]
    scale = height / RAW_H
    d = rounded_path(POINTS, scale, x - MIN_X * scale, y - MIN_Y * scale)
    stroke = ""
    if v["stroke"]:
        stroke = f' stroke="{v["stroke"]}" stroke-width="{3 * scale:.2f}" stroke-linejoin="round"'
    return f'<path d="{d}" fill="{v["fill"]}"{stroke}/>', RAW_W * scale


def name(x, y, size, variant, option="b", anchor="start"):
    color = VARIANTS[variant]["text"]
    style = f"font-family:'Plex Marca',sans-serif;font-size:{size}px;letter-spacing:{-0.02 * size:.2f}px"
    if option == "a":
        body = f'<tspan font-weight="700">{NAME_LIGHT}{NAME_BOLD}</tspan>'
    else:
        body = f'<tspan font-weight="500">{NAME_LIGHT}</tspan><tspan font-weight="700">{NAME_BOLD}</tspan>'
    return f'<text x="{x:.1f}" y="{y:.1f}" fill="{color}" text-anchor="{anchor}" style="{style}">{body}</text>'


def svg(width, height, body, font=True, background=None):
    style = f"<style>{FONT_FACE}</style>" if font else ""
    bg = f'<rect width="100%" height="100%" fill="{background}"/>' if background else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.1f} {height:.1f}" '
        f'width="{width:.0f}" height="{height:.0f}" role="img" aria-label="Precio de la luz">'
        f"{style}{bg}{body}</svg>"
    )


def symbol_svg(variant, size=64, pad=4):
    body, w = symbol(pad + (size - 2 * pad - RAW_W * (size - 2 * pad) / RAW_H) / 2, pad, size - 2 * pad, variant)
    return svg(size, size, body, font=False)


def horizontal(variant, option="b"):
    """Símbolo a la izquierda y nombre a la derecha. El símbolo, centrado en la altura del nombre."""
    size = 100
    height = 112
    baseline = 100
    top = baseline - ASCENT / 2 - height / 2
    pad = 12
    body, w = symbol(pad, top, height, variant)
    gap = height * 0.28
    text_x = pad + w + gap
    width = text_x + (WIDTH_A if option == "a" else WIDTH_B) + pad
    return svg(width, top + height + pad, body + name(text_x, baseline, size, variant, option))


def stacked(variant, option="b"):
    """Símbolo encima, nombre debajo, centrados."""
    size = 100
    height = 250
    pad = 12
    width = WIDTH_B + 2 * pad
    sym_w = RAW_W * height / RAW_H
    body, _ = symbol((width - sym_w) / 2, pad, height, variant)
    baseline = pad + height + 40 + ASCENT
    return svg(width, baseline + pad + 8, body + name(width / 2, baseline, size, variant, option, anchor="middle"))


def construction():
    """El símbolo grande con la retícula y las prolongaciones de sus lados."""
    scale = 8
    size = 64 * scale
    lines = []
    for i in range(0, 65, 4):
        weight = 1 if i % 16 else 1.6
        lines.append(f'<line x1="{i*scale}" y1="0" x2="{i*scale}" y2="{size}" stroke="#D5DCE6" stroke-width="{weight}"/>')
        lines.append(f'<line x1="0" y1="{i*scale}" x2="{size}" y2="{i*scale}" stroke="#D5DCE6" stroke-width="{weight}"/>')
    guides = []
    n = len(POINTS)
    for i in range(n):
        (x1, y1), (x2, y2) = POINTS[i], POINTS[(i + 1) % n]
        dx, dy = x2 - x1, y2 - y1
        k = 3
        guides.append(
            f'<line x1="{(x1 - dx * k) * scale:.1f}" y1="{(y1 - dy * k) * scale:.1f}" '
            f'x2="{(x2 + dx * k) * scale:.1f}" y2="{(y2 + dy * k) * scale:.1f}" stroke="#4A7BA7" stroke-width="1.2" stroke-dasharray="6 6"/>'
        )
    dots = "".join(f'<circle cx="{x*scale:.1f}" cy="{y*scale:.1f}" r="5" fill="#4A7BA7"/>' for x, y in POINTS)
    shape = f'<path d="{rounded_path(POINTS, scale)}" fill="{GOLD}" fill-opacity="0.85" stroke="{NAVY}" stroke-width="{3*scale}" stroke-linejoin="round"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="100%" style="max-width:{size}px;overflow:hidden">'
        f'<rect width="100%" height="100%" fill="#F6F7F9"/>{"".join(lines)}{shape}{"".join(guides)}{dots}</svg>'
    )


def write(name_, content):
    with open(os.path.join(HERE, name_), "w", encoding="utf-8") as f:
        f.write(content)


files = {
    "simbolo.svg": symbol_svg("color"),
    "simbolo-mono.svg": symbol_svg("mono"),
    "simbolo-blanco.svg": symbol_svg("blanco"),
    "simbolo-negativo.svg": symbol_svg("negativo"),
    "logo-horizontal.svg": horizontal("color"),
    "logo-horizontal-mono.svg": horizontal("mono"),
    "logo-horizontal-negativo.svg": horizontal("negativo"),
    "logo-horizontal-blanco.svg": horizontal("blanco"),
    "logo-apilado.svg": stacked("color"),
    "logo-apilado-negativo.svg": stacked("negativo"),
}
for file, content in files.items():
    write(file, content)

# Alternativa del nombre, solo para comparar en la página.
option_a = horizontal("color", option="a")

# Área de respeto: un cuarto del alto del símbolo (112 de 136 de alto del
# logotipo horizontal), a la escala en que se enseña (360 px de ancho).
_logo_w = float(files["logo-horizontal.svg"].split('viewBox="0 0 ')[1].split(" ")[0])
CLEAR_PX = 112 * 0.25 * 360 / _logo_w

angle = lambda run, rise: f"{__import__('math').degrees(__import__('math').atan2(rise, run)):.1f}".replace(".", ",")

PAGE = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marca · Precio de la luz</title>
<style>
  @font-face {{ font-family: "Plex"; src: url("../../node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2") format("woff2"); font-weight: 100 700; }}
  :root {{ --ink: {NAVY}; --muted: #5A6472; --line: #E3E6EA; --bg: #F6F7F9; --gold: {GOLD}; --dark: {DARK}; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font-family: "Plex", system-ui, sans-serif; color: var(--ink); background: var(--bg); line-height: 1.5; }}
  main {{ max-width: 1040px; margin: 0 auto; padding: 32px 16px 64px; }}
  h1 {{ font-size: 2rem; margin: 0 0 4px; letter-spacing: -0.02em; }}
  h2 {{ font-size: 1.25rem; margin: 48px 0 8px; letter-spacing: -0.01em; }}
  p {{ margin: 0 0 12px; color: var(--muted); max-width: 70ch; }}
  .grid {{ display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }}
  .card {{ background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 20px; }}
  .card.dark {{ background: var(--dark); border-color: #2A3039; color: #E7E9EC; }}
  .card.gold {{ background: var(--gold); border-color: var(--gold); }}
  .stage {{ display: grid; place-items: center; min-height: 160px; }}
  .stage img {{ max-width: 100%; height: auto; }}
  .label {{ font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-top: 12px; }}
  .card.dark .label {{ color: #9AA3AF; }}
  .row {{ display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; }}
  .swatch {{ width: 100%; height: 72px; border-radius: 12px; border: 1px solid var(--line); }}
  .bad {{ position: relative; }}
  .bad::after {{ content: "✕"; position: absolute; top: 12px; right: 16px; color: #B83A3A; font-weight: 700; font-size: 1.25rem; }}
  .space {{ display: inline-block; outline: 2px dashed #4A7BA7; outline-offset: -2px; background: repeating-linear-gradient(45deg, #EEF3F9, #EEF3F9 6px, #fff 6px, #fff 12px); }}
  .space img {{ display: block; background: #fff; }}
  code {{ font-size: 0.9em; }}
  a {{ color: var(--ink); }}
</style>
</head>
<body>
<main>
  <h1>Marca</h1>
  <p>El símbolo (el rayo), el logotipo (símbolo y nombre), sus versiones y cómo usarlos. La mascota es el mismo rayo con cara y poses: se usa para expresar, no para firmar.</p>

  <div class="card"><div class="stage" style="min-height:200px"><img src="logo-horizontal.svg" alt="Logotipo horizontal" width="560"></div></div>

  <h2>Símbolo</h2>
  <p>Construido sobre una retícula de 64 × 64. Los cuatro tramos casi horizontales (arriba, las dos muescas y la base) son paralelos y suben {angle(1, RISE)}°. Los dos lados de arriba y el de abajo a la izquierda también son paralelos ({angle(1, UPPER)}° respecto a la vertical); el de abajo a la derecha va más tumbado ({angle(1, LOWER)}° respecto a la vertical) y cierra el rayo hacia la punta. Todas las esquinas exteriores tienen el mismo radio, y las dos interiores, otro más pequeño.</p>
  <div class="grid">
    <div class="card"><div class="stage">{construction()}</div><div class="label">Construcción</div></div>
    <div class="card"><div class="stage"><img src="simbolo.svg" alt="" width="200"></div><div class="label">Símbolo · color</div></div>
  </div>

  <h2>Logotipo</h2>
  <p>IBM Plex Sans, la misma letra de la app, con el espaciado cerrado un 2 %. «Precio de la» va en peso medio y «luz» en negrita: la palabra que se busca es la que pesa. Abajo, la alternativa con todo en negrita, para comparar.</p>
  <div class="grid">
    <div class="card"><div class="stage"><img src="logo-horizontal.svg" alt="" width="440"></div><div class="label">Recomendado · peso medio + «luz» en negrita</div></div>
    <div class="card"><div class="stage"><img src="data:image/svg+xml;base64,{base64.b64encode(option_a.encode()).decode()}" alt="" width="440"></div><div class="label">Alternativa · todo en negrita</div></div>
  </div>

  <h2>Versiones</h2>
  <div class="grid">
    <div class="card"><div class="stage"><img src="logo-horizontal.svg" alt="" width="320"></div><div class="label">Horizontal · color</div></div>
    <div class="card dark"><div class="stage"><img src="logo-horizontal-negativo.svg" alt="" width="320"></div><div class="label">Horizontal · negativo</div></div>
    <div class="card"><div class="stage"><img src="logo-horizontal-mono.svg" alt="" width="320"></div><div class="label">Horizontal · a una tinta</div></div>
    <div class="card gold"><div class="stage"><img src="logo-horizontal-blanco.svg" alt="" width="320"></div><div class="label" style="color:{NAVY}">Horizontal · blanco (sobre color o foto)</div></div>
    <div class="card"><div class="stage"><img src="logo-apilado.svg" alt="" width="240"></div><div class="label">Apilado · color</div></div>
    <div class="card dark"><div class="stage"><img src="logo-apilado-negativo.svg" alt="" width="240"></div><div class="label">Apilado · negativo</div></div>
    <div class="card"><div class="stage row" style="justify-content:center"><img src="simbolo.svg" alt="" width="96"><img src="simbolo-mono.svg" alt="" width="96"></div><div class="label">Símbolo · color y una tinta</div></div>
    <div class="card dark"><div class="stage row" style="justify-content:center"><img src="simbolo-negativo.svg" alt="" width="96"><img src="simbolo-blanco.svg" alt="" width="96"></div><div class="label">Símbolo · negativo y blanco</div></div>
  </div>

  <h2>Tamaño mínimo</h2>
  <p>El logotipo horizontal, como mínimo a 24 px de alto (en impresión, 8 mm). Por debajo, solo el símbolo, hasta 16 px; a ese tamaño, a una tinta o sobre el azul marino de la app, nunca dorado sobre blanco.</p>
  <div class="card"><div class="row">
    <img src="logo-horizontal.svg" alt="" height="48"><img src="logo-horizontal.svg" alt="" height="32"><img src="logo-horizontal.svg" alt="" height="24">
    <img src="simbolo.svg" alt="" height="32"><img src="simbolo.svg" alt="" height="24"><img src="simbolo-mono.svg" alt="" height="16">
  </div></div>

  <h2>Área de respeto</h2>
  <p>Alrededor del logotipo, un margen libre igual a la cuarta parte del alto del símbolo (la zona rayada). Nada de texto, bordes ni otros logos dentro.</p>
  <div class="card"><span class="space" style="padding:{CLEAR_PX:.0f}px"><img src="logo-horizontal.svg" alt="" width="360"></span></div>

  <h2>Colores</h2>
  <div class="grid">
    <div class="card"><div class="swatch" style="background:{GOLD}"></div><div class="label">Dorado · {GOLD}</div><p>El rayo. Nunca como color de texto sobre blanco (contraste 2,1:1).</p></div>
    <div class="card"><div class="swatch" style="background:{NAVY}"></div><div class="label">Azul marino · {NAVY}</div><p>Contorno, nombre y versión a una tinta.</p></div>
    <div class="card"><div class="swatch" style="background:{WHITE}"></div><div class="label">Blanco · {WHITE}</div><p>Nombre en negativo y versión sobre color o foto.</p></div>
  </div>

  <h2>Usos incorrectos</h2>
  <div class="grid">
    <div class="card bad"><div class="stage"><img src="logo-horizontal.svg" alt="" width="240" style="transform:scale(1.25, 0.7)"></div><div class="label">Deformarlo</div></div>
    <div class="card bad"><div class="stage"><img src="logo-horizontal.svg" alt="" width="260" style="transform:rotate(-12deg)"></div><div class="label">Girarlo</div></div>
    <div class="card bad"><div class="stage"><img src="logo-horizontal.svg" alt="" width="260" style="filter:hue-rotate(160deg)"></div><div class="label">Cambiar los colores</div></div>
    <div class="card bad" style="background:#F6E9C4"><div class="stage"><img src="logo-horizontal-negativo.svg" alt="" width="260"></div><div class="label">Ponerlo sin contraste</div></div>
  </div>

  <h2>Archivos</h2>
  <p>En <code>design/marca/</code>, en SVG con la fuente incrustada: {", ".join(f'<a href="{f}">{f}</a>' for f in files)}. Se regeneran con <code>python design/marca/generar.py</code>.</p>
</main>
</body>
</html>
"""
write("index.html", PAGE)
print("ok", len(files), "archivos")
