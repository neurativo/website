import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface DocumentAnalysisRequest {
  content: string;
  fileName: string;
  fileType: string;
  options?: {
    maxPages?: number;
    focusAreas?: string[];
    extractKeyPoints?: boolean;
  };
}

interface AnalyzedDocument {
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  concepts: string[];
  metadata: {
    fileName: string;
    fileType: string;
    wordCount: number;
    pageCount: number;
    analyzedAt: string;
    language: string;
  };
  quizReadyContent: string;
}

serve(async (req) => {
  console.log('Document analysis function called:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text()
    console.log('Request received, body length:', requestBody.length)
    
    let parsedBody: DocumentAnalysisRequest
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { content, fileName, fileType, options = {} } = parsedBody

    if (!content || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Content and fileName are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Analyzing document: ${fileName} (${fileType})`)
    console.log(`Content length: ${content.length} characters`)

    // Validate content length (max 2-3 pages ~ 3000-4500 words)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    const maxWords = 4500 // Approximately 3 pages
    
    if (wordCount > maxWords) {
      return new Response(
        JSON.stringify({ 
          error: `Document too long. Maximum ${maxWords} words allowed (approximately 3 pages). Your document has ${wordCount} words.`,
          details: 'Please upload a shorter document or extract the most relevant sections.'
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean and preprocess content
    const cleanedContent = cleanDocumentContent(content)
    
    if (cleanedContent.length < 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Document content too short or could not extract meaningful text',
          details: 'Please ensure your document contains readable text content.'
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Cleaned content length: ${cleanedContent.length} characters`)

    // Analyze document content
    const analysis = await analyzeDocumentContent(cleanedContent, fileName, options)
    
    // Estimate page count
    const estimatedPageCount = Math.ceil(wordCount / 250) // ~250 words per page
    
    const result: AnalyzedDocument = {
      title: analysis.title,
      content: cleanedContent,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      topics: analysis.topics,
      concepts: analysis.concepts,
      quizReadyContent: analysis.quizReadyContent,
      metadata: {
        fileName,
        fileType: fileType || 'unknown',
        wordCount,
        pageCount: Math.min(estimatedPageCount, 3), // Cap at 3 pages
        analyzedAt: new Date().toISOString(),
        language: detectLanguage(cleanedContent),
      }
    }

    console.log('Document analysis complete:', {
      title: result.title,
      wordCount: result.metadata.wordCount,
      pageCount: result.metadata.pageCount,
      keyPointsCount: result.keyPoints.length,
      topicsCount: result.topics.length,
      conceptsCount: result.concepts.length
    })

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in document analysis:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during document analysis',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function cleanDocumentContent(content: string): string {
  console.log('Cleaning document content...')
  
  // Remove common document artifacts
  let cleaned = content
    // Remove page numbers and headers/footers
    .replace(/^Page \d+.*$/gm, '')
    .replace(/^\d+\s*$/gm, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove common document metadata
    .replace(/^(Created|Modified|Author|Title):\s*.*$/gm, '')
    // Clean up special characters
    .replace(/[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\']/g, ' ')
    .trim()

  console.log(`Content cleaning complete. Original: ${content.length}, Cleaned: ${cleaned.length}`)
  return cleaned
}

async function analyzeDocumentContent(content: string, fileName: string, options: any): Promise<{
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  concepts: string[];
  quizReadyContent: string;
}> {
  console.log('Starting document content analysis...')
  
  // Extract title from filename or first line
  let title = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
  const firstLine = content.split('\n')[0]?.trim()
  if (firstLine && firstLine.length < 100 && firstLine.length > 5) {
    title = firstLine
  }

  // Split content into sentences and paragraphs
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50)
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 2)

  console.log(`Analysis input: ${sentences.length} sentences, ${paragraphs.length} paragraphs`)

  // Extract key points (important sentences)
  const keyPoints: string[] = []
  
  // Educational keywords that indicate important content
  const importantKeywords = [
    'definition', 'define', 'important', 'key', 'main', 'primary', 'essential', 
    'fundamental', 'critical', 'significant', 'principle', 'concept', 'theory',
    'method', 'process', 'approach', 'technique', 'strategy', 'framework',
    'result', 'conclusion', 'finding', 'discovery', 'research', 'study',
    'analysis', 'evaluation', 'assessment', 'comparison', 'contrast',
    'cause', 'effect', 'reason', 'because', 'therefore', 'thus', 'hence',
    'however', 'although', 'despite', 'nevertheless', 'furthermore', 'moreover'
  ]

  // Extract topic sentences (first sentence of each paragraph)
  paragraphs.forEach(paragraph => {
    const firstSentence = paragraph.split(/[.!?]+/)[0]?.trim()
    if (firstSentence && firstSentence.length > 30 && firstSentence.length < 200) {
      keyPoints.push(firstSentence + '.')
    }
  })

  // Extract sentences with important keywords
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const hasImportantKeywords = importantKeywords.some(keyword => 
      lowerSentence.includes(keyword)
    )
    
    if (hasImportantKeywords && sentence.length > 40 && sentence.length < 300 && keyPoints.length < 20) {
      const cleanSentence = sentence.trim() + '.'
      // Avoid duplicates
      if (!keyPoints.some(kp => kp.substring(0, 30) === cleanSentence.substring(0, 30))) {
        keyPoints.push(cleanSentence)
      }
    }
  })

  // Generate summary from key points
  const summary = keyPoints.slice(0, 5).join(' ') || sentences.slice(0, 3).join('. ') + '.'

  // Extract topics using advanced word frequency analysis
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'they', 'them', 'their', 'there', 'then', 'than', 'when', 'where', 'why',
    'how', 'what', 'who', 'which', 'some', 'any', 'all', 'each', 'every', 'most', 'many',
    'much', 'more', 'less', 'few', 'several', 'other', 'another', 'such', 'same', 'different',
    'also', 'just', 'only', 'even', 'still', 'now', 'here', 'very', 'well', 'back', 'through',
    'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once'
  ])

  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase()
    if (cleanWord.length > 3 && !stopWords.has(cleanWord) && !/^\d+$/.test(cleanWord)) {
      wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1)
    }
  })

  // Extract topics (frequent meaningful words)
  const topics = Array.from(wordFreq.entries())
    .filter(([word, freq]) => freq >= 3) // Words appearing 3+ times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)

  // Extract concepts (educational terms and phrases)
  const conceptPatterns = [
    /\b([A-Z][a-z]+ (?:theory|principle|law|rule|method|approach|technique|strategy|framework|model|system))\b/g,
    /\b((?:data|information|knowledge|learning|teaching|education|research|study|analysis|evaluation|assessment)[a-z]*)\b/g,
    /\b([a-z]+ (?:process|procedure|mechanism|structure|function|operation|behavior|pattern|trend))\b/g
  ]

  const concepts: string[] = []
  conceptPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const concept = match.toLowerCase().trim()
        if (concept.length > 5 && !concepts.includes(concept) && concepts.length < 20) {
          concepts.push(concept)
        }
      })
    }
  })

  // Create quiz-ready content (optimized for quiz generation)
  const quizReadyContent = [
    `Title: ${title}`,
    '',
    'Key Learning Points:',
    ...keyPoints.slice(0, 10).map((point, i) => `${i + 1}. ${point}`),
    '',
    'Summary:',
    summary,
    '',
    'Important Topics:',
    topics.slice(0, 10).join(', '),
    '',
    'Core Content:',
    content.substring(0, 2000) // First 2000 chars for context
  ].join('\n')

  console.log('Content analysis complete:', {
    keyPointsCount: keyPoints.length,
    topicsCount: topics.length,
    conceptsCount: concepts.length,
    summaryLength: summary.length
  })

  return {
    title,
    summary: summary.substring(0, 1000), // Limit summary length
    keyPoints: keyPoints.slice(0, 15), // Top 15 key points
    topics: topics.slice(0, 12), // Top 12 topics
    concepts: concepts.slice(0, 10), // Top 10 concepts
    quizReadyContent
  }
}

function detectLanguage(text: string): string {
  // Simple English detection
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'this', 'that']
  const words = text.toLowerCase().split(/\s+/).slice(0, 100)
  
  const englishCount = words.filter(word => englishWords.includes(word.replace(/[^\w]/g, ''))).length
  const englishRatio = englishCount / Math.min(words.length, 100)
  
  return englishRatio > 0.05 ? 'en' : 'unknown'
}