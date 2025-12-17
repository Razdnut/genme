/**
 * Normalizes a GitHub repository URL to a standard format.
 * @param {string} rawUrl - The raw GitHub repository URL.
 * @returns {{owner: string, repo: string}|null} - The normalized repository owner and name, or null if invalid.
 */
export const normalizeRepoUrl = (rawUrl) => {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    // Add protocol if missing to make URL parsing more robust
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let parsed;
    try {
        parsed = new URL(candidate);
    } catch {
        return null;
    }

    const hostname = parsed.hostname.replace(/^www\./, '');
    if (hostname !== 'github.com') return null;

    const parts = parsed.pathname
        .replace(/\.git$/, '')
        .replace(/\/+$/, '')
        .split('/')
        .filter(Boolean);

    if (parts.length < 2) return null;

    const [owner, repo] = parts;
    return { owner, repo };
};
