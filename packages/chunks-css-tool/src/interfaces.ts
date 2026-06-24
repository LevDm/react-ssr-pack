export type IGetChunkCssLinks = (url: string) => string | null;

export type IUrlToChunkName = (url: string) => string | null;

export type ICreateUrlToChunkName = (
    chunkNames: string[],
    rootName?: string,
    cacheLimit?: number
) => IUrlToChunkName;

export type ICreateGetterChunkCssLinks = (args?: {
    chunksCssManifestPath?: string;
    htmlTemplatePath?: string;
    createUrlToChunk?: ICreateUrlToChunkName;
}) => IGetChunkCssLinks;
