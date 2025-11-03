---
title: PlantSense AI
emoji: 🌱
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# 🌱 PlantSense AI - Plant Disease Detector

An intelligent plant disease detection system powered by deep learning and computer vision. Upload an image of your plant, and get instant diagnosis with detailed treatment recommendations.

## 🚀 Features

- **AI-Powered Detection**: Uses a trained TensorFlow model to identify 17 different plant diseases
- **Multi-Crop Support**: Detects diseases in Corn, Potato, and Tomato plants
- **Detailed Information**: Provides symptoms, causes, and treatment recommendations
- **Confidence Scoring**: Shows prediction confidence with top-3 alternative diagnoses
- **Voice Assistant**: Integrated LiveKit voice assistant for hands-free interaction
- **Modern UI**: Beautiful React-based frontend with responsive design

## 🔬 Supported Diseases

### Corn
- Cercospora leaf spot / Gray leaf spot
- Common rust
- Northern Leaf Blight
- Healthy

### Potato
- Early blight
- Late blight
- Healthy

### Tomato
- Bacterial spot
- Early blight
- Late blight
- Leaf Mold
- Septoria leaf spot
- Spider mites (Two-spotted spider mite)
- Target Spot
- Yellow Leaf Curl Virus
- Mosaic virus
- Healthy

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React
- **ML Framework**: TensorFlow/Keras
- **Model**: Custom CNN trained on plant disease dataset
- **Voice**: LiveKit integration
- **Deployment**: Docker on Hugging Face Spaces

## 📊 Model Information

- **Architecture**: Convolutional Neural Network (CNN)
- **Input Size**: 256x256 RGB images
- **Classes**: 17 (including healthy states)
- **Confidence Threshold**: 70%
- **Model Size**: ~3MB

## 🎯 How to Use

1. **Upload Image**: Click the upload button and select a clear image of the affected plant
2. **Get Diagnosis**: The AI will analyze the image and provide:
   - Disease name
   - Confidence score
   - Top 3 predictions
   - Detailed description and treatment
3. **Review Results**: Read the symptoms, causes, and recommended treatments
4. **Voice Assistant** (Optional): Use the voice feature for hands-free interaction

## 📸 Image Guidelines

For best results:
- Use clear, well-lit photos
- Focus on the affected leaves or plant parts
- Avoid blurry or dark images
- Ensure the plant fills most of the frame
- Maximum file size: 10MB

## 🔒 Privacy

- Images are processed in real-time and not stored
- No personal data is collected
- All processing happens on the server

## 🤝 Contributing

This project is part of ongoing research in agricultural AI. Feedback and contributions are welcome!

## 📝 License

This project is for educational and research purposes.

## 🙏 Acknowledgments

- Plant disease dataset from PlantVillage
- Built with FastAPI, React, and TensorFlow
- Deployed on Hugging Face Spaces

## 📧 Contact

For questions or feedback, please open an issue on the repository.

---

**Note**: This AI system is a diagnostic aid and should not replace professional agricultural advice. Always consult with agricultural experts for serious plant health issues.
