import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface ContentExtractionRequest {
  url: string;
  options?: {
    summarize?: boolean;
    maxLength?: number;
    focusAreas?: string[];
  };
}

interface ExtractedContent {
  title: string;
  content: string;
  summary?: string;
  metadata: {
    url: string;
    wordCount: number;
    extractedAt: string;
    contentType: string;
    language?: string;
  };
  keyPoints?: string[];
  topics?: string[];
}

serve(async (req) => {
  console.log('Extract content function called:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text()
    console.log('Request body:', requestBody)
    
    let parsedBody: ContentExtractionRequest
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

    const { url, options = {} } = parsedBody

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing URL:', url)

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (urlError) {
      console.error('URL validation error:', urlError)
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Security check - only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: 'Only HTTP and HTTPS URLs are allowed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching content from: ${url}`)

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

    let response: Response
    try {
      // Fetch the webpage with proper headers
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Neurativo-Bot/1.0; Educational Content Extractor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Fetch error:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout - the URL took too long to respond' }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch URL', 
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} ${response.statusText}`)
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          details: `The server returned a ${response.status} error`
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully fetched URL, extracting content...')

    const html = await response.text()
    const contentType = response.headers.get('content-type') || 'text/html'

    console.log(`Content type: ${contentType}, HTML length: ${html.length}`)

    // Extract content using multiple strategies
    const extractedContent = await extractContentFromHTML(html, url)
    
    if (!extractedContent.content || extractedContent.content.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract meaningful content from the URL',
          details: 'The page may not contain readable text content or may be protected by JavaScript'
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Extracted content length: ${extractedContent.content.length}`)
    
    // Generate summary and key points if requested
    let summary = ''
    let keyPoints: string[] = []
    let topics: string[] = []

    if (options.summarize && extractedContent.content) {
      console.log('Analyzing content...')
      const analysisResult = await analyzeContent(extractedContent.content, options)
      summary = analysisResult.summary
      keyPoints = analysisResult.keyPoints
      topics = analysisResult.topics
    }

    const result: ExtractedContent = {
      title: extractedContent.title,
      content: extractedContent.content,
      summary,
      keyPoints,
      topics,
      metadata: {
        url,
        wordCount: extractedContent.content.split(/\s+/).filter(word => word.length > 0).length,
        extractedAt: new Date().toISOString(),
        contentType,
        language: detectLanguage(extractedContent.content),
      }
    }

    console.log('Content extraction successful:', {
      title: result.title,
      contentLength: result.content.length,
      wordCount: result.metadata.wordCount,
      hasKeyPoints: result.keyPoints?.length || 0,
      hasTopics: result.topics?.length || 0
    })

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in content extraction:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during content extraction',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function extractContentFromHTML(html: string, url: string): Promise<{ title: string; content: string }> {
  console.log('Starting HTML content extraction...')
  
  // Remove script and style tags first
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  cleanHtml = cleanHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
  
  // Extract title
  const titleMatch = cleanHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
  let title = titleMatch ? titleMatch[1].trim() : ''
  
  // Try meta title if no title tag
  if (!title) {
    const metaTitleMatch = cleanHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    title = metaTitleMatch ? metaTitleMatch[1].trim() : new URL(url).hostname
  }

  console.log('Extracted title:', title)

  // Try to extract main content using multiple strategies
  let content = ''

  // Strategy 1: Look for article tags
  const articleMatches = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/gi)
  if (articleMatches && articleMatches.length > 0) {
    content = articleMatches.map(match => match.replace(/<\/?article[^>]*>/gi, '')).join('\n\n')
    console.log('Found content in article tags')
  }

  // Strategy 2: Look for main content areas
  if (!content) {
    const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      content = mainMatch[1]
      console.log('Found content in main tag')
    }
  }

  // Strategy 3: Look for content divs with common class names
  if (!content) {
    const contentPatterns = [
      /<div[^>]*class="[^"]*(?:content|post-content|entry-content|article-content|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:content|post-content|entry-content|article-content|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*(?:post|entry|article)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*(?:content|post|article)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    ]
    
    for (const pattern of contentPatterns) {
      const match = cleanHtml.match(pattern)
      if (match && match[1].length > 200) {
        content = match[1]
        console.log('Found content using pattern matching')
        break
      }
    }
  }

  // Strategy 4: Look for paragraphs in body
  if (!content) {
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      // Extract all paragraphs
      const paragraphs = bodyMatch[1].match(/<p[^>]*>[\s\S]*?<\/p>/gi)
      if (paragraphs && paragraphs.length > 2) {
        content = paragraphs.join('\n')
        console.log('Found content from paragraphs in body')
      }
    }
  }

  // Strategy 5: Last resort - get all text from body
  if (!content) {
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      content = bodyMatch[1]
      console.log('Using full body content as last resort')
    }
  }

  // Clean up the extracted content
  const cleanedContent = cleanTextContent(content)
  
  console.log('Content extraction complete:', {
    originalLength: content.length,
    cleanedLength: cleanedContent.length,
    wordCount: cleanedContent.split(/\s+/).filter(w => w.length > 0).length
  })

  return { title, content: cleanedContent }
}

function cleanTextContent(html: string): string {
  console.log('Cleaning text content...')
  
  // Remove unwanted tags but keep their content
  let text = html.replace(/<(?:nav|header|footer|aside|menu)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|menu)>/gi, '')
  
  // Remove HTML tags but keep content
  text = text.replace(/<[^>]*>/g, ' ')
  
  // Decode HTML entities
  const entities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
  }
  
  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), replacement)
  }
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  text = text.trim()
  
  // Remove common navigation and footer text patterns
  const unwantedPatterns = [
    /skip to (?:main )?content/gi,
    /(?:main )?menu/gi,
    /navigation/gi,
    /breadcrumb/gi,
    /share this/gi,
    /follow us/gi,
    /subscribe/gi,
    /newsletter/gi,
    /copyright.*all rights reserved/gi,
    /privacy policy/gi,
    /terms of (?:service|use)/gi,
    /cookie policy/gi,
    /back to top/gi,
    /read more/gi,
    /continue reading/gi,
  ]
  
  for (const pattern of unwantedPatterns) {
    text = text.replace(pattern, ' ')
  }
  
  // Final cleanup
  text = text.replace(/\s+/g, ' ').trim()
  
  console.log('Text cleaning complete, final length:', text.length)
  
  return text
}

async function analyzeContent(content: string, options: any): Promise<{
  summary: string;
  keyPoints: string[];
  topics: string[];
}> {
  console.log('Analyzing content for key points and topics...')
  
  // Split into sentences and paragraphs
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50)
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  console.log(`Analysis input: ${sentences.length} sentences, ${paragraphs.length} paragraphs, ${words.length} words`)
  
  // Extract key points (important sentences from different parts)
  const keyPoints: string[] = []
  
  // Take first sentence of each paragraph (usually topic sentences)
  paragraphs.forEach(paragraph => {
    const firstSentence = paragraph.split(/[.!?]+/)[0]?.trim()
    if (firstSentence && firstSentence.length > 30 && firstSentence.length < 200) {
      keyPoints.push(firstSentence + '.')
    }
  })
  
  // Add some important-looking sentences (those with key educational words)
  const importantWords = ['important', 'key', 'main', 'primary', 'essential', 'fundamental', 'critical', 'significant', 'major', 'principle', 'concept', 'theory', 'method', 'process', 'result', 'conclusion', 'therefore', 'however', 'because', 'due to']
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const hasImportantWords = importantWords.some(word => lowerSentence.includes(word))
    if (hasImportantWords && sentence.length > 40 && sentence.length < 300 && keyPoints.length < 15) {
      const cleanSentence = sentence.trim() + '.'
      if (!keyPoints.some(kp => kp.includes(sentence.substring(0, 20)))) {
        keyPoints.push(cleanSentence)
      }
    }
  })
  
  // Generate summary (first few key sentences)
  const summary = keyPoints.slice(0, 3).join(' ') || sentences.slice(0, 2).join('. ') + '.'
  
  // Extract topics using word frequency analysis
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 
    'those', 'they', 'them', 'their', 'there', 'then', 'than', 'when', 'where', 'why', 
    'how', 'what', 'who', 'which', 'some', 'any', 'all', 'each', 'every', 'most', 'many', 
    'much', 'more', 'less', 'few', 'several', 'other', 'another', 'such', 'same', 'different'
  ])
  
  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase()
    if (cleanWord.length > 3 && !commonWords.has(cleanWord) && !/^\d+$/.test(cleanWord)) {
      wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1)
    }
  })
  
  const topics = Array.from(wordFreq.entries())
    .filter(([word, freq]) => freq > 2) // Only words that appear multiple times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
  
  console.log('Analysis complete:', {
    keyPointsCount: keyPoints.length,
    summaryLength: summary.length,
    topicsCount: topics.length
  })

  return { 
    summary: summary.substring(0, 1000), // Limit summary length
    keyPoints: keyPoints.slice(0, 10), // Limit key points
    topics 
  }
}

function detectLanguage(text: string): string {
  // Simple language detection based on common words
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'this', 'that']
  const words = text.toLowerCase().split(/\s+/).slice(0, 200) // Check first 200 words
  
  const englishCount = words.filter(word => englishWords.includes(word.replace(/[^\w]/g, ''))).length
  const englishRatio = englishCount / Math.min(words.length, 200)
  
  console.log(`Language detection: ${englishCount}/${words.length} English words (${(englishRatio * 100).toFixed(1)}%)`)
  
  return englishRatio > 0.05 ? 'en' : 'unknown'
}