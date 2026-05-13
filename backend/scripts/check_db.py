import os
import sys

# Add the backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


from app.db.session import SessionLocal
from app.models.models import User
from app.models.education import EducationModule

def check_db():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        module_count = db.query(EducationModule).count()
        print(f"Users: {user_count}")
        print(f"Modules: {module_count}")
        
        admin = db.query(User).filter(User.role == "admin").first()
        if admin:
            print(f"Admin exists: {admin.email}")
        else:
            print("Admin NOT found!")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
