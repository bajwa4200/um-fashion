#!/usr/bin/env python3
import logging
import os

import uvicorn

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    port = int(os.getenv("GPU_PORT", "8100"))
    print(f"UM GPU Laptop API http://127.0.0.1:{port}")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
