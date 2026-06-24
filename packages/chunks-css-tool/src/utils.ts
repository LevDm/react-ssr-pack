import type { IUrlToChunkName } from './interfaces';

const extractStyleUrls = (html: string): Set<string> => {
    const urls = new Set<string>();
    const regex = /<link(?=[^>]*\brel=["']?stylesheet["']?)[^>]*\bhref=["']([^"']+)["']/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1]);
    }
    return urls;
};

export const removeDuplicateLinks = (baseHtml: string, cssLinks: string[]): string[] => {
    const existingUrls = extractStyleUrls(baseHtml);
    const filteredLines: string[] = [];

    for (const line of cssLinks) {
        const hrefMatch = new RegExp(/href=["']([^"']+)["']/).exec(line);
        if (hrefMatch) {
            const href = hrefMatch[1];
            if (!existingUrls.has(href)) {
                filteredLines.push(line);
            }
        }
    }

    return filteredLines;
};

export const urlToChunkName: IUrlToChunkName = (url, chunkNames) => {
    let pathname: string;
    try {
        const urlObj = new URL(url, 'http://localhost');
        pathname = urlObj.pathname;
    } catch {
        pathname = url.split('?')[0].split('#')[0];
    }
    const trimmed = pathname.replace(/^\/|\/$/g, '');

    if (trimmed === '') {
        return 'root';
    }

    const segments = trimmed.split('/').filter(Boolean);

    for (let i = segments.length; i > 0; i--) {
        const candidate = segments.slice(0, i).join('/');
        if (chunkNames.includes(candidate)) {
            return candidate;
        }
    }

    return null;
};
