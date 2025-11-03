# Hugging Face Spaces Deployment Checklist

## ✅ Files Created

- [x] `dockerfile` - Docker configuration for Hugging Face Spaces
- [x] `.dockerignore` - Excludes unnecessary files from Docker build
- [x] `.gitattributes` - Git LFS tracking for model files
- [x] `HUGGINGFACE_DEPLOYMENT.md` - Detailed deployment guide

## 📋 Pre-Deployment Checklist

### Required Files (verify these exist)
- [x] `plantapi.py` - FastAPI backend
- [x] `requirements.txt` - Python dependencies
- [x] `plant_disease_dataset.json` - Disease information
- [x] `plant_disease_1.h5` - Trained model (~3MB)
- [x] `build/` - React frontend build directory
- [x] `static/` - Static assets (if any)

### Optional Fixes

#### 1. Fix `home.html` Reference (Recommended)
The API references `home.html` at line 85, but this file doesn't exist. You should either:

**Option A:** Remove the root endpoint (if not needed)
```python
# Remove or comment out lines 83-86 in plantapi.py
```

**Option B:** Change it to serve the React app
```python
@app.get("/", response_class=FileResponse)
async def root():
    file_path = os.path.join("build", "index.html")
    return FileResponse(file_path, media_type="text/html")
```

#### 2. Environment Variables
Your LiveKit credentials are hardcoded in `plantapi.py`. For production:

1. Remove hardcoded values from lines 25-27
2. Set them as Hugging Face Space secrets
3. Use only environment variables:
```python
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
```

## 🚀 Quick Deployment Steps

1. **Create Hugging Face Space**
   - Go to https://huggingface.co/spaces
   - Click "Create new Space"
   - Choose **Docker** SDK
   - Name it (e.g., "plantsense-ai")

2. **Clone Your Space**
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   cd YOUR_SPACE_NAME
   ```

3. **Copy Files**
   Copy these files to your Space directory:
   - `dockerfile` (rename to `Dockerfile` if needed)
   - `plantapi.py`
   - `requirements.txt`
   - `plant_disease_dataset.json`
   - `plant_disease_1.h5`
   - `build/` (entire directory)
   - `static/` (if exists)

4. **Setup Git LFS**
   ```bash
   git lfs install
   git lfs track "*.h5"
   git add .gitattributes
   ```

5. **Create README.md**
   ```markdown
   ---
   title: PlantSense AI
   emoji: 🌱
   colorFrom: green
   colorTo: blue
   sdk: docker
   pinned: false
   ---
   
   # PlantSense AI
   
   Plant disease detection using deep learning.
   ```

6. **Push to Hugging Face**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push
   ```

7. **Configure Secrets** (if needed)
   - Go to Space Settings → Variables and secrets
   - Add: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`

## 🧪 Local Testing

Test before deploying:

```bash
# Build Docker image
docker build -t plantsense-test .

# Run container
docker run -p 7860:7860 plantsense-test

# Test at http://localhost:7860
```

## 📊 Expected Results

- **Build Time:** 5-10 minutes (first time)
- **App URL:** `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`
- **Port:** 7860 (configured in Dockerfile)
- **Storage:** ~3MB for model + ~1MB for other files

## 🔍 Troubleshooting

### Build Fails
- Check Logs tab in Hugging Face Space
- Verify all files are present
- Ensure requirements.txt is correct

### Model Not Loading
- Verify Git LFS is tracking .h5 files: `git lfs ls-files`
- Check file was pushed: should show pointer, not full file

### App Not Accessible
- Ensure port 7860 is exposed
- Check uvicorn is running on 0.0.0.0:7860
- Review application logs

## 📚 Resources

- Full guide: `HUGGINGFACE_DEPLOYMENT.md`
- Hugging Face Docs: https://huggingface.co/docs/hub/spaces-sdks-docker
- Git LFS: https://git-lfs.github.com/
