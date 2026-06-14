import { Router } from "express";
import { CRISIS_RESOURCES } from "../config/sentiment.js";

export const resourceApp = Router();

const RESOURCES = [
  {
    id: "exam-stress",
    title: "Managing Exam Stress",
    category: "Academic Stress",
    readTime: "4 min",
    summary: "Simple steps to reduce pressure before exams and avoid last-minute panic.",
    tips: ["Break chapters into small targets", "Use 25-minute focus sessions", "Sleep before exams", "Ask for help early"],
  },
  {
    id: "breathing",
    title: "2-Minute Breathing Exercise",
    category: "Calming Exercise",
    readTime: "2 min",
    summary: "A quick grounding method when anxiety feels high.",
    tips: ["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 6 seconds", "Repeat 5 times"],
  },
  {
    id: "loneliness",
    title: "When You Feel Alone",
    category: "Loneliness",
    readTime: "3 min",
    summary: "Practical actions to reconnect safely and reduce isolation.",
    tips: ["Message one trusted person", "Join a low-pressure group", "Write what you are feeling", "Speak with a counselor"],
  },
  {
    id: "sleep",
    title: "Sleep Reset for Students",
    category: "Self Care",
    readTime: "3 min",
    summary: "Small habits that improve sleep quality during stressful weeks.",
    tips: ["Avoid phone use 30 minutes before bed", "Keep a fixed wake-up time", "Avoid caffeine late evening", "Use light stretching"],
  },
];

resourceApp.get("/", (req, res) => {
  res.json({ resources: RESOURCES, crisisResources: CRISIS_RESOURCES });
});
