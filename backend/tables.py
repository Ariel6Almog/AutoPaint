from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # קשר לטבלת ההיסטוריה
    history_items = relationship("History", back_populates="owner")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_data = Column(String, nullable=False) # שומר את התמונה הצבועה
    created_at = Column(DateTime, default=datetime.datetime.utcnow) # תאריך ושעה אוטומטיים
    
    owner = relationship("User", back_populates="history_items")