import type { ImgHTMLAttributes } from 'react';

/**
 * Some CDNs return 403 when the browser sends a cross-origin Referer.
 * Use on <img> for http(s) URLs loaded from brand settings or user content.
 */
export function externalAssetImgAttrs(src: string): Pick<ImgHTMLAttributes<HTMLImageElement>, 'referrerPolicy'> {
    if (/^https?:\/\//i.test(src.trim())) {
        return { referrerPolicy: 'no-referrer' };
    }

    return {};
}
