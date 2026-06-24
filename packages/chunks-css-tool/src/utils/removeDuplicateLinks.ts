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
