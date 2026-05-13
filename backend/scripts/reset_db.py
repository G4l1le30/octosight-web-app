import os
import sys
from sqlalchemy import text

# Add the backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import engine, Base, SessionLocal
from app.models.models import User, Ticket
from app.models.education import EducationModule, EducationArticle, UserLearningProgress, UserArticleProgress, UserQuizAttempt

def reset_database(force=False):
    if not force:
        print("WARNING: This will delete all data in the database!")
        confirm = input("Are you sure? (y/N): ")
        if confirm.lower() != 'y':
            print("Aborted.")
            return

    print("Dropping all tables...")
    # For MySQL, we might need to disable foreign key checks to drop all tables easily
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        Base.metadata.drop_all(bind=engine)
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
    
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database reset successfully.")

if __name__ == "__main__":
    force_reset = "--force" in sys.argv
    reset_database(force=force_reset)

