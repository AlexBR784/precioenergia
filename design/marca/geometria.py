"""Geometría del símbolo: el rayo construido sobre una retícula.

Reglas de construcción (lienzo de 64 × 64 unidades):
- Los cuatro tramos "horizontales" (arriba, las dos muescas y la base) son
  paralelos: suben 1 unidad por cada 5 de avance (≈ 11,3°).
- Los dos lados de arriba y el de abajo a la izquierda son paralelos: avanzan
  3 unidades por cada 10 de bajada (≈ 16,7°). El de abajo a la derecha va más
  tumbado, 13 por cada 20 (≈ 33°), y se cierra hacia la punta: es lo que da
  el golpe del rayo.
- Todas las esquinas exteriores llevan el mismo radio y todas las interiores
  (las dos muescas), otro más pequeño.
"""
import math

RISE = 0.2  # tramos horizontales: subida por unidad de avance
UPPER = 0.3  # tramos inclinados de arriba: avance por unidad de bajada
LOWER = 0.65  # tramos inclinados de abajo: avance por unidad de bajada
R_OUT = 3.2
R_IN = 1.4


def symbol_points():
    """Vértices en orden horario, empezando arriba a la izquierda."""
    a = (17.0, 13.0)  # arriba izquierda
    top = 36.0  # anchura de arriba
    b = (a[0] + top, a[1] - top * RISE)  # arriba derecha
    upper_drop = 21.0
    c = (b[0] - upper_drop * UPPER, b[1] + upper_drop)  # muesca derecha (interior)
    notch = 10.0
    d = (c[0] + notch, c[1] - notch * RISE)  # muesca derecha (exterior)
    f = (19.0, 61.0)  # punta abajo izquierda
    # Base derecha: donde la diagonal de abajo (D→E) corta la recta de la base.
    # D + t·(-LOWER, 1) sobre y = F.y - (x - F.x)·RISE.
    t = (f[1] - (d[0] - f[0]) * RISE - d[1]) / (1 - LOWER * RISE)
    e = (d[0] - t * LOWER, d[1] + t)
    lower_rise = 14.0
    g = (f[0] + lower_rise * UPPER, f[1] - lower_rise)  # muesca izquierda (interior)
    # Muesca izquierda hacia fuera, paralela a las demás, hasta cortar la
    # diagonal de arriba a la izquierda, que es paralela a B→C.
    # H = G + s(-1, RISE); y A→H con pendiente UPPER: H.x = A.x - (H.y - A.y)·UPPER
    s = (g[0] - a[0] + (g[1] - a[1]) * UPPER) / (1 - RISE * UPPER)
    h = (g[0] - s, g[1] + s * RISE)
    return [a, b, c, d, e, f, g, h]


INNER = {2, 6}  # índices de las esquinas interiores (las muescas)


def rounded_path(points, scale=1.0, dx=0.0, dy=0.0):
    """Camino SVG con las esquinas redondeadas (curva cuadrática en cada vértice)."""
    n = len(points)
    pts = []
    for i, (x, y) in enumerate(points):
        r = R_IN if i in INNER else R_OUT
        px, py = points[i - 1]
        nx, ny = points[(i + 1) % n]
        ux, uy = px - x, py - y
        lu = math.hypot(ux, uy)
        vx, vy = nx - x, ny - y
        lv = math.hypot(vx, vy)
        pts.append(((x + ux / lu * r, y + uy / lu * r), (x, y), (x + vx / lv * r, y + vy / lv * r)))

    def f(v):
        return f"{v:.2f}".rstrip("0").rstrip(".")

    def tr(p):
        return f(p[0] * scale + dx), f(p[1] * scale + dy)

    d = "M{} {}".format(*tr(pts[0][2]))
    for i in list(range(1, n)) + [0]:
        s, c, e = pts[i]
        d += " L{} {} Q{} {} {} {}".format(*tr(s), *tr(c), *tr(e))
    return d + " Z"


if __name__ == "__main__":
    for name, p in zip("ABCDEFGH", symbol_points()):
        print(name, tuple(round(v, 2) for v in p))
    print(rounded_path(symbol_points()))
