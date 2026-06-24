import type { ICreateUrlToChunkName } from '../interfaces';

type PatternSegment =
    { type: 'static'; value: string }
    | { type: 'param'; name: string };

type TrieNode = {
    staticChildren: Map<string, TrieNode>;
    paramChild: TrieNode | null;
    depth: number;
    name: string | null;
};

type Match = {
    name: string;
    depth: number;
    params: number;
};

const DEFAULT_RESULT_CACHE_LIMIT = 1000;

const createTrieNode = (depth: number): TrieNode => ({
    staticChildren: new Map(),
    paramChild: null,
    depth,
    name: null
});

const parsePatternSegments = (pattern: string): PatternSegment[] => {
    const trimmed = pattern.replace(/^\/|\/$/g, '');
    if (trimmed === '') {
        return [];
    }
    return trimmed.split('/').filter(Boolean).map<PatternSegment>((segment) =>
        segment.startsWith(':') ? { type: 'param', name: segment.slice(1) } : { type: 'static', value: segment }
    );
};

const buildTrie = (chunkNames: readonly string[]): TrieNode => {
    const root = createTrieNode(0);

    for (const pattern of chunkNames) {
        const segments = parsePatternSegments(pattern);
        if (segments.length === 0) {
            continue;
        }

        let node = root;
        for (const segment of segments) {
            if (segment.type === 'static') {
                let child = node.staticChildren.get(segment.value);
                if (!child) {
                    child = createTrieNode(node.depth + 1);
                    node.staticChildren.set(segment.value, child);
                }
                node = child;
            } else {
                if (!node.paramChild) {
                    node.paramChild = createTrieNode(node.depth + 1);
                }
                node = node.paramChild;
            }
        }

        node.name ??= pattern;
    }

    return root;
};

const isBetterMatch = (candidate: Match, current: Match | null): boolean => {
    if (!current) {
        return true;
    }
    if (candidate.depth !== current.depth) {
        return candidate.depth > current.depth;
    }
    return candidate.params < current.params;
};

const searchTrie = (
    node: TrieNode,
    segments: string[],
    index: number,
    paramsSoFar: number
): Match | null => {
    let best: Match | null = node.name !== null ? { name: node.name, depth: node.depth, params: paramsSoFar } : null;

    if (index < segments.length) {
        const segment = segments[index];

        const staticChild = node.staticChildren.get(segment);
        if (staticChild) {
            const candidate = searchTrie(staticChild, segments, index + 1, paramsSoFar);
            if (candidate && isBetterMatch(candidate, best)) {
                best = candidate;
            }
        }

        if (node.paramChild) {
            const candidate = searchTrie(node.paramChild, segments, index + 1, paramsSoFar + 1);
            if (candidate && isBetterMatch(candidate, best)) {
                best = candidate;
            }
        }
    }

    return best;
};

const parsePathSegments = (url: string): string[] | null => {
    let pathname: string;
    try {
        pathname = new URL(url, 'http://localhost').pathname;
    } catch {
        pathname = url.split('?')[0].split('#')[0];
    }
    const trimmed = pathname.replace(/^\/|\/$/g, '');
    return trimmed === '' ? null : trimmed.split('/').filter(Boolean);
};

export const createUrlToChunkName: ICreateUrlToChunkName = (
    chunkNames: string[],
    rootName = 'root',
    cacheLimit = DEFAULT_RESULT_CACHE_LIMIT
) => {
    const root = buildTrie(chunkNames);
    const cache = new Map<string, string | null>();

    return (url) => {
        const cached = cache.get(url);
        if (cached !== undefined) {
            return cached;
        }

        const segments = parsePathSegments(url);

        let result: string | null;
        if (segments === null) {
            result = rootName;
        } else {
            const match = searchTrie(root, segments, 0, 0);
            result = match ? match.name : null;
        }

        if (cache.size >= cacheLimit) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(url, result);

        return result;
    };
};
