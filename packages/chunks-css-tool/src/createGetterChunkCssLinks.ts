import fs from 'fs';
import { resolve } from 'path';

import { createUrlToChunkName } from './utils/createUrlToChunkName';
import { removeDuplicateLinks } from './utils/removeDuplicateLinks';

import type { ICreateGetterChunkCssLinks } from './interfaces';

const CHUNK_MANIFEST_PATH = resolve(__dirname, '../client/styles/chunk-manifest.json');
const HTML_TEMPLATE_PATH = resolve(__dirname, './template.html');

export const createGetterChunkCssLinks: ICreateGetterChunkCssLinks = ({
    chunksCssManifestPath = CHUNK_MANIFEST_PATH,
    htmlTemplatePath = HTML_TEMPLATE_PATH,
    createUrlToChunk = createUrlToChunkName
} = {}) => {
    let chunksCssManifest: Record<string, string[]> = {};
    try {
        chunksCssManifest = JSON.parse(fs.readFileSync(chunksCssManifestPath, 'utf-8'));
    } catch {
        console.warn(
            `[createGetterChunkStyleLinks]: Failed to read chunksCssManifest at ${chunksCssManifestPath}. Please check ChunkManifestPlugin.`
        );
    }

    let htmlTemplate = '';
    try {
        htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
    } catch {
        console.warn(
            `[createGetterChunkStyleLinks]: Failed to read htmlTemplate at ${htmlTemplatePath}.`
        );
    }

    const chunksCssLinks: Record<string, string> = Object.entries(chunksCssManifest).reduce((result, [key, files]) => {
        const links = files.map((file) => (`<link href="/${file}" rel="stylesheet">`));
        const deduplicateLinks = removeDuplicateLinks(htmlTemplate, links);
        return ({
            ...result,
            [key]: deduplicateLinks.join('\n')
        });
    }, {});

    const urlToChunkName = createUrlToChunk(Object.keys(chunksCssLinks));

    return (url) => {
        const pageChunkName = urlToChunkName(url);
        return pageChunkName ? (chunksCssLinks[pageChunkName] ?? null) : null;
    };
};
