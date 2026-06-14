// Enhanced sentiment analysis
// 1) Always uses safe keyword-based detection as fallback.
// 2) Optionally uses HuggingFace or Gemini when API keys are available in .env.

const CRITICAL_KEYWORDS = [
  "planning suicide", "planning to die", "kill myself tonight", "kill my self tonight",
  "end my life tonight", "i will die tonight", "i am going to kill myself",
  "i am going to kill my self", "i have a plan to die"
];

const HIGH_RISK_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "kill my self", "want to kill myself",
  "want to kill my self", "end my life", "want to die", "take my life", "end it all",
  "no reason to live", "better off dead", "don't want to live", "dont want to live",
  "i don't want to live", "i dont want to live", "cannot continue living",
  "can't continue living", "don't want to be here anymore", "nobody would miss me",
  "everyone would be better without me"
];

const SELF_HARM_KEYWORDS = [
  "self-harm", "self harm", "hurt myself", "cutting", "cut myself", "burn myself",
  "starving myself", "purging", "binge", "relapse", "scars", "blades", "razor", "overdose"
];

const BULLYING_KEYWORDS = [
  "bullied", "bullying", "harassed", "harassment", "threatened", "humiliated",
  "mocked", "made fun of", "laughed at", "excluded", "cyberbullying", "trolled", "abused"
];

const TOXIC_KEYWORDS = [
  "worthless", "pathetic", "loser", "idiot", "stupid", "useless", "garbage",
  "waste of space", "nobody cares", "shut up", "kill yourself", "go die", "hate you"
];

const NEGATIVE_KEYWORDS = [
  "depressed", "depression", "anxiety", "panic attack", "stressed", "overwhelmed",
  "lonely", "alone", "cry", "crying", "sad", "grief", "trauma", "scared",
  "fear", "helpless", "exhausted", "burnout", "numb", "hopeless", "empty", "broken", "lost"
];

const POSITIVE_KEYWORDS = [
  "better", "improving", "hopeful", "grateful", "thankful", "progress", "recovered",
  "healing", "supported", "helped", "happy", "peaceful", "relieved", "calm", "proud", "stronger"
];

export function analyzeSentiment(text = "") {
  const lower = text.toLowerCase();

  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) return { label: "crisis", score: -5, flagged: true, category: "crisis", severity: "critical", source: "keyword" };
  }
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lower.includes(kw)) return { label: "crisis", score: -4, flagged: true, category: "crisis", severity: "high", source: "keyword" };
  }
  for (const kw of SELF_HARM_KEYWORDS) {
    if (lower.includes(kw)) return { label: "crisis", score: -3, flagged: true, category: "self-harm", severity: "high", source: "keyword" };
  }
  for (const kw of BULLYING_KEYWORDS) {
    if (lower.includes(kw)) return { label: "negative", score: -2, flagged: true, category: "bullying", severity: "medium", source: "keyword" };
  }
  for (const kw of TOXIC_KEYWORDS) {
    if (lower.includes(kw)) return { label: "negative", score: -2, flagged: true, category: "toxic", severity: "medium", source: "keyword" };
  }

  let score = 0;
  for (const kw of NEGATIVE_KEYWORDS) if (lower.includes(kw)) score -= 1;
  for (const kw of POSITIVE_KEYWORDS) if (lower.includes(kw)) score += 1;

  if (score <= -3) return { label: "negative", score, flagged: true, category: "distress", severity: "medium", source: "keyword" };
  if (score < 0) return { label: "negative", score, flagged: false, category: "general", severity: "low", source: "keyword" };
  if (score === 0) return { label: "neutral", score, flagged: false, category: "general", severity: "none", source: "keyword" };
  return { label: "positive", score, flagged: false, category: "general", severity: "none", source: "keyword" };
}

async function analyzeWithHuggingFace(text) {
  if (!process.env.HUGGINGFACE_API_KEY) return null;
  const response = await fetch(
    process.env.HUGGINGFACE_MODEL_URL || "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text.slice(0, 1000) }),
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  const result = Array.isArray(data?.[0]) ? data[0] : data;
  const best = Array.isArray(result) ? result.sort((a, b) => b.score - a.score)[0] : null;
  if (!best) return null;

  const label = String(best.label || "").toLowerCase();
  if (label.includes("negative")) return { label: "negative", score: -2, flagged: best.score > 0.85, category: "ai-negative", severity: best.score > 0.9 ? "medium" : "low", source: "huggingface" };
  if (label.includes("positive")) return { label: "positive", score: 1, flagged: false, category: "general", severity: "none", source: "huggingface" };
  return { label: "neutral", score: 0, flagged: false, category: "general", severity: "none", source: "huggingface" };
}

async function analyzeWithGemini(text) {
  if (!process.env.GEMINI_API_KEY) return null;
  const prompt = `Classify this mental health forum text. Return ONLY compact JSON with keys: label (positive|neutral|negative|crisis), flagged boolean, category, severity (none|low|medium|high|critical), score number from -5 to 2. Text: ${text.slice(0, 1200)}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonText = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(jsonText);
  return { ...parsed, source: "gemini" };
}

export async function analyzeSentimentAI(text = "") {
  const keyword = analyzeSentiment(text);

  // Never let AI downgrade obvious crisis/self-harm keyword matches.
  if (keyword.label === "crisis") return keyword;

  try {
    const ai = process.env.GEMINI_API_KEY
      ? await analyzeWithGemini(text)
      : await analyzeWithHuggingFace(text);

    if (!ai) return keyword;
    if (ai.label === "crisis" || ai.flagged) return ai;

    // Keep keyword flag if keyword detected bullying/toxic/distress.
    if (keyword.flagged) return keyword;
    return ai;
  } catch (err) {
    console.warn("AI sentiment failed, using keyword fallback:", err.message);
    return keyword;
  }
}

export const CRISIS_RESOURCES = [
  { name: "iCall (India)", phone: "9152987821", url: "https://icallhelpline.org" },
  { name: "Vandrevala Foundation", phone: "1860-2662-345", url: "https://www.vandrevalafoundation.com" },
  { name: "AASRA", phone: "9820466627", url: "http://www.aasra.info" },
  { name: "iMind Mental Health Helpline", phone: "4416110007", url: null },
];
