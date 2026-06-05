"""rule_config.py — Dynamic Rule Configuration API endpoints (v1)."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.engines import rule_engine
from app.core.security import require_permission
from app.db.session import get_db
from app.models.user import User
from app.modules.activity.service import ActivityService
from app.modules.notifications.service import NotificationService
from app.modules.rule_config.repository import RuleConfigRepository
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
    current_user: User = Depends(require_permission("rules.create")),
):
    """Create a new rule configuration."""
    result = RuleConfigService.create_rule(db, data)
    _refresh_rule_engine(db)

    ActivityService.log_ticket_updated(
        db, current_user.id, None,
        f"Rule '{data.get('key', 'Unknown')}' created by {current_user.full_name}",
    )

    # Create in-app notification for rule creation
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="rule_created",
        title=f"Rule '{data.get('key', 'Unknown')}' created",
        body=f"New {data.get('config_type', 'rule')} rule added",
        link=f"/admin/rule-config",
    )
    
    return result


def _refresh_rule_engine(db: Session) -> None:
    """Reload the singleton rule engine with active rules from the DB."""
    db_rules = RuleConfigService.load_all_active(db)
    rule_engine.load_from_db(db_rules)


@router.patch("/{id}")
def update_rule_config(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.update")),
    current_user: User = Depends(require_permission("rules.update")),
):
    """Update an existing rule configuration."""
    result = RuleConfigService.update_rule(db, id, data)
    _refresh_rule_engine(db)

    ActivityService.log_ticket_updated(
        db, current_user.id, None,
        f"Rule '{data.get('key', result.get('key', 'Unknown'))}' updated by {current_user.full_name}",
    )

    # Create in-app notification for rule update
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="rule_updated",
        title=f"Rule '{data.get('key', 'Unknown')}' updated",
        body=f"Rule {data.get('config_type', '')} modified",
        link=f"/admin/rule-config",
    )
    
    return result


@router.delete("/{id}")
def deactivate_rule_config(
    id: str,
    db: Session = Depends(get_db),
    _=Depends(require_permission("rules.deactivate")),
    current_user: User = Depends(require_permission("rules.deactivate")),
):
    """Deactivate (soft-delete) a rule configuration."""
    # Get rule details before deactivation for notification
    rule = RuleConfigRepository.get_by_id(db, id)
    rule_key = rule.key if rule else "Unknown"
    rule_type = rule.config_type if rule else "Unknown"
    
    RuleConfigService.deactivate_rule(db, id)
    _refresh_rule_engine(db)

    ActivityService.log_ticket_updated(
        db, current_user.id, None,
        f"Rule '{rule_key}' deactivated by {current_user.full_name}",
    )

    # Create in-app notification for rule deactivation
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="rule_deactivated",
        title=f"Rule '{rule_key}' deactivated",
        body=f"{rule_type} rule deactivated",
        link=f"/admin/rule-config",
    )
    
    return {"status": "deactivated", "id": id}
