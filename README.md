# BE-09 AI Decision Flow

A visual AI decision workflow system built with React Flow, Inngest, and OpenRouter.

## Features

- Visual workflow editor using React Flow
- Add and edit AI decision nodes
- YES / NO branching
- Dynamic workflow traversal
- Inngest workflow execution
- OpenRouter LLM integration
- AI responses restricted to YES / NO
- Execution log panel
- JSON workflow export
- JSON workflow import
- Local workflow persistence
- Visual execution status
- Error handling

## Architecture

React Flow
    ↓
React + Vite
    ↓
Express API
    ↓
Inngest
    ↓
OpenRouter LLM
    ↓
YES / NO decision
    ↓
Next workflow node

## Technologies

- React
- Vite
- React Flow
- Express
- Inngest
- OpenAI SDK
- OpenRouter
- Tailwind CSS
- shadcn/ui

## Project Structure

```text
fly-frentend/
├── src/
│   ├── App.jsx
│   ├── DecisionNode.jsx
│   └── index.css
│
├── server/
│   ├── index.js
│   ├── inngest.js
│   └── workflow.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md