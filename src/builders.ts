import { InlineKeyboard, InlineQueryResultBuilder } from "grammy";
import removeMarkdown from "remove-markdown";
import { BROWSER_MAP, BrowserSupport, Feature, getBrowserSupportPercent, getSupportInfo } from "./caniuse.ts";
import { CAN_I_USE_URL, WEB_APP_URL } from "./config.ts";

export function buildArticle(feature: Feature) {
    const keyboard = new InlineKeyboard()
        .url("Open on caniuse.com", CAN_I_USE_URL + feature.id)
        .row()
        .url('Open in Web App', `${WEB_APP_URL}?startapp=${feature.id}`);

    const { supportPercent, partialSupportPercent, totalPercent } = getBrowserSupportPercent(feature);
    const percentString = partialSupportPercent ? `${supportPercent}% + ${partialSupportPercent}% = ${totalPercent}%` : `${supportPercent}%`;

    return InlineQueryResultBuilder
        .article(feature.id, feature.title, {
            description: `${percentString} • ${removeMarkdown(feature.description)}`,
            reply_markup: keyboard,
        }).text('', {
            message_text: buildMessage(feature),
            parse_mode: 'HTML',
        });
}

function buildMessage(feature: Feature) {
    const title = `<b>${feature.title}</b>\n\n`;
    const supportInfo = getSupportInfo(feature);
    const { supportPercent, partialSupportPercent } = getBrowserSupportPercent(feature);

    const partialSupport = partialSupportPercent ? ` (${partialSupportPercent}% partial)` : '';
    const percent = `Full support: <b>${supportPercent}%</b>${partialSupport}\n\n`;

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
    const base = new URL(WEB_APP_URL);
    base.searchParams.set('url', url);
    return base.toString();
}