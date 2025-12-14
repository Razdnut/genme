'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import SettingsModal from '@/components/SettingsModal'
import GeneratorForm from '@/components/GeneratorForm'
import LivePreview from '@/components/LivePreview'

const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKey: '',
  customEndpoint: '',
  githubToken: ''
}

const sanitizeSettings = (settings = {}) => {
  const safeString = value => {
    if (typeof value !== 'string') return ''
    const trimmed = value.replace(/[\u0000-\u001F\u007F]/g, '').trim()
    return trimmed.slice(0, 256)
  }

  const provider = ['openai', 'gemini', 'openrouter'].includes(settings.provider)
    ? settings.provider
    : DEFAULT_SETTINGS.provider

  return {
    provider,
    apiKey: safeString(settings.apiKey),
    customEndpoint: provider === 'openrouter' ? safeString(settings.customEndpoint) : '',
    githubToken: safeString(settings.githubToken)
  }
}

const loadStoredSettings = () => {
  try {
    const storedSettings = localStorage.getItem('readme_gen_settings')
    if (!storedSettings) return DEFAULT_SETTINGS

    const parsed = JSON.parse(storedSettings)
    return {
      ...DEFAULT_SETTINGS,
      ...sanitizeSettings(parsed)
    }
  } catch (error) {
    console.warn('Ignoring invalid stored settings', error)
    localStorage.removeItem('readme_gen_settings')
    return DEFAULT_SETTINGS
  }
}

/**
 * Main page layout orchestrating settings, form submission, and live README preview.
 */
export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiSettings, setApiSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    // Only run once on component mount to load initial settings
    setApiSettings(loadStoredSettings())
  }, []) // Empty dependency array means this effect runs once on mount

  const handleSettingsSave = newSettings => {
    const sanitized = sanitizeSettings(newSettings)
    localStorage.setItem('readme_gen_settings', JSON.stringify(sanitized))
    setApiSettings(sanitized)
    setIsSettingsOpen(false)
  }

  const handleGenerate = async ({ url, style, projectDetails }) => {
    const safeSettings = sanitizeSettings(apiSettings)

    setIsGenerating(true)
    setGeneratedContent('') // Clear previous content

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          style,
          projectDetails,
          apiKey: safeSettings.apiKey,
          provider: safeSettings.provider,
          customEndpoint: safeSettings.customEndpoint,
          githubToken: safeSettings.githubToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed with status ${response.status}`);
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        setGeneratedContent(prev => prev + text)
      }

    } catch (error) {
      console.error('Generation error details:', error)
      setGeneratedContent(`# Error\n${error.message || 'Failed to generate README. Please check your settings and try again.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      <>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsSave}
          initialSettings={apiSettings}
          key={isSettingsOpen ? 'settings-modal-open' : 'settings-modal-closed'}
        />

        <div className="z-10 w-full max-w-6xl flex items-center justify-between font-mono text-sm mb-12">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>v1.0.0</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        <div className="relative flex flex-col items-center mb-12 z-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />

          <h1 className="text-5xl md:text-7xl font-bold text-center gradient-text mb-6 tracking-tight">
            README Generator
          </h1>
          <p className="text-center max-w-2xl text-gray-400 text-lg">
            Transform your GitHub repository into a compelling project landing page with AI-powered documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl z-10">
          <div className="lg:col-span-4 space-y-6">
            <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />

            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Pro Tips</h3>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Ensure your repo is public (for now).</li>
                <li>Select &apos;Deep&apos; for complex projects.</li>
                <li>Configure your API key in settings first.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8">
            <LivePreview content={generatedContent} />
          </div>
        </div>
      </>
    </main>
  )
}
