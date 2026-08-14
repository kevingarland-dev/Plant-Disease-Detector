"""
Quick test script for the PlantSense plant disease model.
Usage: python test_model.py <path_to_image>
Example: python test_model.py test.jpg
"""

import sys
import numpy as np
import tensorflow as tf
from PIL import Image

MODEL_PATH = "plant_disease_1.h5"
CONFIDENCE_THRESHOLD = 70.0

CLASS_NAMES = [
    "Corn Cercospora leaf spot Gray leaf spot", "Corn Common rust",
    "Corn (maize) Northern Leaf Blight", "Corn (maize) healthy",
    "Potato Early blight", "Potato Late_blight", "Potato healthy",
    "Tomato Bacterial spot", "Tomato Early blight", "Tomato Late blight",
    "Tomato Leaf Mold", "Tomato Septoria leaf spot",
    "Tomato Spider mites Two-spotted spider mite", "Tomato Target Spot",
    "Tomato Yellow Leaf Curl Virus", "Tomato mosaic virus",
    "Tomato healthy"
]

def predict(image_path: str):
    print(f"\n📂 Loading model from '{MODEL_PATH}'...")
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded.\n")

    print(f"🖼️  Processing image: {image_path}")
    image = Image.open(image_path).convert("RGB").resize((256, 256))
    img_array = np.array(image, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)

    print("🔍 Running prediction...\n")
    predictions = model.predict(img_batch, verbose=0)[0]

    # Top prediction
    top_idx = int(np.argmax(predictions))
    top_conf = float(predictions[top_idx]) * 100
    top_class = CLASS_NAMES[top_idx]

    # Top 3
    top3_indices = np.argsort(predictions)[-3:][::-1]

    print("=" * 50)
    if top_conf >= CONFIDENCE_THRESHOLD:
        print(f"✅ Detected: {top_class}")
    else:
        print(f"⚠️  Low confidence — Suspected: {top_class}")
    print(f"   Confidence: {top_conf:.2f}%")
    print("\n📊 Top 3 Predictions:")
    for i, idx in enumerate(top3_indices, 1):
        print(f"   {i}. {CLASS_NAMES[idx]:<50} {predictions[idx]*100:.2f}%")
    print("=" * 50)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_model.py <path_to_image>")
        print("Example: python test_model.py leaf.jpg")
        sys.exit(1)
    predict(sys.argv[1])
