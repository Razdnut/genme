const DECODER = new TextDecoder();

const normalizeRepoUrl = (rawUrl) => {
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

const buildGitHubHeaders = (githubToken) => {
    const headers = {
        'User-Agent': 'readme-generator',
        'Accept': 'application/vnd.github+json',
    };
    if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
    }
    return headers;
};

const decodeBase64 = (value) => {
    if (!value) return '';
    const sanitized = value.replace(/\s/g, '');

    // Edge runtime provides atob; fallback to Buffer for other environments (e.g., local tests)
    if (typeof atob === 'function') {
        const binaryString = atob(sanitized);
        const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        return DECODER.decode(bytes);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(sanitized, 'base64').toString('utf-8');
    }

    return '';
};

export async function fetchRepoContent(repoUrl, githubToken) {
    const parsed = normalizeRepoUrl(repoUrl);
    if (!parsed) {
        throw new Error('Invalid GitHub URL format. Expected https://github.com/<owner>/<repo>');
    }

    const { owner, repo } = parsed;
    const headers = buildGitHubHeaders(githubToken);

    try {
        // Fetch repository metadata to get default branch
        const repoDataRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!repoDataRes.ok) {
            const detail = await repoDataRes.text();
            if (repoDataRes.status === 404) throw new Error('Repository not found or private');
            throw new Error(`GitHub repo fetch failed (${repoDataRes.status}): ${detail}`);
        }
        const repoData = await repoDataRes.json();
        const defaultBranch = repoData.default_branch;

        // Fetch file tree
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
            { headers }
        );
        if (!treeRes.ok) {
            const detail = await treeRes.text();
            throw new Error(`Failed to fetch file tree (${treeRes.status}): ${detail}`);
        }
        const treeData = await treeRes.json();

        // Filter for important files
        const importantFiles = (treeData.tree || [])
            .filter((file) => {
                const name = file.path.toLowerCase();
                return (
                    file.type === 'blob' &&
                    (
                        name.endsWith('package.json') ||
                        name.endsWith('cargo.toml') ||
                        name.endsWith('requirements.txt') ||
                        name.endsWith('go.mod') ||
                        name.endsWith('readme.md') ||
                        (file.size < 20000 && !name.includes('lock') && !name.includes('.png'))
                    )
                );
            })
            .slice(0, 20); // Limit to avoid token limits

        // Fetch content for these files
        const filesContent = await Promise.all(
            importantFiles.map(async (file) => {
                const contentRes = await fetch(file.url, { headers });
                if (!contentRes.ok) {
                    const detail = await contentRes.text();
                    throw new Error(`Failed to fetch file ${file.path} (${contentRes.status}): ${detail}`);
                }
                const contentData = await contentRes.json();
                return {
                    path: file.path,
                    content: decodeBase64(contentData.content),
                };
            })
        );

        return {
            owner,
            repo,
            description: repoData.description || 'No description provided.',
            files: filesContent,
        };
    } catch (error) {
        console.error('Error fetching repo:', error);
        throw error;
    }
}
