# -*- coding: utf-8 -*-
"""نقطة دخول قديمة — المنطق الكامل في maintenance_ml_server.py"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from maintenance_ml_server import app  # noqa: E402

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=False)
