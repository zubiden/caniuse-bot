import caniuse from 'caniuse-db/data.json' assert { type: "json" };
import Elasticlunr from 'elasticlunr';

export type Feature = typeof caniuse.data[keyof typeof caniuse.data] & { id: string };

function createIndex() {
    const index = Elasticlunr();
    index.addField('title');
    index.addField('description');
    index.addField('keywords');
    index.setRef('id');
    index.saveDocument(false);

    Elasticlunr.clearStopWords();

    for (const feature of Object.keys(caniuse.data)) {
        const data = caniuse.data[feature];
        index.addDoc({
            id: feature,
            title: data.title,
            description: data.description,
            keywords: data.keywords,
        });
    }

    return index;
}
const SEARCH_INDEX = createIndex();

const FIELD_BOOST = {
    title: 10,
    description: 1,
    keywords: 2,
};

const DESKTOP_BROWSER_MAP = {
    'chrome': 'Google Chrome',
    'safari': 'Safari',
    'firefox': 'Mozilla Firefox',
    'edge': 'Microsoft Edge',
    'opera': 'Opera',
    'ie': 'Internet Explorer',
}

const MOBILE_BROWSER_MAP = {
    'and_chr': 'Android Chrome',
    'ios_saf': 'iOS Safari',
    'and_ff': 'Android Firefox',
    'samsung': 'Samsung Internet',
}

export const BROWSER_MAP = {
    ...DESKTOP_BROWSER_MAP,
    ...MOBILE_BROWSER_MAP,
};

type DesktopBrowserKey = keyof typeof DESKTOP_BROWSER_MAP;
type MobileBrowserKey = keyof typeof MOBILE_BROWSER_MAP;
type BrowserKey = DesktopBrowserKey | MobileBrowserKey

export type BrowserSupport = {
    fullSupport?: string;
    partialSupport?: string;
    prefixedSupport?: string;
}

export function search(query: string): Feature[] {
    const queryLowCase = query.toLowerCase();
    const potentialQueries = new Set([queryLowCase]);
    potentialQueries.add(queryLowCase.replace(' ', '-'));
    potentialQueries.add(queryLowCase.replace('\s+', ''));

    const results = new Set<string>();
    for (const potentialQuery of potentialQueries) {
        const queryResults = SEARCH_INDEX.search(potentialQuery, FIELD_BOOST);
        for (const result of queryResults) {
            results.add(result.ref);
        }
    }

    return Array.from(results).map((result) => {
        const data = caniuse.data[result];
        if (!data) return undefined;
        data.id = result;
        return data;
    }).filter(Boolean);
}

export function getSupportInfo(feature: Feature) {
    const desktop = Object.keys(DESKTOP_BROWSER_MAP)
        .reduce((acc, browser) => {
            const support = getBrowserSupportInfo(feature, browser as BrowserKey)
            if (support) {
                acc[browser] = support;
            }
            return acc;
        }, {} as Record<DesktopBrowserKey, BrowserSupport>);

    const mobile = Object.keys(MOBILE_BROWSER_MAP)
        .reduce((acc, browser) => {
            const support = getBrowserSupportInfo(feature, browser as BrowserKey)
            if (support) {
                acc[browser] = support;
            }
            return acc;
        }, {} as Record<MobileBrowserKey, BrowserSupport>);
    
    return {
        desktop,
        mobile,
        supportPercent: feature.usage_perc_y,
        partialSupportPercent: feature.usage_perc_a,
    };
}

function getBrowserSupportInfo(feature: Feature, browser: BrowserKey): BrowserSupport | undefined {
    const support = feature.stats[browser];
    if (!support) return undefined;

    // y - Yes, x - Prefix, a - Partial support
    const fullSupport = findFirstVersion(support, 'y');
    const partialSupport = findFirstVersion(support, 'a');
    const prefixedSupport = findFirstVersion(support, 'x');

    return {
        fullSupport,
        partialSupport,
        prefixedSupport,
    };
}

function versionComparator(a: string, b: string) {
    if (a === 'TP') return 1;
    if (b === 'TP') return -1;

    const cleanedA = a.match(/[\d.]+/)?.[0] || '';
    const cleanedB = b.match(/[\d.]+/)?.[0] || '';

    return cleanedA.localeCompare(cleanedB, undefined, { numeric: true, sensitivity: 'base' });
}

function findFirstVersion(support: Record<string, string>, type: string) {
    const versionKeys = Object.keys(support).sort(versionComparator).reverse();

    let lastSupported: string | undefined;
    for (const version of versionKeys) {
        if (support[version].startsWith(type)) {
            lastSupported = version;
        } else {
            break;
        }
    }

    // Use first version in range
    return lastSupported?.split('-')[0];
}