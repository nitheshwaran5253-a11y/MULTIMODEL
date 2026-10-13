import json
from typing import Dict, Any, Tuple

class BKTEngine:
    """
    Bayesian Knowledge Tracing (BKT) engine.
    Computes transparent posterior mastery probabilities based on evidence sequence,
    accounting for slip and guess probabilities.
    """

    # Default parameters for CS / Programming concepts
    DEFAULT_PARAMS = {
        "p_init": 0.30,   # P(L_0): Prior probability student knows concept
        "p_transit": 0.15, # P(T): Transition probability of learning between opportunities
        "p_slip": 0.10,    # P(S): Probability student knows skill but slips
        "p_guess": 0.20    # P(G): Probability student doesn't know skill but guesses right
    }

    @classmethod
    def update_mastery(
        cls,
        current_p_l: float,
        is_correct: bool,
        params: Dict[str, float] | None = None
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculates updated mastery probability using Bayesian formula.
        Returns: (new_p_l, trace_details)
        """
        p = params or cls.DEFAULT_PARAMS
        p_transit = p.get("p_transit", 0.15)
        p_slip = p.get("p_slip", 0.10)
        p_guess = p.get("p_guess", 0.20)

        # 1. Compute posterior given current evidence
        if is_correct:
            numerator = current_p_l * (1.0 - p_slip)
            denominator = numerator + ((1.0 - current_p_l) * p_guess)
        else:
            numerator = current_p_l * p_slip
            denominator = numerator + ((1.0 - current_p_l) * (1.0 - p_guess))

        if denominator < 1e-9:
            p_posterior = current_p_l
        else:
            p_posterior = numerator / denominator

        # 2. Account for learning transition
        new_p_l = p_posterior + (1.0 - p_posterior) * p_transit
        # Clamp to [0.01, 0.99]
        new_p_l = max(0.01, min(0.99, new_p_l))

        trace = {
            "prior_mastery": round(current_p_l, 4),
            "evidence": "correct" if is_correct else "incorrect",
            "posterior_evidence": round(p_posterior, 4),
            "updated_mastery": round(new_p_l, 4),
            "parameters": p,
            "status": cls.get_status(new_p_l)
        }

        return new_p_l, trace

    @staticmethod
    def get_status(p_l: float, has_active_misconception: bool = False) -> str:
        if has_active_misconception or p_l < 0.50:
            return "NEEDS_REVISION"
        elif p_l >= 0.85:
            return "MASTERED"
        else:
            return "LEARNING"
