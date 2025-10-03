from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import NVARCHAR, NTEXT, DATETIME2
from datetime import datetime



Base = declarative_base()

# Association tables for many-to-many relationships
disease_symptoms = Table(
    'disease_symptoms',
    Base.metadata,
    Column('disease_id', Integer, ForeignKey('diseases.id'), primary_key=True),
    Column('symptom_id', Integer, ForeignKey('symptoms.id'), primary_key=True),
    Column('severity', NVARCHAR(50)),
    Column('frequency', NVARCHAR(50))
)

disease_remedies = Table(
    'disease_remedies',
    Base.metadata,
    Column('disease_id', Integer, ForeignKey('diseases.id'), primary_key=True),
    Column('remedy_id', Integer, ForeignKey('remedies.id'), primary_key=True),
    Column('effectiveness', Integer),
    Column('application_timing', NVARCHAR(255)),
    Column('notes', NTEXT)
)

class Disease(Base):
    __tablename__ = 'diseases'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(NVARCHAR(255), unique=True, nullable=False)
    scientific_name = Column(NVARCHAR(255))
    plant_type = Column(NVARCHAR(100), nullable=False)
    severity_level = Column(NVARCHAR(50))
    description = Column(NTEXT)
    created_at = Column(DATETIME2, default=datetime.utcnow)
    updated_at = Column(DATETIME2, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    symptoms = relationship("Symptom", secondary=disease_symptoms, back_populates="diseases")
    remedies = relationship("Remedy", secondary=disease_remedies, back_populates="diseases")

class Symptom(Base):
    __tablename__ = 'symptoms'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(NVARCHAR(255), nullable=False)
    description = Column(NTEXT)
    symptom_type = Column(NVARCHAR(100))
    created_at = Column(DATETIME2, default=datetime.utcnow)
    
    # Relationships
    diseases = relationship("Disease", secondary=disease_symptoms, back_populates="symptoms")

class Remedy(Base):
    __tablename__ = 'remedies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(NVARCHAR(255), nullable=False)
    type = Column(NVARCHAR(100))
    description = Column(NTEXT)
    application_method = Column(NTEXT)
    safety_notes = Column(NTEXT)
    effectiveness_rating = Column(Integer)
    cost_level = Column(NVARCHAR(50))
    created_at = Column(DATETIME2, default=datetime.utcnow)
    
    # Relationships
    diseases = relationship("Disease", secondary=disease_remedies, back_populates="remedies")