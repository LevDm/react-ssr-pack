export type IGetChunkCssLinks = (url: string) => string | null;

export type IUrlToChunkName = (url: string, chunkNames: string[]) => string | null;

export type ICreateGetterChunkCssLinks = (args?: {
    chunksCssManifestPath?: string;
    htmlTemplatePath?: string;
    urlToChunkName?: IUrlToChunkName;
}) => IGetChunkCssLinks;
