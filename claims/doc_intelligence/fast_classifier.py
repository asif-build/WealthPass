"""
Layer B: Lightweight TF-IDF + Logistic Regression Classifier.
Sub-millisecond inference with calibrated confidence scoring.
Routes ambiguous predictions to Layer C (Baseline Escalation).
"""
import os
import joblib
from typing import Tuple, List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from .schemas import DocumentCategory


CONFIDENCE_THRESHOLD = 0.80
AMBIGUITY_MARGIN = 0.15
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "tfidf_lr_pipeline.joblib")


class FastDocumentClassifier:
    """
    Green AI fast classifier pipeline:
    TfidfVectorizer(ngram_range=(1,2), max_features=3000, sublinear_tf=True)
    + LogisticRegression(C=2.0, max_iter=500, solver='lbfgs')
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.pipeline: Optional[Pipeline] = None
        self.classes_: List[str] = [c.value for c in DocumentCategory]

    def train(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Trains the TF-IDF + Logistic Regression pipeline on synthetic train split."""
        texts = [doc["text"] for doc in training_data]
        labels = [doc["category"] for doc in training_data]

        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=3000,
                sublinear_tf=True,
                token_pattern=r'(?u)\b\w+\b'
            )),
            ("clf", LogisticRegression(
                C=2.0,
                max_iter=500,
                solver="lbfgs"
            ))
        ])

        self.pipeline.fit(texts, labels)
        self.classes_ = list(self.pipeline.named_steps["clf"].classes_)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)

        train_acc = self.pipeline.score(texts, labels)
        return {
            "samples_trained": len(texts),
            "train_accuracy": float(train_acc),
            "vocab_size": len(self.pipeline.named_steps["tfidf"].vocabulary_),
            "model_path": self.model_path
        }

    def load(self) -> bool:
        """Loads serialized pipeline from disk."""
        if os.path.exists(self.model_path):
            self.pipeline = joblib.load(self.model_path)
            self.classes_ = list(self.pipeline.named_steps["clf"].classes_)
            return True
        return False

    def predict(self, text: str) -> Tuple[DocumentCategory, float, bool, Dict[str, float]]:
        """
        Infers document category and calibrated probability.
        Returns:
            (predicted_category, confidence_score, should_escalate, probabilities_dict)
        """
        if self.pipeline is None:
            if not self.load():
                raise RuntimeError("FastDocumentClassifier has not been trained or loaded.")

        clean_input = text.strip() if text else ""
        if not clean_input:
            return (DocumentCategory.UNKNOWN_OR_OTHER, 1.0, False, {})

        probs = self.pipeline.predict_proba([clean_input])[0]
        prob_dict = {cls_name: float(prob) for cls_name, prob in zip(self.classes_, probs)}

        sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
        top_cat_str, top_prob = sorted_probs[0]
        second_cat_str, second_prob = sorted_probs[1] if len(sorted_probs) > 1 else ("", 0.0)

        # Confidence and ambiguity escalation checks
        margin = top_prob - second_prob
        should_escalate = (top_prob < CONFIDENCE_THRESHOLD) or (margin < AMBIGUITY_MARGIN)

        predicted_category = DocumentCategory(top_cat_str)
        return (predicted_category, top_prob, should_escalate, prob_dict)
