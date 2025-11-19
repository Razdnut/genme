export async function streamLLMResponse(prompt, apiKey, provider, customEndpoint) {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let url = 'https://api.openai.com/v1/chat/completions'
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
    let body = {
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are an expert developer and technical writer. You generate high-quality, comprehensive README.md files for GitHub repositories.' },
            { role: 'user', content: prompt }
        ],
        stream: true
    }

    if (provider === 'gemini') {
        // Gemini API is different, using the REST API for simplicity
        // Using gemini-2.5-flash for best availability and price-performance
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        headers = { 'Content-Type': 'application/json' }
        body = {
            contents: [{ parts: [{ text: prompt }] }]
        }
        // Note: We are using non-streaming for Gemini to ensure stability as manual stream parsing is complex
    } else if (provider === 'openrouter') {
        url = customEndpoint || 'https://openrouter.ai/api/v1/chat/completions'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github-readme-generator.com', // Required by OpenRouter
        }
        // Default to a high-quality model for OpenRouter
        body.model = 'anthropic/claude-3.5-sonnet'
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`LLM API Error: ${error}`)
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader()
                let buffer = ''
                let fullText = '' // For Gemini

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })

                    if (provider === 'gemini') {
                        fullText += chunk
                    } else {
                        // SSE Parsing for OpenAI/OpenRouter
                        buffer += chunk
                        const lines = buffer.split('\n')
                        buffer = lines.pop()

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6)
                                if (data === '[DONE]') continue
                                try {
                                    const parsed = JSON.parse(data)
                                    const content = parsed.choices[0]?.delta?.content || ''
                                    if (content) {
                                        controller.enqueue(encoder.encode(content))
                                    }
                                } catch (e) {
                                    // console.error('Error parsing stream:', e)
                                }
                            }
                        }
                    }
                }

                // Handle Gemini Full Response
                if (provider === 'gemini') {
                    try {
                        const parsed = JSON.parse(fullText)
                        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                        if (content) {
                            controller.enqueue(encoder.encode(content))
                        }
                    } catch (e) {
                        console.error('Gemini Parse Error:', e)
                        controller.enqueue(encoder.encode(`Error parsing Gemini response: ${e.message}`))
                    }
                }

                controller.close()
            }
        })

        return stream

    } catch (error) {
        console.error('Stream Error:', error)
        throw error
    }
}
