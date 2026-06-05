"""rule_config/repository.py — Dynamic rule configuration data access layer."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.rule_config import RuleConfig


class RuleConfigRepository:
    """Database queries for rule configuration."""

    @staticmethod
    def get_all(
        db: Session,
        config_type: Optional[str] = None,
        is_active: Optional[bool] = True,
    ) -> list[RuleConfig]:
        query = db.query(RuleConfig)
        if config_type is not None:
            query = query.filter(RuleConfig.config_type == config_type)
        if is_active is not None:
            query = query.filter(RuleConfig.is_active == is_active)
        return query.all()

    @staticmethod
    def get_by_id(db: Session, id: str) -> Optional[RuleConfig]:
        return db.query(RuleConfig).filter(RuleConfig.id == id).first()

    @staticmethod
    def create(
        db: Session,
        config_type: str,
        key: str,
        value: Optional[str] = None,
        group: Optional[str] = None,
        score: int = 0,
        description: Optional[str] = None,
    ) -> RuleConfig:
        entry = RuleConfig(
            config_type=config_type,
            key=key,
            value=value,
            group=group,
            score=score,
            description=description,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def update(db: Session, id: str, **kwargs) -> Optional[RuleConfig]:
        entry = db.query(RuleConfig).filter(RuleConfig.id == id).first()
        if not entry:
            return None
        for field, value in kwargs.items():
            if hasattr(entry, field):
                setattr(entry, field, value)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def deactivate(db: Session, id: str) -> bool:
        entry = db.query(RuleConfig).filter(RuleConfig.id == id).first()
        if not entry:
            return False
        entry.is_active = False
        db.commit()
        return True

    @staticmethod
    def get_active_by_type(db: Session, config_type: str) -> list[RuleConfig]:
        return (
            db.query(RuleConfig)
            .filter(RuleConfig.config_type == config_type, RuleConfig.is_active == True)
            .all()
        )
