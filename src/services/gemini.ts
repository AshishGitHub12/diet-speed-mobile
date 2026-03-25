// ─── Gemini AI Service ────────────────────────────────────────────────────────
// Model: gemini-2.5-flash (free tier)
// Docs: https://ai.google.dev/docs

const GEMINI_API_KEY = 'AIzaSyBzHuGQ26BzGlS5t1jI13PUlYNzcPZjJl0'; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserContext {
  name: string;
  weight: number;
  target_weight: number;
  bmi: number;
  gender: string;
  dob: string;
  height: number;
  height_unit: string;
  medical_conditions: string[];
  // Goals (optional — populated once My Goals screen is done)
  primary_goal?: string;
  activity_level?: string;
  diet_type?: string;
  daily_calories?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// ─── Build System Prompt ──────────────────────────────────────────────────────

export const buildSystemPrompt = (user: UserContext): string => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return `You are an expert personal diet and fitness coach named "Coach AI" inside a health app.

Today's Date: ${today}

User Profile:
- Name: ${user.name}
- Gender: ${user.gender}
- Height: ${user.height} ${user.height_unit}
- Current Weight: ${user.weight} kg
- Target Weight: ${user.target_weight} kg
- BMI: ${user.bmi}
- Medical Conditions: ${user.medical_conditions?.join(', ') || 'None'}
${user.primary_goal ? `- Primary Goal: ${user.primary_goal.replace('_', ' ')}` : ''}
${user.activity_level ? `- Activity Level: ${user.activity_level.replace('_', ' ')}` : ''}
${user.diet_type ? `- Diet Type: ${user.diet_type.replace('_', ' ')}` : ''}
${user.daily_calories ? `- Daily Calorie Target: ${user.daily_calories} kcal` : ''}

Your Rules:
1. Always personalize advice using the user's profile above.
2. Keep responses concise, practical, and actionable (3–5 sentences max unless a detailed plan is requested).
3. Be warm, encouraging, and motivating.
4. If asked about something unrelated to diet, fitness, nutrition, health, or wellness — politely redirect.
5. Use simple language, avoid heavy medical jargon.
6. When suggesting meals, respect the user's diet type and medical conditions.
7. Never recommend anything unsafe or extreme.`;
};

// ─── Build Conversation History ───────────────────────────────────────────────

const buildContents = (
  messages: ChatMessage[],
  systemPrompt: string,
  newMessage: string,
) => {
  // Gemini uses "contents" array with role: user/model
  const history = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  return [
    // Inject system prompt as first user turn + model ack (Gemini doesn't have system role)
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: `Understood! I'm ready to help ${systemPrompt.match(/Name: (\w+)/)?.[1] ?? 'you'} with personalized diet and fitness guidance. What's on your mind?` }],
    },
    ...history,
    {
      role: 'user',
      parts: [{ text: newMessage }],
    },
  ];
};

// ─── Send Message ─────────────────────────────────────────────────────────────

export const sendMessageToGemini = async (
  userMessage: string,
  history: ChatMessage[],
  userContext: UserContext,
): Promise<string> => {
  const systemPrompt = buildSystemPrompt(userContext);
  const contents = buildContents(history, systemPrompt, userMessage);

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.log('❌ Gemini error:', err);
    throw new Error(err?.error?.message ?? 'Gemini API error');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
};