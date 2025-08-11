# 🚀 ON TOP - OpenAI Emma Setup Instructions

## ⚡ Quick Setup (5 minutes)

### 1. **Install Backend Dependencies**
```bash
npm install
```

### 2. **Create Your OpenAI API Key**
- Go to https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### 3. **Create .env File**
Create a file called `.env` in this directory with:
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=3001
NODE_ENV=development
OPENAI_MODEL=gpt-4o-mini
```

### 4. **Start Both Servers**

**Terminal 1 - Backend (Emma AI):**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
```

### 5. **Open Your App**
- Go to http://localhost:8000
- Emma will now be powered by GPT-4! 🧠✨

## 🎯 What You Get

- **Human-like conversations** - Emma responds naturally, not robotically
- **Cognitive therapy techniques** - Professional therapeutic responses  
- **Memory & context** - Emma remembers your conversations
- **Emotional intelligence** - Recognizes and responds to your emotions
- **Continuous dialogue** - No more repetitive responses!

## 💡 Cost
- ~$5-10/month for normal usage
- Each conversation costs ~$0.01-0.05
- Very affordable for therapeutic conversations!

## 🔧 Troubleshooting

**Emma gives fallback responses?**
- Check backend is running on http://localhost:3001
- Verify your OpenAI API key is correct
- If running the native app, ensure your frontend is using an HTTPS production API base URL (do not use localhost in release).

**Backend not starting?**
- Run `npm install` first
- Make sure `.env` file exists with your API key

**Need help?**
- Check console logs in browser dev tools
- Check terminal output for error messages