interface AIResponse {
  content: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

interface AIProvider {
  name: string;
  generateQuiz: (content: string, options: QuizOptions) => Promise<AIResponse>;
  generateExplanation: (question: string, userAnswer: string, correctAnswer: string, simple?: boolean) => Promise<AIResponse>;
  summarizeContent: (content: string) => Promise<AIResponse>;
  generateLearningPath: (goal: string, timeframe: string, difficulty: string) => Promise<AIResponse>;
}

interface QuizOptions {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  topics?: string[];
  timeLimit?: number;
  includeExplanations?: boolean;
}

class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private baseUrl: string;
  private model = 'gpt-3.5-turbo';

  constructor(apiKey: string, model = 'gpt-3.5-turbo', baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    const prompt = this.buildQuizPrompt(content, options);
    return this.makeRequest(prompt);
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const prompt = `Explain why the answer to this question is "${correctAnswer}" and not "${userAnswer}":

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

${simple ? 'Provide a simple, easy-to-understand explanation.' : 'Provide a detailed explanation with context and examples.'}

Keep the explanation encouraging and educational.`;

    return this.makeRequest(prompt);
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    const prompt = `Summarize this content into key points suitable for creating educational quizzes:

${content}

Focus on:
- Main concepts and definitions
- Important facts and principles
- Key relationships between ideas
- Practical applications

Format as a structured summary with bullet points.`;

    return this.makeRequest(prompt);
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const prompt = `Create a learning path for: "${goal}"
    Timeframe: ${timeframe}
    Difficulty: ${difficulty}
    
    Generate a structured learning plan with:
    1. Clear title
    2. Detailed description
    3. Key topics to cover (as array)
    4. Recommended study schedule
    5. Milestones and checkpoints
    
    Return as JSON with: title, description, topics, schedule, milestones`;

    return this.makeRequest(prompt);
  }

  private buildQuizPrompt(content: string, options: QuizOptions): string {
    const typeInstructions = {
      multiple_choice: 'Create multiple choice questions with exactly 4 options each',
      true_false: 'Create true/false questions with clear statements',
      short_answer: 'Create short answer questions requiring 1-3 word answers'
    };

    return `You are an expert educational content creator. Generate a high-quality ${options.difficulty} difficulty quiz with exactly ${options.questionCount} questions based on the following content:

${content}

STRICT REQUIREMENTS:
- Question type: ${options.type}
- ${typeInstructions[options.type]}
- Difficulty level: ${options.difficulty} (easy = basic recall, medium = application, hard = analysis/synthesis)
- ${options.includeExplanations ? 'Include detailed explanations (2-3 sentences) for each answer' : 'Include brief explanations (1 sentence)'}
- ${options.timeLimit ? `Time limit: ${options.timeLimit} seconds per question` : 'Default time limit: 30 seconds per question'}
- Questions must be clear, unambiguous, and directly related to the content
- For multiple choice: ensure only ONE correct answer and 3 plausible distractors
- For true/false: create clear statements that are definitively true or false
- Avoid trick questions or overly complex wording

CRITICAL: You MUST return ONLY valid JSON in this exact format with no additional text, markdown, or explanations:
{
  "title": "Quiz Title",
  "description": "Brief quiz description",
  "category": "Subject category",
  "difficulty": "${options.difficulty}",
  "estimated_time": ${(options.questionCount * (options.timeLimit || 30)) / 60},
  "questions": [
    {
      "id": "q1",
      "type": "question_type",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer",
      "explanation": "Detailed explanation",
      "difficulty": "${options.difficulty}",
      "topic": "Topic name",
      "time_limit": ${options.timeLimit || 30},
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}

Generate exactly ${options.questionCount} questions. Ensure all content is educational, accurate, and well-structured. The response must be valid JSON that can be parsed directly.`;
  }

  private async makeRequest(prompt: string): Promise<AIResponse> {
    try {
      console.log('Making OpenAI request with model:', this.model);
      console.log('Request URL:', `${this.baseUrl}/chat/completions`);
      console.log('Prompt length:', prompt.length);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are an expert educational content creator. Always return valid JSON when requested.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 3000,
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      console.log('OpenAI Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('OpenAI Error response:', errorText);
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('OpenAI Success response received');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI');
      }
      
      return {
        content: data.choices[0].message.content,
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          cost: this.calculateCost(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0)
        }
      };
    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // GPT-3.5-turbo pricing (as of 2024)
    const inputCost = (inputTokens / 1000) * 0.001;
    const outputCost = (outputTokens / 1000) * 0.002;
    return inputCost + outputCost;
  }
}

class AIMLAPIProvider implements AIProvider {
  name = 'aimlapi';
  private apiKey: string;
  private baseUrl = 'https://samuraiapi.in/v1';
  private model = 'gpt-4o';

  constructor(apiKey: string, model = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = 'gpt-4o';
  }

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    const prompt = this.buildQuizPrompt(content, options);
    return this.makeRequest(prompt);
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const prompt = `Explain why the answer to this question is "${correctAnswer}" and not "${userAnswer}":

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

${simple ? 'Provide a simple, easy-to-understand explanation.' : 'Provide a detailed explanation with context and examples.'}

Keep the explanation encouraging and educational.`;

    return this.makeRequest(prompt);
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    const prompt = `Summarize this content into key points suitable for creating educational quizzes:

${content}

Focus on:
- Main concepts and definitions
- Important facts and principles
- Key relationships between ideas
- Practical applications

Format as a structured summary with bullet points.`;

    return this.makeRequest(prompt);
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const prompt = `Create a learning path for: "${goal}"
    Timeframe: ${timeframe}
    Difficulty: ${difficulty}
    
    Generate a structured learning plan with:
    1. Clear title
    2. Detailed description
    3. Key topics to cover (as array)
    4. Recommended study schedule
    5. Milestones and checkpoints
    
    Return as JSON with: title, description, topics, schedule, milestones`;

    return this.makeRequest(prompt);
  }

  private buildQuizPrompt(content: string, options: QuizOptions): string {
    const typeInstructions = {
      multiple_choice: 'Create multiple choice questions with exactly 4 options each',
      true_false: 'Create true/false questions with clear statements',
      short_answer: 'Create short answer questions requiring 1-3 word answers'
    };

    return `You are an expert educational content creator. Generate a high-quality ${options.difficulty} difficulty quiz with exactly ${options.questionCount} questions based on the following content:

${content}

STRICT REQUIREMENTS:
- Question type: ${options.type}
- ${typeInstructions[options.type]}
- Difficulty level: ${options.difficulty} (easy = basic recall, medium = application, hard = analysis/synthesis)
- ${options.includeExplanations ? 'Include detailed explanations (2-3 sentences) for each answer' : 'Include brief explanations (1 sentence)'}
- ${options.timeLimit ? `Time limit: ${options.timeLimit} seconds per question` : 'Default time limit: 30 seconds per question'}
- Questions must be clear, unambiguous, and directly related to the content
- For multiple choice: ensure only ONE correct answer and 3 plausible distractors
- For true/false: create clear statements that are definitively true or false
- Avoid trick questions or overly complex wording

CRITICAL: You MUST return ONLY valid JSON in this exact format with no additional text, markdown, or explanations:
{
  "title": "Quiz Title",
  "description": "Brief quiz description",
  "category": "Subject category",
  "difficulty": "${options.difficulty}",
  "estimated_time": ${(options.questionCount * (options.timeLimit || 30)) / 60},
  "questions": [
    {
      "id": "q1",
      "type": "question_type",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer",
      "explanation": "Detailed explanation",
      "difficulty": "${options.difficulty}",
      "topic": "Topic name",
      "time_limit": ${options.timeLimit || 30},
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}

Generate exactly ${options.questionCount} questions. Ensure all content is educational, accurate, and well-structured. The response must be valid JSON that can be parsed directly.`;
  }

  private async makeRequest(prompt: string): Promise<AIResponse> {
    try {
      console.log('Making SamuraiAPI request with key:', this.apiKey.substring(0, 8) + '...');
      console.log('Request URL:', `${this.baseUrl}/chat/completions`);
      console.log('Using model:', this.model);
      console.log('Full API key for debugging:', this.apiKey);
      console.log('Authorization header:', `Bearer ${this.apiKey}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `You are an expert educational content creator. Always return valid JSON when requested.\n\n${prompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return {
        content: data.choices[0].message.content,
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          cost: this.calculateCost(data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0)
        }
      };
    } catch (error) {
      console.error('AIMLAPI Service Error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // AIMLAPI pricing - using similar structure to OpenAI for now
    const inputCost = (inputTokens / 1000) * 0.001;
    const outputCost = (outputTokens / 1000) * 0.002;
    return inputCost + outputCost;
  }
}

class ClaudeProvider implements AIProvider {
  name = 'claude';
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  private model = 'claude-3-sonnet-20240229';

  constructor(apiKey: string, model = 'claude-3-sonnet-20240229') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    const prompt = this.buildQuizPrompt(content, options);
    return this.makeRequest(prompt);
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const prompt = `Explain why the answer to this question is "${correctAnswer}" and not "${userAnswer}":

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

${simple ? 'Provide a simple, easy-to-understand explanation.' : 'Provide a detailed explanation with context and examples.'}

Keep the explanation encouraging and educational.`;

    return this.makeRequest(prompt);
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    const prompt = `Summarize this content into key points suitable for creating educational quizzes:

${content}

Focus on:
- Main concepts and definitions
- Important facts and principles
- Key relationships between ideas
- Practical applications

Format as a structured summary with bullet points.`;

    return this.makeRequest(prompt);
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const prompt = `Create a learning path for: "${goal}"
    Timeframe: ${timeframe}
    Difficulty: ${difficulty}
    
    Generate a structured learning plan with:
    1. Clear title
    2. Detailed description
    3. Key topics to cover (as array)
    4. Recommended study schedule
    5. Milestones and checkpoints
    
    Return as JSON with: title, description, topics, schedule, milestones`;

    return this.makeRequest(prompt);
  }

  private buildQuizPrompt(content: string, options: QuizOptions): string {
    const typeInstructions = {
      multiple_choice: 'Create multiple choice questions with exactly 4 options each',
      true_false: 'Create true/false questions with clear statements',
      short_answer: 'Create short answer questions requiring 1-3 word answers'
    };

    return `You are an expert educational content creator. Generate a high-quality ${options.difficulty} difficulty quiz with exactly ${options.questionCount} questions based on the following content:

${content}

STRICT REQUIREMENTS:
- Question type: ${options.type}
- ${typeInstructions[options.type]}
- Difficulty level: ${options.difficulty} (easy = basic recall, medium = application, hard = analysis/synthesis)
- ${options.includeExplanations ? 'Include detailed explanations (2-3 sentences) for each answer' : 'Include brief explanations (1 sentence)'}
- ${options.timeLimit ? `Time limit: ${options.timeLimit} seconds per question` : 'Default time limit: 30 seconds per question'}
- Questions must be clear, unambiguous, and directly related to the content
- For multiple choice: ensure only ONE correct answer and 3 plausible distractors
- For true/false: create clear statements that are definitively true or false
- Avoid trick questions or overly complex wording

CRITICAL: You MUST return ONLY valid JSON in this exact format with no additional text, markdown, or explanations:
{
  "title": "Quiz Title",
  "description": "Brief quiz description",
  "category": "Subject category",
  "difficulty": "${options.difficulty}",
  "estimated_time": ${(options.questionCount * (options.timeLimit || 30)) / 60},
  "questions": [
    {
      "id": "q1",
      "type": "question_type",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer",
      "explanation": "Detailed explanation",
      "difficulty": "${options.difficulty}",
      "topic": "Topic name",
      "time_limit": ${options.timeLimit || 30},
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}

Generate exactly ${options.questionCount} questions. Ensure all content is educational, accurate, and well-structured. The response must be valid JSON that can be parsed directly.`;
  }

  private async makeRequest(prompt: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          cost: this.calculateCost(data.usage?.input_tokens || 0, data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude pricing (as of 2024)
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    return inputCost + outputCost;
  }
}

class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-pro';

  constructor(apiKey: string, model = 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    const prompt = this.buildQuizPrompt(content, options);
    return this.makeRequest(prompt);
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const prompt = `Explain why the answer to this question is "${correctAnswer}" and not "${userAnswer}":

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

${simple ? 'Provide a simple, easy-to-understand explanation.' : 'Provide a detailed explanation with context and examples.'}

Keep the explanation encouraging and educational.`;

    return this.makeRequest(prompt);
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    const prompt = `Summarize this content into key points suitable for creating educational quizzes:

${content}

Focus on:
- Main concepts and definitions
- Important facts and principles
- Key relationships between ideas
- Practical applications

Format as a structured summary with bullet points.`;

    return this.makeRequest(prompt);
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const prompt = `Create a learning path for: "${goal}"
    Timeframe: ${timeframe}
    Difficulty: ${difficulty}
    
    Generate a structured learning plan with:
    1. Clear title
    2. Detailed description
    3. Key topics to cover (as array)
    4. Recommended study schedule
    5. Milestones and checkpoints
    
    Return as JSON with: title, description, topics, schedule, milestones`;

    return this.makeRequest(prompt);
  }

  private buildQuizPrompt(content: string, options: QuizOptions): string {
    const typeInstructions = {
      multiple_choice: 'Create multiple choice questions with exactly 4 options each',
      true_false: 'Create true/false questions with clear statements',
      short_answer: 'Create short answer questions requiring 1-3 word answers'
    };

    return `You are an expert educational content creator. Generate a high-quality ${options.difficulty} difficulty quiz with exactly ${options.questionCount} questions based on the following content:

${content}

STRICT REQUIREMENTS:
- Question type: ${options.type}
- ${typeInstructions[options.type]}
- Difficulty level: ${options.difficulty} (easy = basic recall, medium = application, hard = analysis/synthesis)
- ${options.includeExplanations ? 'Include detailed explanations (2-3 sentences) for each answer' : 'Include brief explanations (1 sentence)'}
- ${options.timeLimit ? `Time limit: ${options.timeLimit} seconds per question` : 'Default time limit: 30 seconds per question'}
- Questions must be clear, unambiguous, and directly related to the content
- For multiple choice: ensure only ONE correct answer and 3 plausible distractors
- For true/false: create clear statements that are definitively true or false
- Avoid trick questions or overly complex wording

CRITICAL: You MUST return ONLY valid JSON in this exact format with no additional text, markdown, or explanations:
{
  "title": "Quiz Title",
  "description": "Brief quiz description",
  "category": "Subject category",
  "difficulty": "${options.difficulty}",
  "estimated_time": ${(options.questionCount * (options.timeLimit || 30)) / 60},
  "questions": [
    {
      "id": "q1",
      "type": "question_type",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer",
      "explanation": "Detailed explanation",
      "difficulty": "${options.difficulty}",
      "topic": "Topic name",
      "time_limit": ${options.timeLimit || 30},
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}

Generate exactly ${options.questionCount} questions. Ensure all content is educational, accurate, and well-structured. The response must be valid JSON that can be parsed directly.`;
  }

  private async makeRequest(prompt: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.candidates[0].content.parts[0].text,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
          cost: this.calculateCost(data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0)
        }
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Gemini pricing (as of 2024)
    const inputCost = (inputTokens / 1000) * 0.0005;
    const outputCost = (outputTokens / 1000) * 0.0015;
    return inputCost + outputCost;
  }
}

// Mock AI Provider for testing when APIs fail
class MockAIProvider implements AIProvider {
  name = 'mock';

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    console.log('Using Mock AI Provider for quiz generation');
    
    // Generate a simple mock quiz
    const mockQuiz = {
      title: "Sample Quiz",
      description: "A sample quiz generated for testing purposes",
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          question: "What is the main topic of the provided content?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: "Option A",
          explanation: "This is a sample explanation for testing purposes.",
          difficulty: options.difficulty,
          topic: "General",
          time_limit: 30,
          hints: ["Think about the main theme", "Consider the key concepts"]
        },
        {
          id: "q2",
          type: "true_false",
          question: "This is a sample true/false question for testing.",
          correct_answer: "True",
          explanation: "This is correct because it's a test question.",
          difficulty: options.difficulty,
          topic: "General",
          time_limit: 30,
          hints: ["Consider the context"]
        }
      ].slice(0, Math.min(options.questionCount, 2))
    };

    return {
      content: JSON.stringify(mockQuiz),
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        cost: 0.001
      }
    };
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const explanation = simple 
      ? `The correct answer is "${correctAnswer}" because it's the right choice for this question.`
      : `The correct answer is "${correctAnswer}" rather than "${userAnswer}" because this is a sample explanation for testing purposes. In a real scenario, this would provide detailed reasoning.`;
    
    return { content: explanation };
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    return { 
      content: `This is a sample summary of the provided content. Key points include the main concepts and important information that would be relevant for quiz creation.` 
    };
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const mockPath = {
      title: `Learning Path: ${goal}`,
      description: `A structured learning path to achieve: ${goal}`,
      topics: ["Introduction", "Fundamentals", "Advanced Concepts", "Practice"],
      schedule: `Complete within ${timeframe} at ${difficulty} difficulty level`,
      milestones: ["Week 1: Basics", "Week 2: Practice", "Week 3: Advanced"]
    };
    
    return { content: JSON.stringify(mockPath) };
  }
}

class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string = 'openai';

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Initialize with environment variables or fetch from admin settings
    let config;
    try {
      // Use environment variables first
      config = {
        openai_key: import.meta.env.VITE_OPENAI_API_KEY,
        claude_key: import.meta.env.VITE_CLAUDE_API_KEY,
        gemini_key: import.meta.env.VITE_GEMINI_API_KEY,
        aimlapi_key: import.meta.env.VITE_AIMLAPI_API_KEY || 'sk-aTGsMd60veaEH5x8i8sq97VY2MyE5gBEGx3iCWlITmcejaTL',
        active_provider: import.meta.env.VITE_ACTIVE_AI_PROVIDER || 'aimlapi'
      };
      
      // Try to get additional config from Supabase if available
      try {
        const supabaseConfig = await this.getAIConfig();
        if (supabaseConfig && Object.keys(supabaseConfig).length > 0) {
          config = { ...config, ...supabaseConfig };
        }
      } catch (error) {
        console.warn('Could not fetch AI config from Supabase, using environment variables');
      }
    } catch (error) {
      console.warn('Error initializing AI config, using defaults');
      config = {
        aimlapi_key: 'sk-aTGsMd60veaEH5x8i8sq97VY2MyE5gBEGx3iCWlITmcejaTL',
        active_provider: 'aimlapi'
      };
    }
    
    console.log('AI Config loaded:', { 
      hasAIMLAPI: !!config.aimlapi_key, 
      activeProvider: config.active_provider,
      availableKeys: Object.keys(config).filter(k => k.endsWith('_key') && config[k])
    });
    
    // Always add mock provider as fallback
    this.providers.set('mock', new MockAIProvider());
    
    // Initialize AIMLAPI provider
    if (config.aimlapi_key) {
      this.providers.set('aimlapi', new AIMLAPIProvider(config.aimlapi_key));
    }
    
    if (config.openai_key) {
      this.providers.set('openai', new OpenAIProvider(config.openai_key));
    }
    
    if (config.claude_key) {
      this.providers.set('claude', new ClaudeProvider(config.claude_key));
    }
    
    if (config.gemini_key) {
      this.providers.set('gemini', new GeminiProvider(config.gemini_key));
    }

    // Set active provider
    if (config.active_provider && this.providers.has(config.active_provider)) {
      this.activeProvider = config.active_provider;
    } else {
      this.activeProvider = 'mock';
    }
  }

  private async getAIConfig(): Promise<any> {
    // Try to fetch from Supabase admin settings
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const { supabase } = await import('./supabase');
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'ai_config')
        .single();
      
      if (data) {
        return JSON.parse(data.value);
      }
    }
    return {};
  }

  async generateQuiz(content: string, options: QuizOptions): Promise<AIResponse> {
    console.log('Generating quiz with provider:', this.activeProvider);
    console.log('Available providers:', this.getAvailableProviders());
    
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      console.error('No AI provider available. Active:', this.activeProvider, 'Available:', this.getAvailableProviders());
      return { content: '', error: `No AI provider available. Active: ${this.activeProvider}` };
    }

    try {
      const result = await provider.generateQuiz(content, options);
      console.log('Quiz generation result:', { success: !result.error, hasContent: !!result.content });
      this.logUsage('generate_quiz', provider.name, result);
      return result;
    } catch (error) {
      console.error('Quiz generation error:', error);
      // Try fallback provider
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider) {
        console.log('Trying fallback provider:', fallbackProvider.name);
        const result = await fallbackProvider.generateQuiz(content, options);
        this.logUsage('generate_quiz', fallbackProvider.name, result);
        return result;
      }
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateExplanation(question: string, userAnswer: string, correctAnswer: string, simple = false): Promise<AIResponse> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      return { content: '', error: 'No AI provider available' };
    }

    try {
      const result = await provider.generateExplanation(question, userAnswer, correctAnswer, simple);
      this.logUsage('generate_explanation', provider.name, result);
      return result;
    } catch (error) {
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider) {
        const result = await fallbackProvider.generateExplanation(question, userAnswer, correctAnswer, simple);
        this.logUsage('generate_explanation', fallbackProvider.name, result);
        return result;
      }
      return { content: 'Unable to generate explanation at this time.', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async summarizeContent(content: string): Promise<AIResponse> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      return { content: '', error: 'No AI provider available' };
    }

    try {
      const result = await provider.summarizeContent(content);
      this.logUsage('summarize_content', provider.name, result);
      return result;
    } catch (error) {
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider) {
        const result = await fallbackProvider.summarizeContent(content);
        this.logUsage('summarize_content', fallbackProvider.name, result);
        return result;
      }
      return { content: 'Unable to summarize content at this time.', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateLearningPath(goal: string, timeframe: string, difficulty: string): Promise<AIResponse> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      return { content: '', error: 'No AI provider available' };
    }

    try {
      const result = await provider.generateLearningPath(goal, timeframe, difficulty);
      this.logUsage('generate_learning_path', provider.name, result);
      return result;
    } catch (error) {
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider) {
        const result = await fallbackProvider.generateLearningPath(goal, timeframe, difficulty);
        this.logUsage('generate_learning_path', fallbackProvider.name, result);
        return result;
      }
      return { content: 'Unable to generate learning path at this time.', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private getFallbackProvider(): AIProvider | null {
    const providers = Array.from(this.providers.values());
    const currentProvider = this.providers.get(this.activeProvider);
    
    // Try to find a working provider, prefer mock as last resort
    const fallbackOrder = ['openai', 'claude', 'gemini', 'aimlapi', 'mock'];
    for (const providerName of fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (provider && provider !== currentProvider) {
        return provider;
      }
    }
    
    return this.providers.get('mock') || null;
  }

  private async logUsage(feature: string, provider: string, result: AIResponse) {
    try {
      const { supabase } = await import('./supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          feature,
          provider,
          input_tokens: result.usage?.inputTokens || 0,
          output_tokens: result.usage?.outputTokens || 0,
          cost: result.usage?.cost || 0,
          success: !result.error,
          error_message: result.error
        });
      }
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  setActiveProvider(provider: string) {
    if (this.providers.has(provider)) {
      this.activeProvider = provider;
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getActiveProvider(): string {
    return this.activeProvider;
  }
}

export const aiService = new AIService();
export type { AIResponse, QuizOptions };