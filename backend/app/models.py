import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Alex Johnson")
    email = Column(String(100), unique=True, index=True, default="alex@student.edu")
    avatar = Column(String(255), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
    streak_days = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    mastery_estimates = relationship("LearnerMastery", back_populates="user", cascade="all, delete-orphan")
    misconceptions = relationship("MisconceptionHypothesis", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # 'pdf', 'pptx', 'video_transcript'
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    subject = Column(String(100), default="Computer Science")
    status = Column(String(50), default="PROCESSED") # PENDING, PROCESSING, PROCESSED, FAILED
    error_message = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    topics_extracted = Column(Text, default="[]") # JSON list of extracted topics
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")

    def get_topics(self) -> list[str]:
        try:
            return json.loads(self.topics_extracted or "[]")
        except Exception:
            return []


class MaterialChunk(Base):
    __tablename__ = "material_chunks"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    source_location = Column(String(100), nullable=False) # e.g. "Page 3", "Slide 7", "04:12"
    page_number = Column(Integer, nullable=True)
    slide_number = Column(Integer, nullable=True)
    timestamp_seconds = Column(Float, nullable=True)
    topic = Column(String(100), default="General")
    subtopic = Column(String(100), default="General")
    embedding_json = Column(Text, nullable=True) # JSON float array for vector search
    token_count = Column(Integer, default=0)

    material = relationship("StudyMaterial", back_populates="chunks")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True) # e.g., 'JAVA_LOOP_CONDITIONS'
    name = Column(String(150), nullable=False)
    subject = Column(String(100), default="Java Programming")
    description = Column(Text, nullable=False)
    difficulty_level = Column(String(50), default="Intermediate")
    order_index = Column(Integer, default=0)

    # Self-referencing prerequisites are maintained in Prerequisite table


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    prerequisite_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    relationship_type = Column(String(50), default="DIRECT_PREREQUISITE") # DIRECT_PREREQUISITE, FOUNDATIONAL, REINFORCING
    strength = Column(Float, default=1.0)
    is_verified = Column(Boolean, default=True)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    title = Column(String(200), default="Java Learning Chat")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False) # 'user' or 'tutor'
    content = Column(Text, nullable=False)
    mode = Column(String(50), default="step_by_step") # 'simple', 'step_by_step', 'examples'
    citations_json = Column(Text, default="[]") # JSON list of citation objects
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    subject = Column(String(100), default="Java Programming")
    topic = Column(String(100), default="Loops & Conditionals")
    difficulty = Column(String(50), default="Medium")
    total_questions = Column(Integer, default=5)
    score = Column(Float, default=0.0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    question_uid = Column(String(100), unique=True, index=True)
    text = Column(Text, nullable=False)
    topic = Column(String(100), default="Loops")
    subtopic = Column(String(100), default="Loop Conditions")
    difficulty = Column(String(50), default="Medium")
    question_type = Column(String(50), default="MCQ") # 'MCQ', 'SHORT_ANSWER', 'NUMERICAL'
    options_json = Column(Text, default="[]") # JSON list of strings for MCQ
    expected_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    source_reference_json = Column(Text, default="{}") # JSON citation info

    assessment = relationship("Assessment", back_populates="questions")
    responses = relationship("StudentResponse", back_populates="question", cascade="all, delete-orphan")


class StudentResponse(Base):
    __tablename__ = "student_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    selected_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_seconds = Column(Integer, default=25)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="responses")


class MisconceptionHypothesis(Base):
    __tablename__ = "misconceptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    evidence_quote = Column(Text, nullable=False)
    related_concept_code = Column(String(100), default="JAVA_LOOP_CONDITIONS")
    confidence = Column(Float, default=0.85) # 0.0 - 1.0
    source_citation_json = Column(Text, default="{}")
    status = Column(String(50), default="DIAGNOSED") # DIAGNOSED, INVESTIGATING, RESOLVED
    diagnostic_question_json = Column(Text, default="{}")
    student_followup_answer = Column(Text, nullable=True)
    final_diagnosis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="misconceptions")
    recovery_plans = relationship("RecoveryPlan", back_populates="misconception", cascade="all, delete-orphan")


class LearnerMastery(Base):
    __tablename__ = "learner_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    concept_code = Column(String(100), nullable=False, index=True)
    concept_name = Column(String(150), nullable=False)
    mastery_probability = Column(Float, default=0.5) # BKT probability P(L_n)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    status = Column(String(50), default="LEARNING") # MASTERED (>=0.85), LEARNING (0.5-0.84), NEEDS_REVISION (<0.5), NOT_ASSESSED
    bkt_parameters_json = Column(Text, default='{"p_init": 0.3, "p_transit": 0.15, "p_slip": 0.1, "p_guess": 0.2}')
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="mastery_estimates")


class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    misconception_id = Column(Integer, ForeignKey("misconceptions.id"), nullable=True)
    weak_concept_code = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    status = Column(String(50), default="IN_PROGRESS") # NOT_STARTED, IN_PROGRESS, COMPLETED
    explanation_text = Column(Text, nullable=False)
    worked_example_json = Column(Text, default="{}")
    guided_question_json = Column(Text, default="{}")
    independent_question_json = Column(Text, default="{}")
    mastery_check_json = Column(Text, default="{}")
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    misconception = relationship("MisconceptionHypothesis", back_populates="recovery_plans")


class QuestionHistory(Base):
    __tablename__ = "question_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    question_uid = Column(String(100), nullable=False, index=True)
    question_hash = Column(String(100), nullable=False)
    topic = Column(String(100), default="General")
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
