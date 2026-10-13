import os
import json
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
import fitz # PyMuPDF
from pptx import Presentation
from pptx.util import Inches, Pt

from ..database import Base, engine, SessionLocal
from ..models import (
    User, StudyMaterial, MaterialChunk, Concept, Prerequisite,
    LearnerMastery, Question, Assessment, MisconceptionHypothesis, RecoveryPlan
)
from ..services.vector_store import VectorStoreService

SAMPLE_FILES_DIR = Path(__file__).resolve().parent / "files"
SAMPLE_FILES_DIR.mkdir(parents=True, exist_ok=True)

def create_sample_pdf(file_path: Path):
    """Generates a realistic multi-page Java Control Flow & Loops PDF with PyMuPDF."""
    doc = fitz.open()

    # Page 1: Introduction to Iteration & While Loops
    page1 = doc.new_page()
    text1 = """Java Programming: Unit 4 - Control Flow & Iteration

Page 1: Foundations of Repetition
Loops in Java allow execution of a block of code multiple times based on a boolean condition.
The `while` loop checks its condition prior to executing the loop body:
    while (condition) {
        // statement body
    }
If the condition is initially false, the loop body will not execute even once.
Pre-test loops require careful variable initialization before the loop header.
Common pitfalls include omitting variable updates inside the loop, resulting in infinite execution."""
    page1.insert_text(fitz.Point(50, 70), text1, fontsize=11)

    # Page 2: Do-While and Loop Semantics
    page2 = doc.new_page()
    text2 = """Page 2: Do-While Loops & Comparison with While Loops
Unlike standard while loops, the `do-while` loop is a post-test loop.
Syntax:
    do {
        // body executes at least once
    } while (condition);
Key rule: The loop body is guaranteed to execute at least once, even if the condition is false on the first check.
Use do-while loops primarily for input validation where user interaction must occur prior to validation."""
    page2.insert_text(fitz.Point(50, 70), text2, fontsize=11)

    # Page 3: For Loops and Boundary Invariants (Crucial for Misconception Lab)
    page3 = doc.new_page()
    text3 = """Page 3: For Loops, Invariants, and Off-by-One Boundaries
The `for` statement standardizes loop headers:
    for (initialization; condition; update) { ... }

Boundary Conditions and the Off-by-One Error:
A loop running `for (int i = 0; i <= n; i++)` iterates `n + 1` times when starting from 0.
In contrast, `for (int i = 0; i < n; i++)` iterates exactly `n` times.
When traversing zero-indexed structures, using `<=` rather than `<` causes an out-of-bounds error.
Carefully trace boundary conditions: verify whether the loop should terminate strictly before or at the bound."""
    page3.insert_text(fitz.Point(50, 70), text3, fontsize=11)

    doc.save(str(file_path))
    doc.close()

def create_sample_pptx(file_path: Path):
    """Generates a realistic Java Conditionals & Boolean Operators PowerPoint deck."""
    prs = Presentation()

    # Slide 1: Title
    slide1 = prs.slides.add_slide(prs.slide_layouts[0])
    slide1.shapes.title.text = "Java Conditionals & Relational Operators"
    slide1.placeholders[1].text = "Module 3: Boolean Expressions & Control Flow"

    # Slide 2: Relational Operators
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    slide2.shapes.title.text = "Relational Operators in Java"
    slide2.placeholders[1].text = (
        "• Relational operators compare two numeric expressions and yield a boolean primitive (true/false).\n"
        "• `==` : Equality test (Note: distinct from assignment operator `=`).\n"
        "• `!=` : Not equal to.\n"
        "• `<` and `<=` : Strictly less than, vs less than or equal to.\n"
        "• `>` and `>=` : Strictly greater than, vs greater than or equal to."
    )

    # Slide 3: Boolean Logic & Short-Circuit Evaluation
    slide3 = prs.slides.add_slide(prs.slide_layouts[1])
    slide3.shapes.title.text = "Logical Operators & Short-Circuit Evaluation"
    slide3.placeholders[1].text = (
        "• Logical AND `&&`: Evaluates true only if BOTH operands evaluate to true.\n"
        "• Logical OR `||`: Evaluates true if AT LEAST ONE operand evaluates to true.\n"
        "• Short-circuit evaluation: In `A && B`, if A is false, B is NEVER evaluated.\n"
        "• In `A || B`, if A is true, B is NEVER evaluated. This is essential for guard conditions!"
    )

    prs.save(str(file_path))

def create_sample_transcript(file_path: Path):
    """Generates a realistic Video Lecture Transcript with timestamps."""
    transcript_text = """[00:15] Professor: Welcome back everyone. Today we are continuing our deep dive into Java arrays and loop iteration.
[01:05] Professor: Arrays in Java are contiguous memory blocks. Remember the cardinal rule: Java arrays are strictly zero-indexed.
[02:18] Professor: That means if an array has length 10, the first element is at index 0 and the last element is at index 9.
[03:45] Professor: Let's look at the most common mistake students make. If you write `for (int i = 0; i <= arr.length; i++)`, your program will crash. When i reaches `arr.length`, Java immediately throws an `ArrayIndexOutOfBoundsException`.
[04:55] Professor: Always verify your loop condition. Use `i < arr.length`, not `i <= arr.length` when iterating over an entire array from zero.
[06:20] Professor: Next, let's explore multidimensional arrays and how nested loops traverse 2D grids row by row."""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(transcript_text)

def seed_database():
    """Initializes tables and seeds high-quality starter data."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. User
        user = db.query(User).filter_by(id=1).first()
        if not user:
            user = User(
                id=1,
                name="Alex Johnson",
                email="alex.johnson@student.edu",
                avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                streak_days=5
            )
            db.add(user)
            db.commit()

        # 2. Concepts
        concepts_data = [
            ("JAVA_VARS_TYPES", "Variables & Primitive Types", "Data types, memory declaration, and integer assignment.", "Beginner", 1),
            ("JAVA_COMPARISON_OPS", "Relational Operators (<, <=, ==)", "Syntax and evaluation of comparison expressions producing boolean values.", "Beginner", 2),
            ("JAVA_BOOLEAN_LOGIC", "Boolean Logic & Short-Circuit", "Compound boolean operations with &&, ||, and negation !.", "Intermediate", 3),
            ("JAVA_IF_ELSE", "Conditional Branching (If-Else)", "Execution routing based on runtime conditions.", "Beginner", 4),
            ("JAVA_LOOP_CONDITIONS", "Loop Conditions & Boundary Invariants", "Boolean predicate evaluation in loops and inclusive vs exclusive boundary conditions.", "Intermediate", 5),
            ("JAVA_WHILE_LOOPS", "While & Do-While Loops", "Pre-test and post-test repetition control structures.", "Intermediate", 6),
            ("JAVA_FOR_LOOPS", "For Loops & Counter State", "Counting loops, counter initialization, conditions, and step updates.", "Intermediate", 7),
            ("JAVA_ARRAY_INDEXING", "Array Indexing & Bounds", "Zero-indexed structures, valid index ranges, and length properties.", "Intermediate", 8),
            ("JAVA_NESTED_LOOPS", "Nested Loop Iteration", "Multi-dimensional loops and coordinate grid traversal.", "Advanced", 9),
        ]

        concept_objs = {}
        for code, name, desc, diff, ord_idx in concepts_data:
            c = db.query(Concept).filter_by(code=code).first()
            if not c:
                c = Concept(code=code, name=name, subject="Java Programming", description=desc, difficulty_level=diff, order_index=ord_idx)
                db.add(c)
                db.commit()
                db.refresh(c)
            concept_objs[code] = c

        # 3. Prerequisites
        prereq_pairs = [
            ("JAVA_COMPARISON_OPS", "JAVA_VARS_TYPES"),
            ("JAVA_BOOLEAN_LOGIC", "JAVA_COMPARISON_OPS"),
            ("JAVA_IF_ELSE", "JAVA_BOOLEAN_LOGIC"),
            ("JAVA_LOOP_CONDITIONS", "JAVA_COMPARISON_OPS"),
            ("JAVA_WHILE_LOOPS", "JAVA_LOOP_CONDITIONS"),
            ("JAVA_FOR_LOOPS", "JAVA_LOOP_CONDITIONS"),
            ("JAVA_ARRAY_INDEXING", "JAVA_VARS_TYPES"),
            ("JAVA_NESTED_LOOPS", "JAVA_FOR_LOOPS"),
        ]

        for target_code, prereq_code in prereq_pairs:
            t_obj = concept_objs[target_code]
            p_obj = concept_objs[prereq_code]
            existing = db.query(Prerequisite).filter_by(concept_id=t_obj.id, prerequisite_id=p_obj.id).first()
            if not existing:
                db.add(Prerequisite(concept_id=t_obj.id, prerequisite_id=p_obj.id, relationship_type="DIRECT_PREREQUISITE", strength=1.0))
        db.commit()

        # 4. Initial Learner Mastery (BKT)
        # Note: JAVA_LOOP_CONDITIONS has low mastery to naturally power the signature demo!
        mastery_initial = [
            ("JAVA_VARS_TYPES", "Variables & Primitive Types", 0.94, 12, 11, "MASTERED"),
            ("JAVA_COMPARISON_OPS", "Relational Operators (<, <=, ==)", 0.88, 8, 7, "MASTERED"),
            ("JAVA_BOOLEAN_LOGIC", "Boolean Logic & Short-Circuit", 0.76, 7, 5, "LEARNING"),
            ("JAVA_IF_ELSE", "Conditional Branching (If-Else)", 0.89, 9, 8, "MASTERED"),
            ("JAVA_LOOP_CONDITIONS", "Loop Conditions & Boundary Invariants", 0.38, 6, 2, "NEEDS_REVISION"),
            ("JAVA_WHILE_LOOPS", "While & Do-While Loops", 0.54, 5, 3, "LEARNING"),
            ("JAVA_FOR_LOOPS", "For Loops & Counter State", 0.48, 5, 2, "NEEDS_REVISION"),
            ("JAVA_ARRAY_INDEXING", "Array Indexing & Bounds", 0.72, 6, 4, "LEARNING"),
            ("JAVA_NESTED_LOOPS", "Nested Loop Iteration", 0.25, 2, 0, "NOT_ASSESSED"),
        ]

        for code, name, p_l, att, corr, status in mastery_initial:
            existing = db.query(LearnerMastery).filter_by(user_id=1, concept_code=code).first()
            if not existing:
                db.add(LearnerMastery(
                    user_id=1,
                    concept_code=code,
                    concept_name=name,
                    mastery_probability=p_l,
                    attempts_count=att,
                    correct_count=corr,
                    status=status
                ))
        db.commit()

        # 5. Study Materials
        pdf_path = SAMPLE_FILES_DIR / "Java_Control_Flow_Loops.pdf"
        pptx_path = SAMPLE_FILES_DIR / "Java_Conditionals_Operators.pptx"
        trans_path = SAMPLE_FILES_DIR / "Java_Arrays_and_Iteration.mp4.transcript"

        create_sample_pdf(pdf_path)
        create_sample_pptx(pptx_path)
        create_sample_transcript(trans_path)

        materials_config = [
            (
                "Java Control Flow & Loops",
                "Java_Control_Flow_Loops.pdf",
                "pdf",
                str(pdf_path),
                pdf_path.stat().st_size,
                ["While & Do-While Loops", "For Loops & Invariants", "Off-by-One Boundaries"]
            ),
            (
                "Conditionals & Relational Operators",
                "Java_Conditionals_Operators.pptx",
                "pptx",
                str(pptx_path),
                pptx_path.stat().st_size,
                ["Relational Operators", "Boolean Logic", "Short-Circuit Evaluation"]
            ),
            (
                "Arrays & Iteration Lecture Transcript",
                "Java_Arrays_and_Iteration.mp4.transcript",
                "video_transcript",
                str(trans_path),
                trans_path.stat().st_size,
                ["Array Indexing", "0-Indexed Bounds", "OutOfBounds Exceptions"]
            )
        ]

        from ..services.document_parser import DocumentParserService

        for title, fname, ftype, fpath, fsize, topics in materials_config:
            mat = db.query(StudyMaterial).filter_by(filename=fname).first()
            if not mat:
                parsed_chunks = DocumentParserService.parse_file(fpath, ftype)
                mat = StudyMaterial(
                    title=title,
                    filename=fname,
                    file_type=ftype,
                    file_path=fpath,
                    file_size_bytes=fsize,
                    subject="Java Programming",
                    status="PROCESSED",
                    chunk_count=len(parsed_chunks),
                    topics_extracted=json.dumps(topics)
                )
                db.add(mat)
                db.commit()
                db.refresh(mat)

                for idx, c in enumerate(parsed_chunks):
                    emb = VectorStoreService.generate_embedding(c.content)
                    db.add(MaterialChunk(
                        material_id=mat.id,
                        chunk_index=idx,
                        content=c.content,
                        source_location=c.source_location,
                        page_number=c.page_number,
                        slide_number=c.slide_number,
                        timestamp_seconds=c.timestamp_seconds,
                        topic=c.topic,
                        subtopic=c.subtopic,
                        embedding_json=json.dumps(emb)
                    ))
                db.commit()

        # 6. Seed Sample Active Misconception (For instant demo out-of-the-box!)
        existing_misc = db.query(MisconceptionHypothesis).filter_by(user_id=1).first()
        if not existing_misc:
            misc = MisconceptionHypothesis(
                id=1,
                user_id=1,
                title="Off-By-One Boundary Misconception (< vs <=)",
                description="Student assumes the loop terminates strictly before the boundary value rather than including it.",
                evidence_quote="Predicted 4 iterations instead of 5 for condition i <= 4",
                related_concept_code="JAVA_LOOP_CONDITIONS",
                confidence=0.88,
                status="DIAGNOSED",
                diagnostic_question_json=json.dumps({
                    "id": "DIAG_LOOP_BOUNDS_01",
                    "question": "Given `int c = 0; while (c <= 3) { c++; }`, how many times does the while body execute?",
                    "options": [
                        "3 times (stops when c equals 3)",
                        "4 times (executes for c = 0, 1, 2, and 3)",
                        "5 times (stops after increment)",
                        "More evidence needed"
                    ],
                    "target_distinction": "Distinguishes boundary inclusivity understanding from calculation slip.",
                    "expected_answer_index": 1
                }),
                source_citation_json=json.dumps({
                    "material_name": "Java_Control_Flow_Loops.pdf",
                    "location": "Page 3",
                    "page_number": 3,
                    "excerpt": "A loop running `for (int i = 0; i <= n; i++)` iterates `n + 1` times when starting from 0, whereas `i < n` iterates `n` times."
                })
            )
            db.add(misc)
            db.commit()
            db.refresh(misc)

            # Seed pre-generated recovery plan
            from ..services.misconception_engine import MisconceptionEngine
            rec_detail = MisconceptionEngine.generate_recovery_plan(misc.id, "JAVA_LOOP_CONDITIONS")
            plan = RecoveryPlan(
                id=1,
                user_id=1,
                misconception_id=misc.id,
                weak_concept_code="JAVA_LOOP_CONDITIONS",
                title=rec_detail.title,
                status="IN_PROGRESS",
                explanation_text=rec_detail.explanation_text,
                worked_example_json=json.dumps(rec_detail.worked_example.dict()),
                guided_question_json=json.dumps(rec_detail.guided_practice.dict()),
                independent_question_json=json.dumps(rec_detail.independent_practice.dict()),
                mastery_check_json=json.dumps(rec_detail.mastery_check.dict()),
                progress_percentage=25
            )
            db.add(plan)
            db.commit()

        # 7. Seed Assessment Questions
        existing_q = db.query(Question).first()
        if not existing_q:
            questions_data = [
                {
                    "uid": "Q_JAVA_LOOP_01",
                    "text": "How many times does this loop execute?\n\nint count = 0;\nfor (int i = 0; i <= 4; i++) {\n    count++;\n}",
                    "topic": "Loops & Control Flow",
                    "subtopic": "For Loop Boundaries",
                    "difficulty": "Medium",
                    "options": ["4 times", "5 times", "6 times", "Infinite loop"],
                    "expected": "5 times",
                    "explanation": "Starting at i = 0 up to and including i = 4 results in 5 iterations (i = 0, 1, 2, 3, 4). At i = 5, the condition evaluates to false.",
                    "ref": {"source": "Java_Control_Flow_Loops.pdf", "location": "Page 3"}
                },
                {
                    "uid": "Q_JAVA_LOOP_02",
                    "text": "Which statement regarding Java `do-while` loops is strictly true?",
                    "topic": "Loops & Control Flow",
                    "subtopic": "Do-While Loops",
                    "difficulty": "Easy",
                    "options": [
                        "The body is guaranteed to execute at least once",
                        "The condition is tested before the first iteration",
                        "It cannot be converted into a standard while loop",
                        "It requires an integer counter"
                    ],
                    "expected": "The body is guaranteed to execute at least once",
                    "explanation": "Because do-while is a post-test loop, the body executes before the conditional check is performed.",
                    "ref": {"source": "Java_Control_Flow_Loops.pdf", "location": "Page 2"}
                },
                {
                    "uid": "Q_JAVA_OP_03",
                    "text": "In Java, what is the value of expression: `(10 > 5) && (3 == 4)`?",
                    "topic": "Conditionals & Logic",
                    "subtopic": "Relational & Boolean Operators",
                    "difficulty": "Easy",
                    "options": ["true", "false", "Compilation Error", "NullPointerException"],
                    "expected": "false",
                    "explanation": "10 > 5 is true, but 3 == 4 is false. In a logical AND (&&), if either operand is false, the result is false.",
                    "ref": {"source": "Java_Conditionals_Operators.pptx", "location": "Slide 3"}
                },
                {
                    "uid": "Q_JAVA_ARR_04",
                    "text": "What is the result of attempting to access `arr[arr.length]` for an array of size 5?",
                    "topic": "Arrays & Iteration",
                    "subtopic": "Array Bounds",
                    "difficulty": "Medium",
                    "options": [
                        "Returns 0 (default integer value)",
                        "Returns the 5th element",
                        "Throws ArrayIndexOutOfBoundsException",
                        "Returns null"
                    ],
                    "expected": "Throws ArrayIndexOutOfBoundsException",
                    "explanation": "Java arrays are zero-indexed with indices from 0 to length - 1. Index length is outside the valid range.",
                    "ref": {"source": "Java_Arrays_and_Iteration.mp4.transcript", "location": "03:45"}
                },
                {
                    "uid": "Q_JAVA_LOOP_05",
                    "text": "What is the final value of variable `k`?\n\nint k = 1;\nwhile (k < 10) {\n    k *= 2;\n}",
                    "topic": "Loops & Control Flow",
                    "subtopic": "While Loop Execution",
                    "difficulty": "Medium",
                    "options": ["8", "10", "16", "32"],
                    "expected": "16",
                    "explanation": "Tracing k: start 1 -> 2 -> 4 -> 8. At k = 8, 8 < 10 is true, so k becomes 16. Then 16 < 10 is false, terminating with k = 16.",
                    "ref": {"source": "Java_Control_Flow_Loops.pdf", "location": "Page 1"}
                }
            ]

            # Create demo assessment
            assessment = Assessment(
                id=1,
                user_id=1,
                subject="Java Programming",
                topic="Loops & Conditionals",
                difficulty="Medium",
                total_questions=len(questions_data),
                score=60.0,
                completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

            for qd in questions_data:
                q = Question(
                    assessment_id=assessment.id,
                    question_uid=qd["uid"],
                    text=qd["text"],
                    topic=qd["topic"],
                    subtopic=qd["subtopic"],
                    difficulty=qd["difficulty"],
                    question_type="MCQ",
                    options_json=json.dumps(qd["options"]),
                    expected_answer=qd["expected"],
                    explanation=qd["explanation"],
                    source_reference_json=json.dumps(qd["ref"])
                )
                db.add(q)
            db.commit()

        print("[Seed]: Database successfully populated with multimodal Java study package!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
