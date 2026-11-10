# MakeCourse 🎓

> **Turn Any YouTube Video or Playlist into an Interactive, Structured Masterclass.**  
> A full-featured recreation and evolution of [CourseIt](https://www.courseit.xyz/).

---

## 🚀 Overview

Studying from multi-hour YouTube videos or playlists often leads to tutorial fatigue, losing track of progress, and getting distracted by recommended video feeds.

**MakeCourse** solves this by analyzing any YouTube video or playlist and converting it into a daily structured course complete with:
1. **Diagnostic Placement Tests**: Test what you already know to trim redundant lessons from your schedule.
2. **Paced Daily Schedules**: Set your daily availability (e.g. 15, 30, 45, or 60 min/day) to generate a realistic study roadmap.
3. **Distraction-Free Video Player**: Clean YouTube player stripped of recommendations, sidebar feeds, and comments.
4. **"Replay the Moment" Interactive Quizzes**: When a question is answered incorrectly, click **"Replay the Moment"** to automatically jump the video player to the exact second where that concept was taught.
5. **Synchronized AI Notes**: Rich markdown notes, code blocks, and key takeaways for every lesson.
6. **Completion Certificate**: Earn a verified certificate upon 100% course completion.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Video Engine**: YouTube IFrame Player API (with synchronized time seeking)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) + Intelligent Heuristic Fallback
- **Effects**: Canvas Confetti

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create a `.env.local` file:
```env
# Optional: Provide your Gemini API key for bespoke customized AI generation.
# If omitted, MakeCourse uses the built-in intelligent synthesizer.
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🚢 Ready to Deploy

### Deploy to Vercel (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of MakeCourse"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/MakeCourse.git
   git push -u origin main
   ```
2. Import the repository on [Vercel](https://vercel.com/new).
3. Add `GEMINI_API_KEY` under Environment Variables (optional).
4. Click **Deploy**!
