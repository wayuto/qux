import { Context } from "oak";

export const logger = async (ctx: Context, next: () => Promise<unknown>) => {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(2);
  console.log(
    `[${
      new Date().toISOString()
    }] ${ctx.request.method} ${ctx.request.url} -> ${ctx.response.status} (${ms}ms)`,
  );
};

export const cors = async (ctx: Context, next: () => Promise<unknown>) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
};
