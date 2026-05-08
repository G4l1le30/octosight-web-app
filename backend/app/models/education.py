from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class EducationModule(Base):
    __tablename__ = "education_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    order_index = Column(Integer, nullable=False, unique=True)  # 1-8
    description = Column(Text, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    articles = relationship("EducationArticle", back_populates="module", cascade="all, delete-orphan")
    user_progress = relationship("UserLearningProgress", back_populates="module", cascade="all, delete-orphan")

class EducationArticle(Base):
    __tablename__ = "education_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    author = Column(String(255), nullable=False)
    duration_mins = Column(Integer, nullable=False)
    publication_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    module = relationship("EducationModule", back_populates="articles")

class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="LOCKED")  # LOCKED, IN_PROGRESS, COMPLETED
    quiz_score = Column(Float, nullable=True)
    quiz_attempts = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    module = relationship("EducationModule", back_populates="user_progress")
