"""detection/hybrid.py — Hybrid score calculation engine.

Computes the final risk score using the rule (35%) + ML (65%) formula
with context-aware overrides.
"""

from typing import Any, Optional


def compute_hybrid_score(
    rule_score: float,
    combined_text: str,
    only_ml: bool = False,
    ml_result: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Compute the hybrid (rule + ML) risk score.

    Args:
        rule_score: Raw rule engine score (0-100).
        combined_text: Text for ML analysis.
        only_ml: If True, skip rule contribution (used when URL is missing).
        ml_result: Pre-computed ML result (optional — avoids re-running).

    Returns:
        dict with final_score, rule_score, ml_score, ml_category,
        ml_confidence, ml_available, formula, rule_weight, ml_weight.
    """
    if ml_result is None or "error" in ml_result:
        ml_score = rule_score
        ml_category = "unavailable"
        ml_confidence = 0.0
        ml_available = False
    else:
        ml_category = ml_result["category"]
        ml_confidence = ml_result["confidence"]

        if ml_category == "phishing":
            ml_score = ml_confidence
        else:
            ml_score = 100.0 - ml_confidence

        ml_available = True

    if only_ml and ml_available:
        final_score = ml_score
        formula = "final = ml×1.00 (URL missing)"
        rule_weight = 0
        ml_weight = 100
    else:
        final_score = round((rule_score * 0.35) + (ml_score * 0.65), 2)
        formula = "final = rule×0.35 + ml×0.65"
        rule_weight = 35
        ml_weight = 65

    final_score = min(100.0, final_score)

    return {
        "final_score": final_score,
        "rule_score": rule_score,
        "ml_score": ml_score,
        "ml_category": ml_category,
        "ml_confidence": ml_confidence,
        "ml_available": ml_available,
        "formula": formula,
        "rule_weight": rule_weight,
        "ml_weight": ml_weight,
    }


def resolve_priority(score: float) -> str:
    """Map a numeric score (0-100) to a priority label."""
    if score >= 75:
        return "High"
    elif score >= 35:
        return "Medium"
    return "Low"
