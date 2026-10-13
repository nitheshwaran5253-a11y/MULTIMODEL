import json
from starlette.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_endpoints():
    print("--- 1. Testing Root & Health ---")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print("Root OK:", r.json()["project"])

    print("--- 2. Testing Auth / Profile ---")
    r = client.get("/api/auth/me")
    assert r.status_code == 200, f"Auth failed: {r.text}"
    assert r.json()["name"] == "Alex Johnson"
    print("Auth OK:", r.json()["name"])

    print("--- 3. Testing Study Materials ---")
    r = client.get("/api/materials")
    assert r.status_code == 200
    materials = r.json()
    assert len(materials) >= 3, f"Expected 3 materials, got {len(materials)}"
    print(f"Materials OK: Found {len(materials)} multimodal course files")

    # Detail check
    mat_id = materials[0]["id"]
    r = client.get(f"/api/materials/{mat_id}")
    assert r.status_code == 200
    detail = r.json()
    assert len(detail["chunks"]) > 0
    print(f"Material Detail OK: Found {len(detail['chunks'])} chunks for '{detail['material']['title']}'")

    print("--- 4. Testing Source-Grounded AI Tutor (RAG) ---")
    chat_payload = {
        "question": "Can you explain the while loop condition in Java?",
        "mode": "step_by_step"
    }
    r = client.post("/api/tutor/chat", json=chat_payload)
    assert r.status_code == 200, f"Chat failed: {r.text}"
    chat_res = r.json()
    assert len(chat_res["citations"]) > 0, "Expected grounded citations"
    assert chat_res["grounded_in_sources"] is True
    print(f"Tutor Chat OK: Generated answer with {len(chat_res['citations'])} grounding citations")

    # Insufficient evidence test
    chat_neg = {
        "question": "How does quantum quantum superposition work in quantum circuits?",
        "mode": "simple"
    }
    r = client.post("/api/tutor/chat", json=chat_neg)
    assert r.status_code == 200
    assert "couldn't find enough information" in r.json()["answer"].lower()
    print("Tutor Insufficient Evidence check OK: Correctly rejected out-of-scope query")

    print("--- 5. Testing Misconception Lab (Step A through E) ---")
    r = client.get("/api/misconceptions/latest")
    assert r.status_code == 200
    latest_misc = r.json()
    print("Latest Misconception OK:", latest_misc["title"])

    # Step A & B Analysis
    analysis_req = {
        "question_text": "How many times does this loop execute?\n\nfor (int i = 0; i <= 4; i++) { count++; }",
        "student_answer": "4 times",
        "expected_answer": "5 times",
        "question_topic": "Loops & Iteration"
    }
    r = client.post("/api/misconceptions/analyze", json=analysis_req)
    assert r.status_code == 200
    analysis = r.json()
    misc_id = analysis["misconception_id"]
    assert len(analysis["hypotheses"]) >= 2
    assert analysis["diagnostic_question"] is not None
    print(f"Misconception Analysis OK: Generated {len(analysis['hypotheses'])} competing hypotheses")

    # Step C Diagnostic Discriminator Submit
    diag_submit = {
        "misconception_id": misc_id,
        "selected_option_index": 0,
        "selected_option_text": "3 times (stops when c equals 3)"
    }
    r = client.post("/api/misconceptions/diagnostic-followup", json=diag_submit)
    assert r.status_code == 200
    diag_res = r.json()
    assert diag_res["revised_confidence"] >= 0.90
    print("Diagnostic Discriminator OK:", diag_res["diagnosis_verdict"])

    # Step E Recovery Plan
    r = client.get(f"/api/misconceptions/{misc_id}/recovery-plan")
    assert r.status_code == 200
    rec_plan = r.json()
    plan_id = rec_plan["id"]
    print(f"Recovery Plan OK: '{rec_plan['title']}'")

    # Recovery Practice Submit & BKT update
    act_submit = {
        "plan_id": plan_id,
        "step": "guided",
        "submitted_answer": "4 times"
    }
    r = client.post("/api/misconceptions/recovery-activity/submit", json=act_submit)
    assert r.status_code == 200
    assert r.json()["is_correct"] is True
    print("Recovery Guided Check OK: is_correct =", r.json()["is_correct"])

    print("--- 6. Testing Adaptive Assessments ---")
    r = client.get("/api/assessments")
    assert r.status_code == 200
    assessments = r.json()
    print(f"Assessments list OK: Found {len(assessments)} assessments")

    # Generation
    gen_req = {
        "subject": "Java Programming",
        "topic": "Loops & Iteration",
        "num_questions": 3,
        "difficulty": "Medium",
        "question_type": "MCQ"
    }
    r = client.post("/api/assessments/generate", json=gen_req)
    assert r.status_code == 200
    new_a = r.json()
    assert len(new_a["questions"]) == 3
    print(f"Assessment Generation OK: Created assessment #{new_a['id']} with 3 questions")

    # Submit
    submit_req = {
        "assessment_id": new_a["id"],
        "responses": [
            {"question_id": new_a["questions"][0]["id"], "selected_answer": "5 times"},
            {"question_id": new_a["questions"][1]["id"], "selected_answer": "4 times"},
        ]
    }
    r = client.post("/api/assessments/submit", json=submit_req)
    assert r.status_code == 200
    eval_res = r.json()
    print(f"Assessment Submit OK: Score = {eval_res['score_percentage']}%")

    print("--- 7. Testing Prerequisite Learning Path DAG ---")
    r = client.get("/api/learning-path/graph")
    assert r.status_code == 200
    graph = r.json()
    assert len(graph["nodes"]) >= 9
    assert len(graph["edges"]) >= 8
    print(f"Learning Path OK: DAG contains {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")

    print("--- 8. Testing Progress Analytics & Dashboard ---")
    r = client.get("/api/analytics/dashboard")
    assert r.status_code == 200
    dash = r.json()
    assert dash["concepts_mastered"] >= 1
    assert dash["concepts_needing_revision"] >= 1
    print("Dashboard Summary OK: Mastered =", dash["concepts_mastered"], "Needs Revision =", dash["concepts_needing_revision"])

    r = client.get("/api/analytics/progress")
    assert r.status_code == 200
    prog = r.json()
    assert len(prog["bkt_mastery_by_concept"]) >= 9
    print(f"BKT Analytics OK: Tracing {len(prog['bkt_mastery_by_concept'])} skills with Bayesian model")

    print("--- 9. Testing Evaluation Benchmark Harness ---")
    r = client.get("/api/evaluation/run")
    assert r.status_code == 200
    bench = r.json()
    assert bench["summary_metrics"]["faithfulness"] >= 90
    print(f"System Benchmark OK: Faithfulness = {bench['summary_metrics']['faithfulness']}%, Pre/Post Gain = +{bench['summary_metrics']['pre_post_mastery_delta']}%")

    print("--- 10. Testing Settings ---")
    r = client.get("/api/settings")
    assert r.status_code == 200
    settings = r.json()
    print(f"Settings OK: Demo Mode = {settings['demo_mode']}, Database = {settings['database_url']}")

    print("\n==========================================")
    print("ALL 10 MODULE TEST SUITES PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    test_endpoints()
