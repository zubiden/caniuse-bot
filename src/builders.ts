import { InlineKeyboard, InlineQueryResultBuilder } from "grammy";
import { BROWSER_MAP, BrowserSupport, Feature, getSupportInfo } from "./caniuse.ts";
import { CAN_I_USE_URL, WEB_APP_ESCAPE } from "./config.ts";

export function buildArticle(feature: Feature) {
    const keyboard = new InlineKeyboard()
        .url("Open on caniuse.com", CAN_I_USE_URL + feature.id);
    return InlineQueryResultBuilder
        .article(feature.id, feature.title, { description: feature.description, reply_markup: keyboard })
        .text('', { message_text: buildMessage(feature), parse_mode: 'HTML' });
}

function buildMessage(feature: Feature) {
    const title = `<b>${feature.title}</b>\n\n`;
    const supportInfo = getSupportInfo(feature);

    const partialSupport = supportInfo.partialSupportPercent ? ` (${supportInfo.partialSupportPercent}% partial)` : '';
    const percent = `Full support: <b>${supportInfo.supportPercent}%</b>${partialSupport}\n\n`;

    const desktop = Object.keys(supportInfo.desktop).map((browserKey) => {
        const browserName = BROWSER_MAP[browserKey];
        return `• ${browserName}: <b>${prepareSupportString(supportInfo.desktop[browserKey])}</b>`;
    }).join('\n');

    const mobile = Object.keys(supportInfo.mobile).map((browserKey) => {
        const browserName = BROWSER_MAP[browserKey];
        return `• ${browserName}: <b>${prepareSupportString(supportInfo.mobile[browserKey])}</b>`;
    }).join('\n');

    return title + percent + `<u>Desktop</u>: \n${desktop}\n\n` + `<u>Mobile</u>: \n${mobile}`;
}

function prepareSupportString(support: BrowserSupport = {}) {
    const { fullSupport, partialSupport, prefixedSupport } = support;

    if (fullSupport) {
        return fullSupport;
    }

    if (partialSupport) {
        return partialSupport + ' (partial)';
    }

    if (prefixedSupport) {
        return prefixedSupport + ' (prefixed)';
    }

    return 'Not supported';
}

export function prepareWebAppUrl(url: string) {
    const base = new URL(WEB_APP_ESCAPE);
    base.searchParams.set('url', url);
    return base.toString();
}