import { Bot, GrammyError, InlineKeyboard } from "grammy";
import { BOT_TOKEN, CACHE_TIME, CAN_I_USE_URL, MINIMUM_QUERY_LENGTH, RESULT_LIMIT } from "./config.ts";
import { search } from "./caniuse.ts";
import { buildArticle, prepareWebAppUrl } from "./builders.ts";

const bot = new Bot(BOT_TOKEN);

bot.catch((err) => {
    console.error(err);
});

bot.on("message", (ctx) => {
    if (ctx.message.via_bot) return;
    const keyboard = new InlineKeyboard();
    keyboard.switchInline('Open inline mode', '');
    ctx.reply("Welcome! This bot works only in inline mode.", {
        reply_markup: keyboard,
    });
});

bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query;

    function rejectQuery() {
        ctx.answerInlineQuery(
            [],
            { cache_time: CACHE_TIME },
        ).catch();
    }

    if (!query || query.length < MINIMUM_QUERY_LENGTH) {
        rejectQuery();
        return;
    };

    const features = search(query);
    if (!features?.length) {
        rejectQuery();
        return;
    }

    const results = features.slice(0, RESULT_LIMIT).map(buildArticle);

    ctx.answerInlineQuery(
        results,
        {
            cache_time: CACHE_TIME,
            button: {
                text: 'Open in web app',
                web_app: {
                    url: prepareWebAppUrl(CAN_I_USE_URL + features[0].id),
                }
            }
        },
    );
});

bot.start();

console.log(">>> Bot started");
