import { resolve } from 'path';
import fs from 'fs';

import { stateAddressPart } from '../../constants';

import type { Request } from 'express';
import type { TRenderServerAppRequestOptions } from '../../types';

type TGetServerAppHTML = (args: {
    head: {
        center: string;
        end?: string;
    };
    content: string;
}) => string;

type TGetHeadServerAppHTML = (args: {
    originalUrl: string;
    head: string;
}) => string;

const templatePath = resolve(__dirname, './template.html');
const titleRegexp = /<title>.*<\/title>/;
const container = {
    start: '<div id="root">',
    end: '</div>'
};
const HEAD_END = '</head>';

export const htmlTemplate = fs.readFileSync(templatePath, {
    encoding: 'utf-8'
});

const templateProcessedHeadParts = htmlTemplate.split(titleRegexp);
const templateProcessedCenterParts = templateProcessedHeadParts[1].split(HEAD_END);
const templateProcessedContentParts = templateProcessedCenterParts[1].split(`${container.start}${container.end}`);

const template = {
    top: {
        start: templateProcessedHeadParts[0], // [..., <title>]
        center: templateProcessedCenterParts[0], // [</title>, </head>]
        end: HEAD_END
    },
    bottom: {
        start: `${templateProcessedContentParts[0]}${container.start}`, // [</head>, <div id="root">]
        end: `${container.end}${templateProcessedContentParts[1]}` // [</div>, ...]
    }
};

export const getHeadServerAppHTML: TGetHeadServerAppHTML = ({
    originalUrl,
    head = ''
}) => (
    `${head}\r\n<script defer src="${stateAddressPart}${encodeURIComponent(originalUrl)}"></script>`
);

export const getServerAppHTML: TGetServerAppHTML = ({
    head = {
        center: '',
        end: ''
    },
    content = ''
}) => (
    `${template.top.start}${head.center}${template.top.center}${head.end || ''}${template.top.end}`
    + `${template.bottom.start}${content}${template.bottom.end}`
);

export const getRequestData = (request: Request): TRenderServerAppRequestOptions => {
    const { originalUrl, protocol, hostname, headers } = request;
    return {
        origin: `${protocol}://${headers.host}`,
        url: originalUrl,
        hostname,
        protocol
    };
};
