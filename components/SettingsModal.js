'use client'

import { useEffect, useState } from 'react';
import { X, Save, Key } from 'lucide-react';

/**
 * Modal for selecting provider configuration, API keys, and GitHub token stored client-side.
 */
export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }) {
    // Initialize state directly from initialSettings or default values
    const [provider, setProvider] = useState(initialSettings?.provider || 'openai');
    const [apiKey, setApiKey] = useState(initialSettings?.apiKey || '');
    const [customEndpoint, setCustomEndpoint] = useState(initialSettings?.customEndpoint || '');
    const [githubToken, setGithubToken] = useState(initialSettings?.githubToken || '');

    useEffect(() => {
        const nextProvider = initialSettings?.provider || 'openai';
        const nextApiKey = initialSettings?.apiKey || '';
        const nextCustomEndpoint = initialSettings?.customEndpoint || '';
        const nextGithubToken = initialSettings?.githubToken || '';

        setProvider((prev) => (prev !== nextProvider ? nextProvider : prev));
        setApiKey((prev) => (prev !== nextApiKey ? nextApiKey : prev));
        setCustomEndpoint((prev) => (prev !== nextCustomEndpoint ? nextCustomEndpoint : prev));
        setGithubToken((prev) => (prev !== nextGithubToken ? nextGithubToken : prev));
    }, [initialSettings?.provider, initialSettings?.apiKey, initialSettings?.customEndpoint, initialSettings?.githubToken]);


    const handleSave = () => {
        const settings = {
            provider,
            apiKey,
            customEndpoint,
            githubToken
        };

        onSave(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-md rounded-xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} aria-label="Close settings modal" className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Key size={24} />
                    </div>
                    <h2 className="text-xl font-bold">API Settings</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="provider-select" className="block text-lg font-semibold text-white mb-2">Provider</label>
                        <select
                            id="provider-select"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="input-field bg-black/40"
                        >
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="api-key-input" className="block text-lg font-semibold text-white mb-2">API Key</label>
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Enter your ${provider} API key`}
                            className="input-field bg-black/40 text-lg"
                        />
                    </div>
                    {provider === 'openrouter' && (
                        <div>
                            <label htmlFor="custom-endpoint-input" className="block text-lg font-semibold text-white mb-2">Custom Endpoint (Optional)</label>
                            <input
                                id="custom-endpoint-input"
                                type="text"
                                value={customEndpoint}
                                onChange={(e) => setCustomEndpoint(e.target.value)}
                                placeholder="https://openrouter.ai/api/v1 (optional)"
                                className="input-field bg-black/40 text-lg"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="github-token-input" className="block text-lg font-semibold text-white mb-2">GitHub Token (Optional)</label>
                        <input
                            id="github-token-input"
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="Use a PAT to access private repos or avoid rate limits"
                            className="input-field bg-black/40 text-lg"
                        />
                    </div>
                    <button
                        onClick={() => handleSave()}
                        className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
