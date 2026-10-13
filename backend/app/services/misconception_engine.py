import json
from typing import Dict, Any, List
from ..schemas import (
    MisconceptionHypothesisItem,
    DiagnosticQuestion,
    Citation,
    WorkedExample,
    PracticeQuestion,
    RecoveryPlanDetail
)

class MisconceptionEngine:
    """
    Core Signature Engine: "Why Am I Getting This Wrong?"
    Coordinates 5-step diagnostic and recovery pipeline grounded in course materials.
    """

    @classmethod
    def analyze_error(
        cls,
        question_text: str,
        student_answer: str,
        expected_answer: str,
        topic: str = "Loops & Control Flow"
    ) -> Dict[str, Any]:
        """
        Step A & Step B: Identify error and generate competing diagnostic hypotheses.
        """
        # Determine dominant conceptual patterns in student's response
        s_clean = student_answer.strip().lower()
        e_clean = expected_answer.strip().lower()

        # Check for classic loop boundary off-by-one error
        if any(w in question_text.lower() for w in ["how many times", "iterations", "loop", "count", "while", "for"]):
            return cls._analyze_loop_error(question_text, student_answer, expected_answer)
        elif any(w in question_text.lower() for w in ["array", "index", "bounds"]):
            return cls._analyze_array_error(question_text, student_answer, expected_answer)
        else:
            return cls._analyze_generic_error(question_text, student_answer, expected_answer)

    @classmethod
    def _analyze_loop_error(cls, q: str, student_ans: str, expected_ans: str) -> Dict[str, Any]:
        """Analysis for loop iteration and boundary condition errors."""
        error_summary = (
            f"The student predicted '{student_ans}', whereas the loop actually executes '{expected_ans}' times. "
            f"This represents a divergence at the termination boundary condition."
        )

        hypotheses = [
            MisconceptionHypothesisItem(
                id=1,
                title="Off-By-One Boundary Misconception (< vs <=)",
                description="Student assumes the loop condition terminates strictly before the boundary value rather than including it, or overlooks inclusive bounds.",
                evidence_quote=f"Provided '{student_ans}' instead of '{expected_ans}'",
                related_concept="Loop Termination Conditions",
                related_concept_code="JAVA_LOOP_CONDITIONS",
                confidence=0.88,
                category="Conceptual Misunderstanding",
                citation=Citation(
                    material_name="Java_Control_Flow_Loops.pdf",
                    location="Page 3",
                    page_number=3,
                    excerpt="A loop with condition `i <= n` executes `n + 1` times when starting from 0, whereas `i < n` executes exactly `n` times."
                )
            ),
            MisconceptionHypothesisItem(
                id=2,
                title="Post-Increment Order Confusion (i++)",
                description="Student may believe `i++` inside the loop updates before condition evaluation, altering the count.",
                evidence_quote="Calculated iteration count shifted by 1",
                related_concept="Unary Increment & Evaluation Order",
                related_concept_code="JAVA_OPERATORS_INCREMENT",
                confidence=0.42,
                category="Syntax Confusion",
                citation=Citation(
                    material_name="Java_Conditionals_Operators.pptx",
                    location="Slide 4",
                    slide_number=4,
                    excerpt="Postfix increment `i++` yields the current value before incrementing, whereas condition re-checks occur at the next iteration start."
                )
            ),
            MisconceptionHypothesisItem(
                id=3,
                title="Careless Calculation Slip",
                description="Mental arithmetic or counting oversight rather than a conceptual misunderstanding of boolean loop mechanics.",
                evidence_quote="Answer is within ±1 of expected count",
                related_concept="Arithmetic Execution",
                related_concept_code="JAVA_LOOP_EXECUTION",
                confidence=0.25,
                category="Careless Slip",
                citation=None
            )
        ]

        # Step C: Discriminator diagnostic question
        diag_q = DiagnosticQuestion(
            id="DIAG_LOOP_BOUNDS_01",
            question="Given `int c = 0; while (c <= 3) { c++; }`, how many times does the while body execute?",
            options=[
                "3 times (stops when c equals 3)",
                "4 times (executes for c = 0, 1, 2, and 3)",
                "5 times (stops after increment)",
                "More evidence needed"
            ],
            target_distinction="Distinguishes boundary inclusivity understanding (`<=`) from careless off-by-one counting.",
            expected_answer_index=1 # "4 times"
        )

        # Step D: Prerequisite weakness map
        prereq_weakness = {
            "target_concept": {
                "code": "JAVA_LOOP_EXECUTION",
                "name": "Loop Execution & Iterations",
                "status": "NEEDS_REVISION"
            },
            "prerequisites": [
                {
                    "code": "JAVA_COMPARISON_OPS",
                    "name": "Relational Operators (<, <=, >)",
                    "status": "MASTERED",
                    "is_weak": False
                },
                {
                    "code": "JAVA_LOOP_CONDITIONS",
                    "name": "Loop Termination & Boolean Conditions",
                    "status": "NEEDS_REVISION",
                    "is_weak": True,
                    "reason": "Student struggles to determine exact state when condition shifts from true to false."
                },
                {
                    "code": "JAVA_LOOP_COUNTER",
                    "name": "Variable Increment Tracking",
                    "status": "LEARNING",
                    "is_weak": False
                }
            ],
            "suspected_weak_node": "JAVA_LOOP_CONDITIONS"
        }

        return {
            "error_summary": error_summary,
            "hypotheses": [h.dict() for h in hypotheses],
            "primary_misconception": hypotheses[0].dict(),
            "diagnostic_question": diag_q.dict(),
            "prerequisite_weakness": prereq_weakness
        }

    @classmethod
    def _analyze_array_error(cls, q: str, student_ans: str, expected_ans: str) -> Dict[str, Any]:
        """Analysis for array indexing and boundary errors."""
        error_summary = f"Student responded '{student_ans}', expected '{expected_ans}'. Likely 0-index vs 1-index confusion."
        hypotheses = [
            MisconceptionHypothesisItem(
                id=1,
                title="Zero-Index vs Length Discrepancy",
                description="Student attempts to access index equal to array.length or misidentifies the first index as 1.",
                evidence_quote=f"Supplied '{student_ans}'",
                related_concept="Array Bounds & 0-Indexing",
                related_concept_code="JAVA_ARRAY_INDEXING",
                confidence=0.91,
                category="Conceptual Misunderstanding",
                citation=Citation(
                    material_name="Java_Arrays_and_Iteration.mp4.transcript",
                    location="Timestamp 03:45",
                    timestamp_seconds=225,
                    excerpt="Remember, Java arrays are zero-indexed. An array of size 5 has valid indices 0 through 4. Index 5 causes an out of bounds error."
                )
            )
        ]
        diag_q = DiagnosticQuestion(
            id="DIAG_ARR_01",
            question="For an array `int[] nums = new int[4];`, what is the index of the final valid element?",
            options=["3", "4", "5", "More evidence needed"],
            target_distinction="Identifies whether student understands array zero-indexing.",
            expected_answer_index=0
        )
        prereq_weakness = {
            "target_concept": {"code": "JAVA_ARRAY_TRAVERSAL", "name": "Array Traversal", "status": "NEEDS_REVISION"},
            "prerequisites": [
                {"code": "JAVA_ARRAY_INDEXING", "name": "Zero-Indexed Bounds", "status": "NEEDS_REVISION", "is_weak": True}
            ],
            "suspected_weak_node": "JAVA_ARRAY_INDEXING"
        }
        return {
            "error_summary": error_summary,
            "hypotheses": [h.dict() for h in hypotheses],
            "primary_misconception": hypotheses[0].dict(),
            "diagnostic_question": diag_q.dict(),
            "prerequisite_weakness": prereq_weakness
        }

    @classmethod
    def _analyze_generic_error(cls, q: str, student_ans: str, expected_ans: str) -> Dict[str, Any]:
        """Generic fallback error analysis."""
        hypotheses = [
            MisconceptionHypothesisItem(
                id=1,
                title="Condition Evaluation Misconception",
                description="Inaccurate interpretation of boolean evaluation order or branching condition.",
                evidence_quote=f"Chose '{student_ans}' instead of '{expected_ans}'",
                related_concept="Boolean Logic & Branching",
                related_concept_code="JAVA_BOOLEAN_LOGIC",
                confidence=0.75,
                category="Conceptual Misunderstanding",
                citation=Citation(
                    material_name="Java_Conditionals_Operators.pptx",
                    location="Slide 2",
                    slide_number=2,
                    excerpt="Condition expressions must strictly evaluate to a boolean primitive in Java."
                )
            )
        ]
        diag_q = DiagnosticQuestion(
            id="DIAG_GEN_01",
            question="What is the result of `(5 > 3) && (2 == 4)` in Java?",
            options=["true", "false", "Compilation Error", "More evidence needed"],
            target_distinction="Tests compound boolean operator evaluation.",
            expected_answer_index=1
        )
        prereq_weakness = {
            "target_concept": {"code": "JAVA_BRANCHING", "name": "Control Flow Branching", "status": "NEEDS_REVISION"},
            "prerequisites": [
                {"code": "JAVA_BOOLEAN_LOGIC", "name": "Boolean Logic", "status": "NEEDS_REVISION", "is_weak": True}
            ],
            "suspected_weak_node": "JAVA_BOOLEAN_LOGIC"
        }
        return {
            "error_summary": f"Mismatch between student answer '{student_ans}' and expected answer '{expected_ans}'.",
            "hypotheses": [h.dict() for h in hypotheses],
            "primary_misconception": hypotheses[0].dict(),
            "diagnostic_question": diag_q.dict(),
            "prerequisite_weakness": prereq_weakness
        }

    @classmethod
    def evaluate_diagnostic_followup(
        cls,
        misconception_id: int,
        selected_option_index: int,
        selected_option_text: str
    ) -> Dict[str, Any]:
        """
        Step C: Process diagnostic follow-up answer and update diagnostic verdict.
        Handles 'More evidence needed' gracefully as requested in prompt.
        """
        if "more evidence needed" in selected_option_text.lower():
            return {
                "misconception_id": misconception_id,
                "is_confirmed": False,
                "revised_confidence": 0.50,
                "diagnosis_verdict": "More Evidence Needed",
                "diagnosis_explanation": "The current responses are insufficient to definitively separate a conceptual boundary error from a calculation slip. Additional practice diagnostics recommended.",
                "weak_prerequisite_confirmed": "JAVA_LOOP_CONDITIONS",
                "more_evidence_needed": True
            }

        # If user picked correct diagnostic option (e.g. index 1 for "4 times")
        # this confirms they DO understand <= when isolated, pointing towards slip or nested complexity.
        # If user picked wrong option (e.g. index 0 "3 times"), confirms off-by-one misconception!
        if selected_option_index == 0: # "3 times" -> strongly confirms off-by-one!
            return {
                "misconception_id": misconception_id,
                "is_confirmed": True,
                "revised_confidence": 0.96,
                "diagnosis_verdict": "Confirmed Conceptual Misconception: Inclusive Boundary Neglect",
                "diagnosis_explanation": "The student systematically stops evaluation when the counter reaches the bound, neglecting the fact that `<=` evaluates to true for that equal value.",
                "weak_prerequisite_confirmed": "JAVA_LOOP_CONDITIONS",
                "more_evidence_needed": False
            }
        elif selected_option_index == 1: # "4 times"
            return {
                "misconception_id": misconception_id,
                "is_confirmed": True,
                "revised_confidence": 0.72,
                "diagnosis_verdict": "Partial Misconception / Execution Slip",
                "diagnosis_explanation": "The student understands simple while loops, but experiences cognitive load breakdown when tracing loop counters within larger code blocks.",
                "weak_prerequisite_confirmed": "JAVA_LOOP_CONDITIONS",
                "more_evidence_needed": False
            }
        else:
            return {
                "misconception_id": misconception_id,
                "is_confirmed": True,
                "revised_confidence": 0.85,
                "diagnosis_verdict": "Confirmed Prerequisite Gap in Loop Termination",
                "diagnosis_explanation": "Uncertainty in loop boundary state progression.",
                "weak_prerequisite_confirmed": "JAVA_LOOP_CONDITIONS",
                "more_evidence_needed": False
            }

    @classmethod
    def generate_recovery_plan(
        cls,
        misconception_id: int,
        weak_concept_code: str = "JAVA_LOOP_CONDITIONS"
    ) -> RecoveryPlanDetail:
        """
        Step E: Generate 5-part personalized recovery sequence grounded in source material.
        1. Source-cited explanation
        2. Worked example
        3. Guided practice question
        4. Independent practice question
        5. Mastery check
        """
        explanation = (
            "In Java, loop termination depends strictly on when the boolean condition evaluates to `false`.\n\n"
            "Key Rule (from Java_Control_Flow_Loops.pdf, Page 3):\n"
            "When looping with an integer counter `i` starting at 0:\n"
            "• `i < N` runs for `i = 0, 1, ..., N-1` (Total: `N` iterations)\n"
            "• `i <= N` runs for `i = 0, 1, ..., N` (Total: `N + 1` iterations)\n\n"
            "Always trace the exact values that `i` assumes during each execution of the loop body!"
        )

        citation = Citation(
            material_name="Java_Control_Flow_Loops.pdf",
            location="Page 3",
            page_number=3,
            excerpt="A common source of errors is off-by-one: `for (int i = 0; i <= n; i++)` iterates `n + 1` times. Verify whether the boundary value `n` should be included."
        )

        worked_example = WorkedExample(
            title="Tracing Inclusive vs Exclusive Loop Bounds",
            code_or_problem=(
                "int sum = 0;\n"
                "for (int i = 1; i <= 3; i++) {\n"
                "    sum += i;\n"
                "}\n"
                "System.out.println(sum);"
            ),
            step_by_step=[
                "Iteration 1: i = 1 (1 <= 3 is true) -> sum = 0 + 1 = 1",
                "Iteration 2: i = 2 (2 <= 3 is true) -> sum = 1 + 2 = 3",
                "Iteration 3: i = 3 (3 <= 3 is true) -> sum = 3 + 3 = 6",
                "Termination: i becomes 4 (4 <= 3 is false) -> loop exits cleanly."
            ],
            key_takeaway="Notice that when i = 3, the condition (3 <= 3) is still true, so iteration 3 definitely executes!"
        )

        guided_practice = PracticeQuestion(
            id="RECOVERY_GUIDED_01",
            prompt="How many times will `for (int k = 0; k < 4; k++)` execute its body?",
            options=["3 times", "4 times", "5 times", "0 times"],
            expected_answer="4 times",
            hint="Remember: Starts at 0 and uses strict less-than `< 4`. Values are 0, 1, 2, 3.",
            explanation="The values for k are 0, 1, 2, and 3. That is exactly 4 iterations. At k = 4, 4 < 4 is false and it stops."
        )

        independent_practice = PracticeQuestion(
            id="RECOVERY_INDEP_01",
            prompt="What is the final printed value of `x` after: `int x = 10; while (x <= 13) { x++; }`?",
            options=["13", "14", "15", "10"],
            expected_answer="14",
            hint="Trace what x is when the while condition `x <= 13` finally fails.",
            explanation="When x is 13, 13 <= 13 is true, so x increments to 14. Then 14 <= 13 is false, exiting with x = 14."
        )

        mastery_check = PracticeQuestion(
            id="RECOVERY_MASTERY_01",
            prompt="Given `int[] arr = {10, 20, 30};` and loop `for (int i = 0; i <= arr.length; i++)`, what happens at runtime?",
            options=[
                "Prints all 3 elements normally",
                "Throws ArrayIndexOutOfBoundsException when i = 3",
                "Infinite loop",
                "Skips the last element"
            ],
            expected_answer="Throws ArrayIndexOutOfBoundsException when i = 3",
            hint="Check the valid index range for an array of length 3 (indices 0, 1, 2).",
            explanation="Valid indices are 0, 1, 2. The loop condition `i <= arr.length` allows i to reach 3 (`arr.length`), causing an exception."
        )

        return RecoveryPlanDetail(
            id=101,
            misconception_id=misconception_id,
            weak_concept_code=weak_concept_code,
            weak_concept_name="Loop Termination Conditions & Boundaries",
            title="Mastering Java Loop Boundary Invariants",
            status="IN_PROGRESS",
            progress_percentage=20,
            explanation_text=explanation,
            source_citation=citation,
            worked_example=worked_example,
            guided_practice=guided_practice,
            independent_practice=independent_practice,
            mastery_check=mastery_check
        )
