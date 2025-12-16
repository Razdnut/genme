'use client'

import { useState } from 'react';
import { Wand2, Github } from 'lucide-react';

/**
 * Collects repository URL, preferred README style, and optional details before triggering generation.
 */
export default function GeneratorForm({ onGenerate, isGenerating }) {
    const [url, setUrl] = useState('');
    const [style, setStyle] = useState('normal');
    const [projectDetails, setProjectDetails] = useState(''); // New state for project details
    const [urlError, setUrlError] = useState(null);

    const normalizeRepoUrl = (rawUrl) => {
        if (!rawUrl) return null;
        const trimmed = rawUrl.trim();
        const candidate = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;

        try {
            const parsed = new URL(candidate);
            const hostname = parsed.hostname.replace(/^www\./, '');
            if (hostname !== 'github.com') return null;

            const parts = parsed.pathname
                .replace(/\.git$/, '')
                .replace(/\/+$/, '')
                .split('/')
                .filter(Boolean);

            if (parts.length < 2) return null;
            const [owner, repo] = parts;
            return `https://github.com/${owner}/${repo}`;
        } catch {
            return null;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate URL
        if (!url) {
            setUrlError('GitHub repository URL cannot be empty.');
            return;
        }
        const normalizedUrl = normalizeRepoUrl(url);
        if (!normalizedUrl) {
            setUrlError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo).');
            return;
        }

        setUrlError(null); // Clear error if validation passes
        onGenerate({ url: normalizedUrl, style, projectDetails }); // Pass projectDetails
    };

    // Handler for URL input change to clear error when user types
    const handleUrlChange = (e) => {
        const newUrl = e.target.value;
        setUrl(newUrl);
        if (urlError) {
            setUrlError(null);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="glass-panel p-6 rounded-xl space-y-6 w-full">
            <div className="space-y-2">
                <label htmlFor="repo-url" className="block text-sm font-medium text-gray-300">GitHub Repository URL</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center h-5 pointer-events-none">
                        <Github size={20} />
                    </div>
                    <input
                        id="repo-url"
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="https://github.com/username/repo"
                        required
                        autoFocus
                        className={`input-field pl-12 ${urlError ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                </div>
                {urlError && <p className="mt-1 text-sm text-red-400">{urlError}</p>}
            </div>

            {/* New textarea for additional project details */}
            <div className="space-y-2">
                <label htmlFor="project-details" className="block text-sm font-medium text-gray-300">Additional Project Details (Optional)</label>
                <textarea
                    id="project-details"
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    rows="4"
                    placeholder="Describe your project's purpose, key features, target audience, desired tone, etc."
                    className="input-field"
                ></textarea>
            </div>

            <fieldset className="space-y-2">
                <legend className="block text-sm font-medium text-gray-300">README Style</legend>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['light', 'simple', 'normal', 'medium', 'deep'].map((s) => (
                        <div key={s}>
                            <input
                                type="radio"
                                id={`style-${s}`}
                                name="style"
                                value={s}
                                checked={style === s}
                                onChange={() => setStyle(s)}
                                className="sr-only"
                            />
                            <label
                                htmlFor={`style-${s}`}
                                className={`cursor-pointer flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize border ${style === s
                                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                    : 'bg-black/20 border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                    } focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
                            >
                                {s}
                            </label>
                        </div>
                    ))}
                </div>
            </fieldset>

            <button
                type="submit"
                disabled={isGenerating}
                className={`btn-primary w-full flex items-center justify-center gap-2 text-lg ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''} focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
            >
                {isGenerating ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing & Generating...
                    </>
                ) : (
                    <>
                        <Wand2 size={20} />
                        Generate README
                    </>
                )}
            </button>
        </form>
    );
}
