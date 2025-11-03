# Hugging Face Spaces Deployment Guide

This guide will help you deploy your PlantSense AI application to Hugging Face Spaces.

## Prerequisites

1. A Hugging Face account (sign up at https://huggingface.co/)
2. Git installed on your machine
3. Git LFS installed (for large model files)

## Deployment Steps

### 1. Create a New Space

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Choose a name for your Space (e.g., "plantsense-ai")
4. Select **Docker** as the Space SDK
5. Choose visibility (Public or Private)
6. Click "Create Space"

### 2. Install Git LFS (if not already installed)

```bash
# On Windows (using Git for Windows)
git lfs install

# On macOS
brew install git-lfs
git lfs install

# On Linux
sudo apt-get install git-lfs
git lfs install
```

### 3. Clone Your Space Repository

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME
```

### 4. Copy Your Project Files

Copy the following files from your project to the cloned Space directory:

- `dockerfile` (or rename to `Dockerfile`)
- `plantapi.py`
- `requirements.txt`
- `plant_disease_dataset.json`
- `plant_disease_1.h5` (model file)
- `build/` directory (React frontend)
- `static/` directory (if exists)

### 5. Track Large Files with Git LFS

```bash
# Track the model file with Git LFS
git lfs track "*.h5"
git add .gitattributes
```

### 6. Create a README for Your Space

Create a `README.md` file in your Space directory with the following header:

```markdown
---
title: PlantSense AI
emoji: 🌱
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# PlantSense AI - Plant Disease Detector

An AI-powered plant disease detection system using deep learning.

## Features

- Upload plant images for disease detection
- Get detailed disease information and remedies
- Voice assistant integration
- Support for Corn, Potato, and Tomato plants
```

### 7. Push to Hugging Face

```bash
git add .
git commit -m "Initial deployment"
git push
```

### 8. Monitor Deployment

1. Go to your Space URL: `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`
2. The Space will automatically build your Docker container
3. Check the "Logs" tab to monitor the build process
4. Once built, your app will be accessible at the Space URL

## Important Notes

### Port Configuration

- Hugging Face Spaces expects your app to run on port **7860**
- The Dockerfile is already configured for this

### Environment Variables

If you need to set environment variables (like LiveKit credentials):

1. Go to your Space settings
2. Click on "Variables and secrets"
3. Add your environment variables:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`

### File Size Limits

- Hugging Face Spaces has a 50GB storage limit
- Model files larger than 10MB should be tracked with Git LFS
- Your `plant_disease_1.h5` file (~3MB) is within limits

### Build Time

- Initial build may take 5-10 minutes
- Subsequent builds will be faster due to Docker layer caching

## Troubleshooting

### Build Fails

- Check the Logs tab for error messages
- Ensure all required files are present
- Verify `requirements.txt` has all dependencies

### App Not Loading

- Check if the app is listening on port 7860
- Verify the `CMD` in Dockerfile is correct
- Check application logs in the Space

### Model Not Loading

- Ensure `plant_disease_1.h5` is tracked with Git LFS
- Verify the file was pushed correctly: `git lfs ls-files`
- Check file permissions in the Dockerfile

## Local Testing

Before deploying, test your Docker container locally:

```bash
# Build the image
docker build -t plantsense-ai .

# Run the container
docker run -p 7860:7860 plantsense-ai

# Access at http://localhost:7860
```

## Updating Your Space

To update your deployed Space:

```bash
# Make your changes
git add .
git commit -m "Update description"
git push
```

The Space will automatically rebuild and redeploy.

## Resources

- [Hugging Face Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- [Docker Spaces Guide](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [Git LFS Documentation](https://git-lfs.github.com/)
