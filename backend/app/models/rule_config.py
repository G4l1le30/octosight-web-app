"""
rule_config.py — Dynamic rule configuration model.

Stores keywords, scam scenarios, TLDs, and URL shorteners
that were previously hardcoded in rule_engine.py.

Admins can CRUD these via an API, making the system adaptive
without code deployments.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.base import Base


class RuleConfig(Base):
    __tablename__ = "rule_config"

    id = Column(Integer, primary_key=True, index=True)
    config_type = Column(String(50), nullable=False, index=True)
    # One of: keyword, scam_scenario, tld, shortener, brand_term
    key = Column(String(255), nullable=False)
    # The actual value (e.g., "verifikasi" for keyword, ".top" for tld)
    value = Column(Text, nullable=True)
    # For scam_scenarios: the scenario group (accident, legal, wrong_transfer, banking_urgency)
    group = Column(String(100), nullable=True)
    score = Column(Integer, default=0)
    # Points contributed when matched
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
