from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "frontend" / "public" / "assets"

ROOM_THEMES = {
    "natural": ("#d8c7aa", "#f5efe4", "#8ba08a", "#b7845e"),
    "clear-cool": ("#b9c5ca", "#edf2f3", "#758b96", "#d4a36f"),
    "dandy": ("#594a40", "#d8d0c6", "#344842", "#9a6d4c"),
    "elegant": ("#cdb8bd", "#f6edef", "#8a727b", "#d6af7c"),
    "cozy": ("#bd8c68", "#efe0cf", "#6f806c", "#d4a36f"),
    "colorful": ("#d78567", "#f4e9d5", "#5e8e89", "#d9ad52"),
}

PRODUCTS = {
    "bed": ("#a98f72", '<rect x="105" y="180" width="430" height="125" rx="18"/><rect x="120" y="135" width="395" height="78" rx="26" fill="#f4ede1"/><path d="M130 305v55M510 305v55"/>'),
    "desk": ("#7d8f82", '<path d="M120 190h400v45H120z"/><path d="M155 235v140M485 235v140"/><rect x="250" y="130" width="140" height="60" rx="8" fill="#f4ede1"/>'),
    "storage": ("#b28a60", '<rect x="155" y="85" width="330" height="300" rx="12"/><path d="M155 180h330M155 280h330M320 85v300" stroke="#f4ede1"/><circle cx="300" cy="135" r="7" fill="#f4ede1"/><circle cx="340" cy="135" r="7" fill="#f4ede1"/>'),
    "lighting": ("#d3a14d", '<path d="M320 70v105"/><path d="M235 220h170l-42-80h-86z"/><circle cx="320" cy="245" r="35" fill="#fff1b8"/><path d="M320 280v105M255 385h130"/>'),
    "textile": ("#8c9f91", '<path d="M120 125h400v250H120z"/><path d="M160 165h120v90H160zM360 165h120v90H360z" fill="#f4ede1"/><path d="M160 310h320" stroke="#f4ede1" stroke-width="14"/>'),
    "support": ("#a36f5e", '<rect x="190" y="175" width="260" height="135" rx="28"/><path d="M220 310v65M420 310v65M190 220h260"/><rect x="235" y="125" width="170" height="75" rx="30" fill="#f4ede1"/>'),
}


def room_svg(title: str, colors: tuple[str, str, str, str]) -> str:
    wood, wall, accent, warm = colors
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title">
  <title id="title">{title}のオリジナルデモルーム</title>
  <defs><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{wall}"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dccbb4"/><stop offset="1" stop-color="#bda98f"/></linearGradient></defs>
  <rect width="1200" height="900" fill="url(#wall)"/><path d="M0 580L1200 490V900H0Z" fill="url(#floor)"/>
  <rect x="82" y="90" width="310" height="305" rx="12" fill="#eaf3f2" stroke="#d1d8d5" stroke-width="16"/><path d="M237 98v289M90 245h294" stroke="#d1d8d5" stroke-width="10"/>
  <circle cx="1000" cy="125" r="52" fill="{warm}" opacity=".9"/><path d="M1000 175v120" stroke="#574f47" stroke-width="10"/><path d="M950 295h100" stroke="#574f47" stroke-width="14"/>
  <rect x="550" y="355" width="500" height="255" rx="32" fill="{wood}"/><rect x="575" y="310" width="210" height="130" rx="55" fill="#f4eee3"/><rect x="815" y="310" width="210" height="130" rx="55" fill="{accent}"/><path d="M595 610v95M1008 610v95" stroke="#62554a" stroke-width="18"/>
  <rect x="425" y="645" width="620" height="150" rx="70" fill="#ebe2d5" opacity=".95"/><ellipse cx="730" cy="655" rx="160" ry="58" fill="{accent}" opacity=".72"/>
  <rect x="90" y="480" width="250" height="235" rx="15" fill="{wood}"/><path d="M90 555h250M90 635h250" stroke="#f4eee3" stroke-width="9"/><circle cx="205" cy="518" r="7" fill="#f4eee3"/>
  <path d="M355 715h30V425h-30" fill="{accent}"/><path d="M310 430q60-150 120 0" fill="{accent}" opacity=".9"/>
  <rect x="0" y="0" width="1200" height="900" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="30"/>
</svg>'''


def product_svg(title: str, color: str, shape: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-labelledby="title">
  <title id="title">{title}のオリジナルデモプレースホルダー</title>
  <rect width="640" height="480" fill="#f0ece4"/><circle cx="530" cy="80" r="120" fill="{color}" opacity=".16"/><g fill="{color}" stroke="{color}" stroke-width="16" stroke-linejoin="round">{shape}</g><text x="320" y="435" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#6a675f">DEMO PRODUCT</text>
</svg>'''


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name, colors in ROOM_THEMES.items():
        (ASSETS / f"room-{name}.svg").write_text(room_svg(name, colors) + "\n", encoding="utf-8")
    for name, (color, shape) in PRODUCTS.items():
        (ASSETS / f"product-{name}.svg").write_text(product_svg(name, color, shape) + "\n", encoding="utf-8")
    print(f"Wrote {len(ROOM_THEMES)} room illustrations and {len(PRODUCTS)} product placeholders to {ASSETS}")


if __name__ == "__main__":
    main()
