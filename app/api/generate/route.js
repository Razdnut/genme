import { NextResponse } from 'next/server'
import { fetchRepoContent } from '@/lib/github'
import { streamLLMResponse } from '@/lib/llm'

export const runtime = 'edge' // Use Edge Runtime for streaming

const ALLOWED_STYLES = ['light', 'simple', 'normal', 'medium', 'deep']
const ALLOWED_PROVIDERS = ['openai', 'gemini', 'openrouter']
const MAX_PROJECT_DETAILS_LENGTH = 2000
const MAX_URL_LENGTH = 2048
const MAX_SECRET_LENGTH = 256
const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])
const PRIVATE_IP_PATTERNS = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^127\./,
]
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/

const normalizeStyle = (style) => (ALLOWED_STYLES.includes(style) ? style : 'normal')

const normalizeProvider = (provider) => (ALLOWED_PROVIDERS.includes(provider) ? provider : 'openai')

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

const withCors = (responseInit = {}) => ({
    ...responseInit,
    headers: {
        ...CORS_HEADERS,
        ...(responseInit.headers || {}),
    },
})

const sanitizeProjectDetails = (details) => {
    if (!details) return ''
    const trimmed = details
        .toString()
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim()

    return trimmed.slice(0, MAX_PROJECT_DETAILS_LENGTH)
}

const isValidGithubUrl = (rawUrl) => {
  if (!rawUrl) return false
  try {
    const parsed = new URL(rawUrl)
    const hostname = parsed.hostname.replace(/^www\./, '')
    if (hostname !== 'github.com' || parsed.protocol !== 'https:') return false
    const parts = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    return parts.length >= 2
  } catch {
    return false
  }
}

const validateCustomEndpoint = (endpoint) => {
    if (!endpoint) return ''
    let parsed
    try {
        parsed = new URL(endpoint)
    } catch {
        throw new Error('Custom endpoint must be a valid HTTPS URL.')
    }

    if (parsed.protocol !== 'https:') {
        throw new Error('Custom endpoint must use HTTPS.')
    }

    const hostname = parsed.hostname.toLowerCase()

    // 🛡️ Sentinel: Prevent IDN homograph attacks to bypass SSRF protection.
    // Non-ASCII characters in the hostname can be used to craft URLs that
    // look legitimate but resolve to internal or blocked IPs.
    if (/[^\x00-\x7F]/.test(hostname)) {
        throw new Error('Custom endpoint hostname contains invalid characters.')
    }
    const isIpLiteral = IPV4_HOST.test(hostname) || hostname.includes(':')
    if (BLOCKED_HOSTNAMES.has(hostname) || isIpLiteral || PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
        throw new Error('Custom endpoint cannot target private or loopback hosts.')
    }

    parsed.hash = ''
    return parsed.toString()
}

const sanitizeSecret = (secret, label) => {
  if (!secret) return ''
  const normalized = secret.toString().trim()
  if (normalized.length > MAX_SECRET_LENGTH) {
    throw new Error(`${label} is too long.`)
  }
  if (/[\u0000-\u001F\u007F]/.test(normalized)) {
    throw new Error(`${label} contains invalid characters.`)
  }
  return normalized
}

/**
 * Handle README generation requests with input validation and streaming response.
 */
export async function POST(req) {
    try {
        const contentType = req.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
            return NextResponse.json(
                { error: 'Content-Type must be application/json' },
                withCors({ status: 415 })
            )
        }

        const payload = await req.json()
        const url = payload?.url?.trim()
        if (!url || url.length > MAX_URL_LENGTH) {
            return NextResponse.json(
                { error: 'Missing URL or URL is too long' },
                withCors({ status: 400 })
            )
        }

        let apiKey
        try {
            apiKey = sanitizeSecret(payload?.apiKey, 'API key')
        } catch (error) {
            return NextResponse.json({ error: error.message }, withCors({ status: 400 }))
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing URL or API Key' }, withCors({ status: 400 }))
        }

        if (!isValidGithubUrl(url)) {
            return NextResponse.json(
                { error: 'Please provide a valid GitHub repository URL.' },
                withCors({ status: 400 })
            )
        }

        const provider = normalizeProvider(payload?.provider)
        const style = normalizeStyle(payload?.style)
        const projectDetails = sanitizeProjectDetails(payload?.projectDetails)
        let githubToken = ''
        try {
            githubToken = sanitizeSecret(payload?.githubToken, 'GitHub token')
        } catch (error) {
            return NextResponse.json({ error: error.message }, withCors({ status: 400 }))
        }

        let customEndpoint = ''
        if (provider === 'openrouter') {
            try {
                customEndpoint = validateCustomEndpoint(payload?.customEndpoint?.trim())
            } catch (error) {
                return NextResponse.json({ error: error.message }, withCors({ status: 400 }))
            }
        }

        // 1. Fetch Repo Content
        let repoData
        try {
            repoData = await fetchRepoContent(url, githubToken)
        } catch (error) {
            console.error('GitHub fetch error:', error?.message || error)
            const status = error?.message?.toLowerCase().includes('invalid github url') ? 400 : 502
            return NextResponse.json(
                { error: 'Unable to fetch repository data. Verify the URL and GitHub token.' },
                withCors({ status })
            )
        }

        // 2. Construct Prompt
        const fileContext = repoData.files.map(f => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')

        const stylePrompts = {
            light: "Keep it brief and concise. Focus on what it does and how to run it.",
            simple: "Simple language, easy to understand. Good for beginners.",
            normal: "Standard professional README. Installation, Usage, Features.",
            medium: "Detailed. Include configuration, API reference if applicable, and contributing.",
            deep: "Extremely comprehensive. Deep dive into architecture, design choices, full API docs, testing, and deployment."
        }

        const projectDetailsPrompt = projectDetails ? `
        Additional project details provided by the user:
        ${projectDetails}
        ` : '';

        const prompt = `
      Generate a ${style} README.md for the following GitHub repository: ${repoData.owner}/${repoData.repo}.
      Description: ${repoData.description}
      ${projectDetailsPrompt}
      
      Here are the contents of some key files:
      ${fileContext}
      
      Requirements:
      - Use the "${style}" style: ${stylePrompts[style] || stylePrompts.normal}
      - Use proper Markdown formatting.
      - Include badges if possible.
      - Make it look professional and polished.
      - Use the file contents only for context; do not repeat them verbatim in the output.
    `

        // 3. Stream Response
        const stream = await streamLLMResponse(prompt, apiKey, provider, customEndpoint)

        return new Response(stream, withCors({
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        }))

    } catch (error) {
        console.error('Generation Error:', error?.message || error)
        return NextResponse.json(
            { error: 'Unexpected error while generating README' },
            withCors({ status: 500 })
        )
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, withCors({ status: 200 }))
}
