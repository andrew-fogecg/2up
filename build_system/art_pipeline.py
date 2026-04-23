"""Shared art pipeline for placeholder and approved assets."""

from __future__ import annotations

import json
from pathlib import Path


def _svg_card(title: str, subtitle: str, accent: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="{title}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#10181a" />
      <stop offset="100%" stop-color="{accent}" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="40" fill="url(#bg)" />
  <rect x="28" y="28" width="456" height="456" rx="28" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="4" />
  <text x="256" y="232" text-anchor="middle" font-family="Verdana, Arial, sans-serif" font-size="96" font-weight="700" fill="#fff7ec">{title}</text>
  <text x="256" y="294" text-anchor="middle" font-family="Verdana, Arial, sans-serif" font-size="28" fill="#f4e8d8">{subtitle}</text>
</svg>'''


def _make_public_path(root: Path, path: Path) -> str:
    relative = path.relative_to(root)
    return f"/{relative.as_posix()}"


def _ensure_placeholder_assets(frontend_public_dir: Path, game_slug: str, game_name: str, symbol_keys: list[str]) -> dict[str, object]:
    asset_dir = frontend_public_dir / "assets" / "generated" / game_slug
    asset_dir.mkdir(parents=True, exist_ok=True)

    icon_path = asset_dir / "icon.svg"
    icon_path.write_text(_svg_card(game_name[:10], "ICON", "#bd4f24"), encoding="utf-8")

    accents = ["#8d3110", "#2d6a4f", "#375a7f", "#8a5c1b", "#7a2f6f", "#6d7d2b"]
    symbols = []
    for index, key in enumerate(symbol_keys):
        symbol_path = asset_dir / f"symbol-{key.lower()}.svg"
        symbol_path.write_text(_svg_card(key, "SYMBOL", accents[index % len(accents)]), encoding="utf-8")
        symbols.append({"key": key, "label": key, "src": _make_public_path(frontend_public_dir, symbol_path)})

    return {
        "icon": _make_public_path(frontend_public_dir, icon_path),
        "symbols": symbols,
    }


def _collect_approved_assets(frontend_public_dir: Path, game_slug: str, symbol_keys: list[str]) -> dict[str, object] | None:
    approved_dir = frontend_public_dir / "assets" / "approved" / game_slug
    icon_path = approved_dir / "icon.svg"
    if not icon_path.exists():
        return None

    symbols = []
    for key in symbol_keys:
        symbol_path = approved_dir / f"symbol-{key.lower()}.svg"
        if not symbol_path.exists():
            return None
        symbols.append({"key": key, "label": key, "src": _make_public_path(frontend_public_dir, symbol_path)})

    return {
        "icon": _make_public_path(frontend_public_dir, icon_path),
        "symbols": symbols,
    }


def build_art_pipeline(
    repo_root: Path,
    frontend_public_dir: Path,
    game_slug: str,
    game_name: str,
    symbol_keys: list[str],
    manifest_output_path: Path,
) -> dict[str, object]:
    placeholder_assets = _ensure_placeholder_assets(frontend_public_dir, game_slug, game_name, symbol_keys)
    approved_assets = _collect_approved_assets(frontend_public_dir, game_slug, symbol_keys)
    active_mode = "approved" if approved_assets is not None else "placeholder"

    manifest = {
        "mode": active_mode,
        "active": approved_assets or placeholder_assets,
        "placeholder": placeholder_assets,
        "approved": approved_assets,
    }

    manifest_output_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_output_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    generated_assets = [
        str((frontend_public_dir / manifest["placeholder"]["icon"].lstrip("/")).relative_to(repo_root))
    ]
    generated_assets.extend(
        str((frontend_public_dir / symbol["src"].lstrip("/")).relative_to(repo_root))
        for symbol in manifest["placeholder"]["symbols"]
    )

    return {
        "manifest_path": str(manifest_output_path.relative_to(repo_root)),
        "mode": active_mode,
        "generated_assets": generated_assets,
        "active_assets": manifest["active"],
    }