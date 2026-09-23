"""
Typed collection layer for `lead_calls` — DORA's own table (not a CRM
mirror), same soft-delete convention as the rest of mongodb/*.

# TODO: this assumes a base class/helper along the lines of what the other
# collections in mongodb/ already use (e.g. a `TypedCollection` that wraps
# Motor and applies isActive filtering automatically). Written standalone
# here so it's readable without the real base class in front of me — fold
# the CRUD below into whatever that shared base actually looks like rather
# than keeping a second pattern alongside it.
"""

from __future__ import annotations

import time
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from app.schemas.calls import CallRecord

INDEXES = [
    ("org_id", "bda_id", "status"),
    ("org_id", "scheduled_time"),
    ("classify.room_id",),
]


class CallsCollection:
    def __init__(self, collection: AsyncIOMotorCollection):
        self._c = collection

    async def create(self, **fields) -> CallRecord:
        now = int(time.time())
        doc = {
            **fields,
            "classify": None,
            "recording_url": None,
            "transcript_url": None,
            "chats": [],
            "analysis": {"status": "pending"},
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = await self._c.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _to_record(doc)

    async def get(self, call_id: str, org_id: str) -> Optional[CallRecord]:
        doc = await self._c.find_one({"_id": ObjectId(call_id), "org_id": org_id, "is_active": True})
        return _to_record(doc) if doc else None

    async def get_by_room_id(self, room_id: str) -> Optional[CallRecord]:
        doc = await self._c.find_one({"classify.room_id": room_id, "is_active": True})
        return _to_record(doc) if doc else None

    async def update(self, call_id: str, **fields) -> CallRecord:
        fields["updated_at"] = int(time.time())
        await self._c.update_one({"_id": ObjectId(call_id)}, {"$set": fields})
        doc = await self._c.find_one({"_id": ObjectId(call_id)})
        return _to_record(doc)

    async def list(
        self,
        org_id: str,
        bda_id: Optional[str] = None,
        status: Optional[str] = None,
        call_mode: Optional[str] = None,
        date_from: Optional[int] = None,
        date_to: Optional[int] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> list[CallRecord]:
        query: dict = {"org_id": org_id, "is_active": True}
        if bda_id:
            query["bda_id"] = bda_id
        if status:
            query["status"] = status
        if call_mode:
            query["call_mode"] = call_mode
        if date_from or date_to:
            query["scheduled_time"] = {}
            if date_from:
                query["scheduled_time"]["$gte"] = date_from
            if date_to:
                query["scheduled_time"]["$lte"] = date_to

        cursor = (
            self._c.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return [_to_record(doc) async for doc in cursor]


def _to_record(doc: dict) -> CallRecord:
    doc = {**doc, "id": str(doc["_id"])}
    doc.pop("_id", None)
    doc.pop("is_active", None)
    return CallRecord(**doc)


# TODO: wire to the real Motor database handle, e.g.:
# from app.mongodb.database import db
# calls_collection = CallsCollection(db["lead_calls"])
calls_collection: CallsCollection
