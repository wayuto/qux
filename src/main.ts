import { Application, send } from "oak";
import { advertise } from "dns_sd/src/dns_sd/advertise.ts";
import { MulticastInterface } from "dns_sd/src/mdns/multicast_interface.ts";
import { DriverDeno } from "dns_sd/mod.deno.ts";
import { router } from "./routes.ts";
import { logger, cors } from "./middlewares.ts";

const multicastInterface = new MulticastInterface(new DriverDeno("IPv4"));

const app = new Application();

app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/css") || ctx.request.url.pathname.startsWith("/js")) {
        await send(ctx, ctx.request.url.pathname, { root: "src/views" });
    } else if (ctx.request.url.pathname.startsWith("/uploads")) {
        return await send(ctx, ctx.request.url.pathname, { root: "." });
    } else {
        await next();
    }
});

app.use(logger);
app.use(cors);

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
    if (ctx.response.status === 404) {
        const accept = ctx.request.headers.get("accept") || "";

        if (accept.includes("application/json")) {
            ctx.response.type = "json";
            ctx.response.body = { error: "Not Found", status: 404 };
        } else {
            ctx.response.type = "html";
            try {
                ctx.response.body = await Deno.readTextFile("src/views/404.html");
                ctx.response.status = 404;
            } catch {
                ctx.response.body = "404 - Page Not Found";
                ctx.response.status = 404;
            }
        }
    }
});

const p1 = app.listen({ port: 1145 });
const p2 = (async () => {
    console.log(
        `Advertising "Qux" on ${multicastInterface.hostname}:1145`,
    );

    await advertise({
        service: {
            name: "Qux",
            port: 1145,
            protocol: "tcp",
            type: "http",
            txt: {},
        },
        multicastInterface,
    });
})();

await Promise.all([p1, p2]);