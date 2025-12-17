'use client'

import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Eye, Code, Copy, Check } from 'lucide-react'
import clsx from 'clsx'

/**
 * Displays generated README content in preview/raw/split views with copy-to-clipboard controls.
 */
export default function LivePreview({ content }) {
    const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'raw' | 'split'
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Bolt ⚡: Memoize the Markdown rendering to prevent re-renders on tab change.
    // This is a significant performance improvement when dealing with large documents,
    // as it avoids re-parsing and re-rendering the entire Markdown tree.
    const memoizedMarkdown = useMemo(() => {
        return content ? <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown> : null;
    }, [content]);

    return (
        <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[600px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'preview' ? "bg-primary/20 text-primary" : "text-gray-400 hover:text-white"
                        )}
                    >
                        <Eye size={16} /> Preview
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'raw' ? "bg-primary/20 text-primary" : "text-gray-400 hover:text-white"
                        )}
                    >
                        <Code size={16} /> Raw
                    </button>
                    <button
                        onClick={() => setActiveTab('split')}
                        className={clsx(
                            "hidden md:flex px-3 py-1.5 rounded-md text-sm font-medium transition-all items-center gap-2",
                            activeTab === 'split' ? "bg-primary/20 text-primary" : "text-gray-400 hover:text-white"
                        )}
                    >
                        <span className="rotate-90"><Code size={16} /></span> Split
                    </button>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {/* Preview Mode */}
                <div className={clsx(
                    "absolute inset-0 overflow-auto p-6 transition-opacity duration-300",
                    activeTab === 'preview' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}>
                    <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                        {memoizedMarkdown || (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                <Eye size={48} className="mb-4" />
                                <p>Generated README will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Raw Mode */}
                <div className={clsx(
                    "absolute inset-0 overflow-auto p-6 bg-black/30 transition-opacity duration-300",
                    activeTab === 'raw' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}>
                    <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                        {content || "// Markdown content will appear here..."}
                    </pre>
                </div>

                {/* Split Mode */}
                <div className={clsx(
                    "absolute inset-0 flex transition-opacity duration-300",
                    activeTab === 'split' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}>
                    <div className="w-1/2 h-full overflow-auto p-6 border-r border-white/10 bg-black/30">
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                            {content || "// Markdown content..."}
                        </pre>
                    </div>
                    <div className="w-1/2 h-full overflow-auto p-6">
                        <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-pre:bg-black/50">
                            {memoizedMarkdown || (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                    <Eye size={48} className="mb-4" />
                                    <p>Preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
