"""blacklist.py — Pydantic schemas for blacklist CRUD and check operations."""

from typing import Optional

from pydantic import BaseModel, ConfigDict


class BlacklistURLCreate(BaseModel):
    url: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistAccountCreate(BaseModel):
    account_number: str
    bank_name: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistPhoneCreate(BaseModel):
    phone_number: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistEmailCreate(BaseModel):
    email: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None


class BlacklistCheckRequest(BaseModel):
    value: str


class BlacklistEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    value: str
    reason: Optional[str] = None
    ticket_id: Optional[str] = None
    added_by: Optional[str] = None
    is_active: bool
    created_at: str
