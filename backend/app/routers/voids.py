from __future__ import annotations

from fastapi import APIRouter

from app.db import connect

router = APIRouter(tags=["废票"])


@router.get("/废票")
def list_voids():
    conn = connect()
    try:
        return [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM voids ORDER BY id DESC"
            ).fetchall()
        ]
    finally:
        conn.close()
