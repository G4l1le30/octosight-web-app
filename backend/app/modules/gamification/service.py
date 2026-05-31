"""gamification.py — Points, badges, streaks service."""

from datetime import datetime, timezone, date

from sqlalchemy.orm import Session

from app.models.achievement import Achievement, UserAchievement, UserPoints, UserStreak
from app.models.education import UserLearningProgress


ACHIEVEMENT_DEFINITIONS = [
    {"name": "First Report", "description": "Submitted your first phishing report", "icon": "flag", "category": "reporting", "points": 50},
    {"name": "Reporter Pro", "description": "Submitted 5 phishing reports", "icon": "flag", "category": "reporting", "points": 100},
    {"name": "Report Master", "description": "Submitted 20 phishing reports", "icon": "award", "category": "reporting", "points": 250},
    {"name": "Quiz Starter", "description": "Completed your first quiz", "icon": "brain", "category": "education", "points": 25},
    {"name": "Quiz Ace", "description": "Scored 90%+ on any quiz", "icon": "star", "category": "education", "points": 75},
    {"name": "Module Complete", "description": "Completed an education module", "icon": "book", "category": "education", "points": 50},
    {"name": "Knowledge Seeker", "description": "Completed 3 education modules", "icon": "book", "category": "education", "points": 100},
    {"name": "7-Day Streak", "description": "Active for 7 consecutive days", "icon": "flame", "category": "engagement", "points": 150},
    {"name": "30-Day Streak", "description": "Active for 30 consecutive days", "icon": "flame", "category": "engagement", "points": 500},
    {"name": "Early Bird", "description": "First report before 8 AM", "icon": "sun", "category": "special", "points": 25},
]


def seed_achievements(db: Session) -> None:
    """Seed achievement definitions if not present."""
    for defn in ACHIEVEMENT_DEFINITIONS:
        existing = db.query(Achievement).filter(Achievement.name == defn["name"]).first()
        if not existing:
            db.add(Achievement(**defn))
    db.commit()


def award_points(db: Session, user_id: str, points: int, source: str, reference_id: str = None) -> int:
    """Award points to a user. Returns new total."""
    ledger = UserPoints(user_id=user_id, points=points, source=source, reference_id=reference_id)
    db.add(ledger)
    db.commit()
    return get_total_points(db, user_id)


def get_total_points(db: Session, user_id: str) -> int:
    total = db.query(UserPoints).filter(UserPoints.user_id == user_id).with_entities(UserPoints.points).all()
    return sum(p[0] for p in total) if total else 0


def check_and_award_achievements(db: Session, user_id: str, ticket_count: int = 0) -> list[str]:
    """Check criteria and award new achievements. Returns list of newly earned names."""
    earned = set(
        a.name for (a,) in (
            db.query(Achievement)
            .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
            .filter(UserAchievement.user_id == user_id)
            .with_entities(Achievement.name)
            .all()
        )
    )
    newly_earned = []

    all_achievements = db.query(Achievement).all()
    for ach in all_achievements:
        if ach.name in earned:
            continue

        should_award = False
        if ach.name == "First Report" and ticket_count >= 1:
            should_award = True
        elif ach.name == "Reporter Pro" and ticket_count >= 5:
            should_award = True
        elif ach.name == "Report Master" and ticket_count >= 20:
            should_award = True

        if should_award:
            db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
            db.add(UserPoints(user_id=user_id, points=ach.points, source=f"achievement:{ach.name}"))
            newly_earned.append(ach.name)

    if newly_earned:
        db.commit()
    return newly_earned


def update_streak(db: Session, user_id: str) -> int:
    """Update daily streak. Returns current streak count."""
    today_str = date.today().isoformat()
    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()

    if not streak:
        streak = UserStreak(user_id=user_id, current_streak=1, longest_streak=1, last_active_date=today_str)
        db.add(streak)
        db.commit()
        return 1

    if streak.last_active_date == today_str:
        return streak.current_streak

    from datetime import timedelta
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    if streak.last_active_date == yesterday:
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_active_date = today_str
    db.commit()

    # Check streak achievements
    if streak.current_streak >= 7:
        ach = db.query(Achievement).filter(Achievement.name == "7-Day Streak").first()
        if ach:
            existing = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == ach.id,
            ).first()
            if not existing:
                db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
                db.add(UserPoints(user_id=user_id, points=ach.points, source="achievement:7-Day Streak"))
                db.commit()

    if streak.current_streak >= 30:
        ach = db.query(Achievement).filter(Achievement.name == "30-Day Streak").first()
        if ach:
            existing = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == ach.id,
            ).first()
            if not existing:
                db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
                db.add(UserPoints(user_id=user_id, points=ach.points, source="achievement:30-Day Streak"))
                db.commit()

    return streak.current_streak


def get_leaderboard(db: Session, limit: int = 20) -> list[dict]:
    """Return top users by total points."""
    from app.models.user import User

    results = (
        db.query(User.id, User.full_name, User.points_total)
        .filter(User.points_total > 0)
        .order_by(User.points_total.desc())
        .limit(limit)
        .all()
    )
    return [
        {"rank": i + 1, "user_id": r[0], "name": r[1], "points": r[2]}
        for i, r in enumerate(results)
    ]


def get_user_gamification(db: Session, user_id: str) -> dict:
    """Return full gamification profile for a user."""
    total = get_total_points(db, user_id)
    achievements = (
        db.query(Achievement)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .filter(UserAchievement.user_id == user_id)
        .all()
    )
    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()

    return {
        "total_points": total,
        "achievements": [
            {"name": a.name, "description": a.description, "icon": a.icon, "category": a.category, "points": a.points}
            for a in achievements
        ],
        "streak": {
            "current": streak.current_streak if streak else 0,
            "longest": streak.longest_streak if streak else 0,
        },
    }
