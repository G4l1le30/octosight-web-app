"""rule_config.py — Dynamic Rule Configuration API endpoints (v1, admin only)."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.modules.rule_config.service import RuleConfigService

router = APIRouter(prefix="/admin/rule-config", tags=["admin", "rule-config"])


@router.get("")
def list_rule_config(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """List rule configurations, optionally filtered by type."""
    return RuleConfigService.list_rules(db, config_type=type)


@router.post("")
def create_rule_config(
    data: dict,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a new rule configuration."""
    return RuleConfigService.create_rule(db, data)


@router.patch("/{id}")
def update_rule_config(
    id: int,
    data: dict,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Update an existing rule configuration."""
    return RuleConfigService.update_rule(db, id, data)


@router.delete("/{id}")
def deactivate_rule_config(
    id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Deactivate (soft-delete) a rule configuration."""
    RuleConfigService.deactivate_rule(db, id)
    return {"status": "deactivated", "id": id}
