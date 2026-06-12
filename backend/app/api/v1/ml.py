from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

import os

from app.db.session import get_db

router = APIRouter(prefix="/ml", tags=["ML Service Integration"])

# In a production environment, this token should be stored in environment variables
# For now, we use a consistent secret for the internal ML bridge.
RETRAIN_TOKEN = os.getenv("RETRAIN_TOKEN", "octosight_secret_2024")

@router.get("/training-data")
def get_training_data(
    x_retrain_token: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Securely expose training data for the external ML service.
    Authorized by X-Retrain-Token header.
    """
    if x_retrain_token != RETRAIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized access to training data")

    # Fetch feedback data joined with ticket text
    query = text("""
        SELECT t.summary, t.extracted_text, f.feedback_type 
        FROM ml_feedback f
        JOIN tickets t ON f.ticket_id = t.ticket_id
    """)
    
    result = db.execute(query)
    
    data = []
    for row in result:
        data.append({
            "summary": row.summary,
            "extracted_text": row.extracted_text,
            "feedback_type": row.feedback_type
        })
    
    return data
