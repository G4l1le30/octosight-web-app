"""rule_config/service.py — Dynamic rule configuration business logic."""

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.models.rule_config import RuleConfig
from app.modules.rule_config.repository import RuleConfigRepository


_DEFAULT_KEYWORDS = [
    "login", "verifikasi", "verif", "update", "secure", "akun", "konfirmasi",
    "tarik", "hadiah", "transfer", "pembayaran", "mutasi", "struk", "rekening",
    "biaya admin", "dana ditahan", "invoice", "tagihan", "pemenang", "undian",
    "selamat", "kejutan", "resmi", "gebyar", "beruntung", "kode unik",
    "hadiah gratis", "pajak", "klik", "limit", "blokir", "pendaftaran", "poin",
    "reward", "cashback", "bonus", "diskon", "gratis", "menang", "kupon",
    "voucher", "verifikasi akun", "pembaruan", "keamanan", "peringatan",
    "notifikasi", "aktivasi", "pengembalian", "pelunasan",
]

_DEFAULT_SCAM_SCENARIOS = {
    "accident": ["kecelakaan", "rumah sakit", "operasi", "darurat", "tabrakan", "pendarahan", "kritis"],
    "legal": ["kantor polisi", "tilang", "narkoba", "ditangkap", "tebusan", "pengadilan"],
    "wrong_transfer": ["salah kirim", "salah transfer", "minta balik", "kembalikan", "refund", "keliru transfer"],
    "banking_urgency": ["akun dibekukan", "limit habis", "pembaharuan data", "ancaman blokir", "octo mobile"],
}

_DEFAULT_SCAM_SCORES = {
    "accident": 70,
    "legal": 70,
    "wrong_transfer": 70,
    "banking_urgency": 40,
}

_DEFAULT_TLDS = [".top", ".xyz", ".link", ".info", ".online", ".site"]
_DEFAULT_SHORTENERS = ["bit.ly", "s.id", "tinyurl.com", "t.co", "goo.gl"]
_DEFAULT_BRAND_TERMS = ["cimb", "niaga", "octo", "niag"]


class RuleConfigService:
    """Business logic for rule configuration."""

    @staticmethod
    def list_rules(db: Session, config_type: Optional[str] = None) -> list:
        return RuleConfigRepository.get_all(db, config_type=config_type, is_active=None)

    @staticmethod
    def create_rule(db: Session, data: dict[str, Any]):
        existing = RuleConfigRepository.get_all(
            db, config_type=data["config_type"], is_active=None
        )
        for rule in existing:
            if rule.key == data["key"]:
                raise ConflictException(
                    f"Rule with key '{data['key']}' and type '{data['config_type']}' already exists"
                )
        return RuleConfigRepository.create(
            db,
            config_type=data["config_type"],
            key=data["key"],
            value=data.get("value"),
            group=data.get("group"),
            score=data.get("score", 0),
            description=data.get("description"),
        )

    @staticmethod
    def update_rule(db: Session, id: int, data: dict[str, Any]):
        entry = RuleConfigRepository.get_by_id(db, id)
        if not entry:
            raise NotFoundException("Rule configuration not found")
        return RuleConfigRepository.update(db, id, **data)

    @staticmethod
    def deactivate_rule(db: Session, id: int):
        if not RuleConfigRepository.deactivate(db, id):
            raise NotFoundException("Rule configuration not found")
        return True

    @staticmethod
    def load_all_active(db: Session) -> dict[str, list]:
        keywords_raw = RuleConfigRepository.get_active_by_type(db, "keyword")
        scenarios_raw = RuleConfigRepository.get_active_by_type(db, "scam_scenario")
        tlds_raw = RuleConfigRepository.get_active_by_type(db, "tld")
        shorteners_raw = RuleConfigRepository.get_active_by_type(db, "shortener")
        brand_raw = RuleConfigRepository.get_active_by_type(db, "brand_term")

        # Build aggregated dict
        scenarios: dict[str, list[str]] = {}
        for s in scenarios_raw:
            if s.group:
                scenarios.setdefault(s.group, []).append(s.key)

        return {
            "keywords": [r.key for r in keywords_raw if r.key],
            "scam_scenarios": scenarios,
            "tlds": [r.key for r in tlds_raw if r.key],
            "shorteners": [r.key for r in shorteners_raw if r.key],
            "brand_terms": [r.key for r in brand_raw if r.key],
        }

    @staticmethod
    def seed_default_rules(db: Session) -> None:
        if db.query(RuleConfig).count() > 0:
            return

        rules = []
        for kw in _DEFAULT_KEYWORDS:
            rules.append(dict(
                config_type="keyword", key=kw, value=kw, group=None,
                score=12, description="Suspicious keyword detected in phishing context",
            ))

        for group_name, keywords in _DEFAULT_SCAM_SCENARIOS.items():
            for kw in keywords:
                rules.append(dict(
                    config_type="scam_scenario", key=kw, value=kw,
                    group=group_name, score=_DEFAULT_SCAM_SCORES.get(group_name, 40),
                    description=f"Scam scenario: {group_name}",
                ))

        for tld in _DEFAULT_TLDS:
            rules.append(dict(
                config_type="tld", key=tld, value=tld, group=None,
                score=15, description="Suspicious top-level domain",
            ))

        for short in _DEFAULT_SHORTENERS:
            rules.append(dict(
                config_type="shortener", key=short, value=short, group=None,
                score=25, description="URL shortener service",
            ))

        for brand in _DEFAULT_BRAND_TERMS:
            rules.append(dict(
                config_type="brand_term", key=brand, value=brand, group=None,
                score=40, description="Brand term used in impersonation detection",
            ))

        for rule_data in rules:
            RuleConfigRepository.create(db, **rule_data)
