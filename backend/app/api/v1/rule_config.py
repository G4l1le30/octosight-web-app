"""rule_config.py — Dynamic Rule Configuration API endpoints (v1)."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_permission
from app.db.session import get_db
from app.modules.rule_config.service import RuleConfigService

router = APIRouter(prefix="/admin/rule-config", tags=["admin", "rule-config"])


@router.get("")
def list_rule_config(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.view")),
):
    """List rule configurations, optionally filtered by type."""
    return RuleConfigService.list_rules(db, config_type=type)


@router.post("")
def create_rule_config(
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.create")),
):
    """Create a new rule configuration."""
    return RuleConfigService.create_rule(db, data)


@router.patch("/{id}")
def update_rule_config(
    id: int,
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.update")),
):
    """Update an existing rule configuration."""
    return RuleConfigService.update_rule(db, id, data)


@router.delete("/{id}")
def deactivate_rule_config(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.deactivate")),
):
    """Deactivate (soft-delete) a rule configuration."""
    RuleConfigService.deactivate_rule(db, id)
    return {"status": "deactivated", "id": id}
