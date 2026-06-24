const DEFAULT_IGNORED_CHUNK_NAMES = ['client', 'runtime', 'server']
const DEFAULT_MANIFEST_FILE_NAME = 'styles/chunk-manifest.json'

class ChunksCssManifestPlugin {
    constructor(options = {}) {
        this.options = {
            ignoredChunkNames: DEFAULT_IGNORED_CHUNK_NAMES,
            manifestFileName: DEFAULT_MANIFEST_FILE_NAME,
            includeHash: true,
            collectGroupChunksOptions: {
                includeReferenced: true,
                maxDepth: 1,
            },
            importRequestToURL: null,
            ...options,
        };
    }
    apply(compiler) {
        const pluginName = 'ChunksCssManifestPlugin';
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            if (compilation.compiler !== compiler) {
                return;
            }

            const {
                ignoredChunkNames,
                manifestFileName,
                includeHash,
                collectGroupChunksOptions,
                importRequestToURL,
            } = this.options;

            const { Compilation, sources } = compilation.compiler.webpack;

            compilation.hooks.processAssets.tap(
                {
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
                },
                () => {
                    const manifest = {};
                    const ignoredNames = new Set(ignoredChunkNames);
                    const buildHash = compilation.hash || compilation.fullHash;

                    for (const group of compilation.chunkGroups) {
                        const origin = [...group.origins].find((groupOrigin) => groupOrigin.module && groupOrigin.request);
                        if (!origin) {
                            continue;
                        }

                        const request = origin.request;
                        const mainChunk =
                            group.chunks.find((chunk) => chunk.name && !ignoredNames.has(chunk.name)) ||
                            group.chunks.find((chunk) => chunk.name) ||
                            group.chunks[0];

                        if (!mainChunk) {
                            continue;
                        }

                        const key = this.resolveKey(
                            mainChunk,
                            group,
                            request,
                            importRequestToURL,
                            ignoredNames
                        );

                        if (!key) {
                            continue;
                        }

                        const normalizeKey = this.getNormalizeKey(key);

                        const orderedChunks = this.collectGroupChunks(
                            group,
                            collectGroupChunksOptions
                        );

                        const cssFiles = this.getCssFiles(
                            orderedChunks,
                            buildHash,
                            includeHash
                        );

                        if (cssFiles.length === 0) {
                            continue;
                        }

                        if (manifest[normalizeKey]) {
                            for (const cssFile of cssFiles) {
                                if (!manifest[normalizeKey].includes(cssFile)) {
                                    manifest[normalizeKey].push(cssFile);
                                }
                            }
                        } else {
                            manifest[normalizeKey] = cssFiles;
                        }
                    }

                    const json = JSON.stringify(manifest, null, 2);
                    compilation.emitAsset(
                        manifestFileName,
                        new sources.RawSource(json)
                    );
                }
            );
        });
    }

    getCssFiles(orderedChunks, buildHash, includeHash) {
        const cssFiles = [];
        const addedFiles = new Set();

        for (const orderedChunk of orderedChunks) {
            for (const file of orderedChunk.files) {
                if (file.endsWith('.css') && !addedFiles.has(file)) {
                    addedFiles.add(file);
                    cssFiles.push(includeHash && buildHash ? `${file}?${buildHash}` : file);
                }
            }
        }

        return cssFiles
    }

    getNormalizeKey(key) {
        const stringKey = String(key);
        if (stringKey === '/') {
            return 'root';
        }
        return stringKey.replace(/^\/|\/$/g, '');
    }

    resolveKey(mainChunk, group, request, importRequestToURL, ignoredNames) {
        if (importRequestToURL && request) {
        try {
            const url = importRequestToURL(
                request,
                {
                    chunk: mainChunk,
                    group,
                }
            );
            if (url) {
                return url;
            }
        } catch {}
        }

        if (mainChunk.name && !ignoredNames.has(mainChunk.name)) {
            return mainChunk.name;
        }

        return null;
    }

    collectGroupChunks(group, options = {}) {
        const {
            includeReferenced = true,
            maxDepth = 1,
        } = options;

        const seenChunks = new Set();
        const ordered = [];

        const pushChunk = (chunk) => {
            if (chunk && !seenChunks.has(chunk)) {
                seenChunks.add(chunk);
                ordered.push(chunk)
            };
        };

        for (const chunk of group.chunks) {
            pushChunk(chunk);
        }

        if (includeReferenced && maxDepth > 0) {
            const visit = (visitedGroup, level) => {
                if (level >= maxDepth) {
                    return;
                }
                for (const child of visitedGroup.childrenIterable) {
                    for (const chunk of child.chunks) {
                        pushChunk(chunk);
                    }
                    visit(child, level + 1);
                }
            };
            visit(group, 0);
        }
        return ordered;
    }
}

module.exports = ChunksCssManifestPlugin