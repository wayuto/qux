import { Application, send } from "oak";
import { router } from "./routes.ts";
import { cors, logger } from "./middlewares.ts";
import { advertiseService } from "./discovery.ts";

const app = new Application();

app.use(async (ctx, next) => {
  if (
    ctx.request.url.pathname.startsWith("/css") ||
    ctx.request.url.pathname.startsWith("/js")
  ) {
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

const main = app.listen({ port: 1145 });

await Promise.all([main, advertiseService]);
