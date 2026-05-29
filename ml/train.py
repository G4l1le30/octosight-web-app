#!/usr/bin/env python3
"""
Train the OctoSight phishing/spam detection model.

Usage:
    python ml/train.py --data-path data.csv --output-dir ml/artifacts

If --data-path is omitted, the script uses three default datasets
(SMS Spam Collection, HuggingFace multilingual, and an Indonesian SMS set).

Output:
    - ml/artifacts/model.pkl         (scikit-learn Pipeline)
    - ml/artifacts/eval_report.json  (accuracy, F1, confusion matrix)
"""

import argparse
import json
import os
import sys

import joblib
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_AVAILABLE = True
except ImportError:
    SENTENCE_AVAILABLE = False


class SentenceTransformerWrapper(BaseEstimator, TransformerMixin):
    def __init__(self, model_name="paraphrase-multilingual-MiniLM-L12-v2"):
        self.model_name = model_name
        if not SENTENCE_AVAILABLE:
            raise RuntimeError("sentence-transformers is not installed")
        self.model = SentenceTransformer(model_name)

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return self.model.encode(X, show_progress_bar=False)


def load_datasets(data_path: str | None) -> pd.DataFrame:
    if data_path and os.path.exists(data_path):
        df = pd.read_csv(data_path)
        if "text" in df.columns and "label" in df.columns:
            return df
        raise ValueError("CSV must have 'text' and 'label' columns")

    print("[train] Loading default datasets...")

    urls = [
        ("https://drive.google.com/uc?id=1d_KwNxymj9aNaS8LfUWLSRy1qwZYifsF", None),
        ("https://drive.google.com/uc?id=1oYpYXhyQSmyD9knESpXcTuJWvx3KvAzL", "latin-1"),
    ]

    frames = []

    df_hf = pd.read_csv(
        "hf://datasets/ashu0311/SMS_Spam_Multilingual_Collection_Dataset/data-augmented.csv"
    )
    df_hf = df_hf[["text_id", "labels"]].rename(columns={"text_id": "text", "labels": "label"})
    frames.append(df_hf)

    for url, encoding in urls:
        try:
            df = pd.read_csv(url, encoding=encoding) if encoding else pd.read_csv(url)
            if "v1" in df.columns and "v2" in df.columns:
                df = df[["v2", "v1"]].rename(columns={"v2": "text", "v1": "label"})
            elif "Pesan" in df.columns and "Kategori" in df.columns:
                df = df[["Pesan", "Kategori"]].rename(columns={"Pesan": "text", "Kategori": "label"})
            else:
                continue
            frames.append(df)
        except Exception as e:
            print(f"[train] Skipping {url}: {e}")

    data = pd.concat(frames, ignore_index=True)
    data = data.dropna(subset=["text", "label"])
    data = data.drop_duplicates()

    mapping = {"ham": "not phishing", "spam": "phishing"}
    data["label"] = data["label"].map(mapping).fillna(data["label"])

    return data


def train(args: argparse.Namespace) -> None:
    os.makedirs(args.output_dir, exist_ok=True)

    print("[train] Loading dataset...")
    data = load_datasets(args.data_path)
    print(f"[train] Loaded {len(data)} samples")

    X_text = data["text"].tolist()
    y_label = data["label"].tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X_text, y_label, test_size=args.test_size, random_state=args.random_state
    )

    print("[train] Training pipeline...")
    pipeline = Pipeline([
        ("embedder", SentenceTransformerWrapper(args.model_name)),
        ("classifier", LogisticRegression(max_iter=1000)),
    ])
    pipeline.fit(X_train, y_train)

    print("[train] Evaluating...")
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    model_path = os.path.join(args.output_dir, "model.pkl")
    joblib.dump(pipeline, model_path)
    print(f"[train] Model saved to {model_path}")

    SentenceTransformerWrapper.__module__ = "__main__"
    joblib.dump(pipeline.named_steps["embedder"], os.path.join(args.output_dir, "vectorizer.pkl"))

    report_path = os.path.join(args.output_dir, "eval_report.json")
    eval_data = {
        "accuracy": round(accuracy, 4),
        "f1_weighted": round(f1, 4),
        "classification_report": report,
        "confusion_matrix": cm,
        "model_name": args.model_name,
        "test_size": args.test_size,
        "samples": len(data),
    }
    with open(report_path, "w") as f:
        json.dump(eval_data, f, indent=2)
    print(f"[train] Eval report saved to {report_path}")
    print(f"[train] Accuracy: {accuracy:.4f} | F1: {f1:.4f}")


def main():
    parser = argparse.ArgumentParser(description="Train OctoSight spam detection model")
    parser.add_argument("--data-path", default=None, help="Path to CSV with 'text' and 'label' columns")
    parser.add_argument("--output-dir", default="ml/artifacts", help="Directory to save model and eval report")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--model-name",
        default="paraphrase-multilingual-MiniLM-L12-v2",
        help="SentenceTransformer model name",
    )
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
