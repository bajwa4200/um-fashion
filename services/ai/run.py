#!/usr/bin/env python3
"""Run UM Fashion AI service."""
import logging
import os

import uvicorn

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    # Reload on Windows often crashes (multiprocessing + WatchFiles). Enable only if needed.
    use_reload = os.getenv("UVICORN_RELOAD", "").lower() in ("1", "true", "yes")

    kwargs: dict = {
        "host": "0.0.0.0",
        "port": int(os.getenv("AI_PORT", "8000")),
        "log_level": "info",
    }

    if use_reload:
        kwargs["reload"] = True
        kwargs["reload_dirs"] = ["app"]
        kwargs["reload_excludes"] = [
            "**/__pycache__",
            "**/*.pyc",
            ".venv",
            "chroma_data",
            "models",
        ]
    else:
        # Single process — stable on Windows
        kwargs["reload"] = False

    print(f"Starting UM AI on http://127.0.0.1:{kwargs['port']} (reload={use_reload})")
    uvicorn.run("app.main:app", **kwargs)
