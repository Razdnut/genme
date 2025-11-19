import { NextResponse } from 'next/server'
import { fetchRepoContent } from '@/lib/github'
import { streamLLMResponse } from '@/lib/llm'

export const runtime = 'edge' // Use Edge Runtime for streaming

export async function POST(req) {
    try {
        const { url, style, apiKey, provider, customEndpoint, projectDetails, githubToken } = await req.json() // Added projectDetails

        if (!url || !apiKey) {
            return NextResponse.json({ error: 'Missing URL or API Key' }, { status: 400 })
        }

        // 1. Fetch Repo Content
        const repoData = await fetchRepoContent(url, githubToken)

        // 2. Construct Prompt
        const fileContext = repoData.files.map(f => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')

        const stylePrompts = {
            light: "Keep it brief and concise. Focus on what it does and how to run it.",
            simple: "Simple language, easy to understand. Good for beginners.",
            normal: "Standard professional README. Installation, Usage, Features.",
            medium: "Detailed. Include configuration, API reference if applicable, and contributing.",
            deep: "Extremely comprehensive. Deep dive into architecture, design choices, full API docs, testing, and deployment."
        }

        // Conditionally add projectDetails to the prompt
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
      - Do not include the file contents I gave you in the output, just use them to understand the code.
    `

        // 3. Stream Response
        const stream = await streamLLMResponse(prompt, apiKey, provider, customEndpoint)

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('Generation Error:', error)
        return NextResponse.json({ error: error.message || 'Unexpected error while generating README' }, { status: 500 })
    }
}
