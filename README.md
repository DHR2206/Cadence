# Cadence – AI-Powered Deadline Collision Predictor & Academic Planner

## 🚀 Overview

Cadence is an AI-powered academic planning platform designed to help university students proactively manage their workload.

Unlike traditional planners that only display deadlines, Cadence predicts workload-heavy weeks before they happen, identifies deadline collisions, and generates balanced study schedules to reduce stress, prevent burnout, and improve academic performance.

Built during the 7-Day AI Buildathon organized by AI Club, Dhirubhai Ambani University.

---

## 🎯 Problem Statement

Students manage assignments, quizzes, projects, exams, club activities, and personal commitments across multiple platforms such as Moodle, Google Classroom, calendars, notices, and messaging groups.

Current tools show due dates but fail to answer critical questions:

* When will my workload become overwhelming?
* Which deadlines are causing the problem?
* How should I redistribute my effort beforehand?

As a result, students often discover workload overload too late, leading to stress, poor planning, and last-minute cramming.

Cadence addresses this challenge through intelligent workload forecasting and automated study planning.

---

## ✨ Key Features

### Smart Deadline Collision Detection

Identifies overlapping assignments, quizzes, projects, and exams before they create workload bottlenecks.

### Workload Forecasting

Predicts upcoming high-pressure weeks and visualizes workload distribution across the semester.

### AI-Powered Study Plan Generation

Automatically generates balanced study schedules based on:

* Deadline priority
* Difficulty level
* Estimated effort
* Available study hours

### Risk Analysis Dashboard

Provides an overview of:

* Upcoming deadlines
* Workload intensity
* Collision severity
* Planning recommendations

### Adaptive Planning

Updates schedules when new tasks, deadlines, or priorities are introduced.

### Academic Productivity Insights

Helps students distribute effort more effectively throughout the semester.

---

## 🏗 Architecture

Student Input
↓
Deadline & Task Analysis
↓
Workload Prediction Engine
↓
Collision Detection System
↓
Schedule Optimization Engine
↓
Personalized Study Plan
↓
Interactive Dashboard

---

## 🛠 Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Lucide React

### Backend

* FastAPI
* Python
* Pydantic

### Scheduling Engine

* Rule-Based Planning System
* Workload Forecasting Algorithms
* Deadline Collision Detection Logic

### Testing

* Pytest

### Deployment

* Vercel

---

## 🤖 AI Tools & Technologies Used

The following AI tools were used during development:

### Development Assistance

* ChatGPT (OpenAI)
* Claude (Anthropic)

### Planned AI Enhancements

* Effort estimation using LLMs
* Personalized study recommendations
* Intelligent workload balancing
* Natural-language schedule explanations

No proprietary datasets were used. Current planning logic operates on user-provided academic data and sample semester datasets.

---

## 📊 Impact

Cadence aims to help students:

* Reduce workload spikes
* Avoid deadline collisions
* Improve time management
* Reduce academic stress
* Increase productivity
* Better balance academics and extracurricular activities

Target users include over 1,500+ university students managing multiple academic responsibilities each semester.

---

## 🌍 SDG Alignment

### SDG 3 – Good Health and Well-Being

Supports student well-being by reducing stress and burnout caused by workload overload.

### SDG 4 – Quality Education

Improves learning outcomes through better planning, time management, and study consistency.

---

## 🔮 Future Roadmap

* Moodle integration
* Google Classroom integration
* Calendar synchronization
* Persistent user accounts
* Cloud database support
* Push notifications
* Email reminders
* AI-generated productivity insights
* Mobile application
* Collaborative group project planning
* Calendar export functionality

---

## 📂 Repository Structure

cadence/

├── frontend/

├── backend/

├── models/

├── docs/

├── assets/

├── BLOG.md

├── README.md

└── LICENSE

---

## ⚙️ Local Setup

### Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

Health Check

```bash
curl http://localhost:8000/health
```

Run Tests

```bash
pytest backend/tests
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🌐 Deployment

Live Application:

https://cadence-seven-eta.vercel.app/

GitHub Repository:

https://github.com/DHR2206/cadence

---

## 👥 Team - Neural Nexus

### Tanvi Nakum

* UI/UX Design
* Frontend Development
* Database Design

### Daksh Rathod

* Backend Development
* AI/ML Logic
* Deployment & Infrastructure
