import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

class EducationModule(Base):
    __tablename__ = "education_modules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    order_index = Column(Integer, nullable=False, unique=True)  # 1-8
    description = Column(Text, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    articles = relationship("EducationArticle", back_populates="module", cascade="all, delete-orphan")
    user_progress = relationship("UserLearningProgress", back_populates="module", cascade="all, delete-orphan")

class EducationArticle(Base):
    __tablename__ = "education_articles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = Column(String(36), ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    author = Column(String(255), nullable=False)
    duration_mins = Column(Integer, nullable=False)
    publication_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    module = relationship("EducationModule", back_populates="articles")
    user_progress = relationship("UserArticleProgress", back_populates="article", cascade="all, delete-orphan")

class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String(36), ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="LOCKED")  # LOCKED, IN_PROGRESS, COMPLETED
    quiz_score = Column(Float, nullable=True)
    quiz_attempts = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Ensure only one progress record per user and module
    __table_args__ = (UniqueConstraint('user_id', 'module_id', name='_user_module_uc'),)

    # Relationships
    module = relationship("EducationModule", back_populates="user_progress")

class UserArticleProgress(Base):
    __tablename__ = "user_article_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    article_id = Column(String(36), ForeignKey("education_articles.id", ondelete="CASCADE"), nullable=False)
    is_read = Column(Integer, default=1)  # 1 for read
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    article = relationship("EducationArticle", back_populates="user_progress")

class UserQuizAttempt(Base):
    __tablename__ = "user_quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String(36), ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    passed = Column(Integer, default=0) # 1 for passed
    attempt_number = Column(Integer, nullable=False)
    details = Column(Text, nullable=True) # JSON string of results
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

