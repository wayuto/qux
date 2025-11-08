import { Router } from "oak";
import {
  isAuthenticated,
  setAuthCookie,
  verifyPassword,
} from "./authentication.ts";
import { browseService } from "./discovery.ts";

export const router = new Router();

router.get("/", async (ctx) => {
  let locals: string[] = [];
  const ifaces = Deno.networkInterfaces();
  for (const [_, addrs] of Object.entries(ifaces)) {
    if (Array.isArray(addrs)) {
      for (const addr of addrs) {
        locals.push(addr.address);
      }
    }
  }
  locals = ["127.0.0.1", "::1", ...locals.map((addr) => addr.split("/")[0])];

  const ip = ctx.request.url.hostname.replace(/^::ffff:/, "");

  if (locals.includes(ip) || await isAuthenticated(ctx, ip)) {
    ctx.response.body = await Deno.readTextFile("src/views/index.html");
  } else {
    ctx.response.redirect("/verify?redirectTo=root");
  }
});

router.get("/others", async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const targetIp = url.searchParams.get("ip") as string;

    if (targetIp) {
      if (await isAuthenticated(ctx, targetIp)) {
        ctx.response.body = await Deno.readTextFile("src/views/others.html");
        return;
      }
      ctx.response.redirect(`/verify?redirectTo=others&ip=${targetIp}`);
    } else {
      await Deno.stat("passwd");
      if (await isAuthenticated(ctx, targetIp)) {
        ctx.response.body = await Deno.readTextFile("src/views/others.html");
        return;
      }
      ctx.response.redirect(`/verify?redirectTo=others`);
    }
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      ctx.response.body = await Deno.readTextFile("src/views/others.html");
    } else {
      ctx.response.body = `${e}`;
    }
  }
});

router.get("/verify", async (ctx) => {
  ctx.response.body = await Deno.readTextFile("src/views/verify.html");
});

router.get("/discovery", async (ctx) => {
  ctx.response.body = await Deno.readTextFile("src/views/discovery.html");
});

router.get("/api/browse", async (ctx) => {
  const services = await browseService();
  ctx.response.body = services;
});

router.get("/api/files", async (ctx) => {
  ctx.response.type = "json";
  try {
    const arr: string[] = [];
    for await (const e of Deno.readDir("uploads")) {
      if (e.isFile) arr.push(e.name);
    }
    ctx.response.body = arr;
  } catch {
    ctx.response.body = [];
  }
});

router.delete("/api/files/:name", async (ctx) => {
  const name: string = decodeURIComponent(ctx.params.name);
  const path: string = `./uploads/${name}`;

  try {
    await Deno.remove(path);
    ctx.response.body = "Deleted";
  } catch {
    ctx.response.status = 404;
    ctx.response.body = "File not found";
  }
});

router.post("/api/upload", async (ctx) => {
  const data = await ctx.request.body.formData();
  const file = data.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    ctx.response.status = 400;
    ctx.response.body = "No such file found";
    return;
  }

  await Deno.mkdir("uploads").catch(() => {});
  await Deno.writeFile(`uploads/${file.name}`, await file.bytes());
  ctx.response.body = `${file.name} has uploaded successfully!`;
});

router.post("/api/setPass", async (ctx) => {
  const data = await ctx.request.body.json();
  try {
    if (!data.password) {
      ctx.response.body = `The password has deleted.`;
      try {
        await Deno.remove("passwd");
        return;
      } catch {
        return;
      }
    }
    await Deno.writeTextFile("passwd", data.password);
    ctx.response.body = "Password has been set successfully!";
  } catch {
    ctx.response.body = `Failed to change password`;
  }
});

import { sha256 } from "./utils.ts";

router.get("/api/passwd", async (ctx) => {
  try {
    const passwd = await Deno.readTextFile("passwd");
    const hash = await sha256(passwd);
    ctx.response.body = hash;
  } catch {
    ctx.response.status = 404;
    ctx.response.body = "";
  }
});

router.post("/api/verify", async (ctx) => {
  const data = await ctx.request.body.formData();
  const input = data.get("password") as string;
  let ip = data.get("ip") as string;
  if (ip.trim() == "") ip = ctx.request.url.hostname;
  const redirectTo = data.get("redirectTo");

  const isValid = await verifyPassword(input, ip);

  if (isValid) {
    await setAuthCookie(ctx, ip);
  }

  if (redirectTo === "others") {
    ctx.response.redirect(`/others?ip=${ip}`);
  } else if (redirectTo === "root") {
    ctx.response.redirect("/");
  }
});
