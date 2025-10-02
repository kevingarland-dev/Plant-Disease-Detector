from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np 
from io import BytesIO
from PIL import Image
import tensorflow as tf



app = FastAPI()

# Enable CORS for local testing and simple frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL = tf.keras.models.load_model("plant_disease_1.h5")
CLASS_NAMES = ["Corn Cercospora leaf spot Gray leaf spot", 'Corn Common_rust_',
 'Corn_(maize)___Northern_Leaf_Blight',
 'Corn_(maize)___healthy',
 'Potato___Early_blight',
 'Potato___Late_blight',
 'Potato___healthy',
 'Tomato___Bacterial_spot',
 'Tomato___Early_blight',
 'Tomato___Late_blight',
 'Tomato___Leaf_Mold',
 'Tomato___Septoria_leaf_spot',
 'Tomato___Spider_mites Two-spotted_spider_mite',
 'Tomato___Target_Spot',
 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
 'Tomato___Tomato_mosaic_virus',
 'Tomato___healthy']


@app.get("/plantApi")
async def plantApi():
    return "Plant disease prediction api"

def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert("RGB")
    # Model contains its own Resizing and Rescaling layers, so pass raw RGB
    # without additional resizing or normalization to avoid double scaling.
    image_array = np.array(image)
    return image_array

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)
    
    predictions = MODEL.predict(img_batch)
    probabilities = predictions[0]
    predicted_index = int(np.argmax(probabilities))
    confidence = float(np.max(probabilities))
    predicted_class = CLASS_NAMES[predicted_index] if predicted_index < len(CLASS_NAMES) else str(predicted_index)
    
    # Top-3 diagnostics
    top_indices = np.argsort(probabilities)[-3:][::-1]
    top3 = [
        {
            "index": int(i),
            "class": CLASS_NAMES[int(i)] if int(i) < len(CLASS_NAMES) else str(int(i)),
            "confidence": float(probabilities[int(i)])
        }
        for i in top_indices
    ]
    
    # Validate label mapping size against model outputs
    num_outputs = int(probabilities.shape[-1])
    labels_mismatch = (len(CLASS_NAMES) != num_outputs)
    
    return {
        "class": predicted_class,
        "confidence": confidence,
        "index": predicted_index,
        "top3": top3,
        "labels_mismatch": labels_mismatch,
        "num_outputs": num_outputs,
        "num_labels": len(CLASS_NAMES)
    }

 
if __name__ == "__main__":
    uvicorn.run (app, host = "localhost", port = 8080)
