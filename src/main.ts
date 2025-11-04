import { createHash } from "node:crypto";
import { Application, Router, send } from "oak";

const app = new Application();
const router = new Router();


const sha256 = async (file: string) => {
    const c = await Deno.readTextFile(file);
    const hash = createHash("sha256").update(c).digest("hex");
    return hash;
}

router.get("/", async (ctx) => {
    let locals: string[] = [];
    const ifaces = Deno.networkInterfaces();
    for (const [_, addrs] of Object.entries(ifaces)) {
        if (Array.isArray(addrs))
            for (const addr of addrs) {
                locals.push(addr);
            }
    }
    locals = ["127.0.0.1", "::1", ...locals];

    const ip = ctx.request.ip.replace(/^::ffff:/, "");
    const response = locals.includes(ip) ? "src/views/index.html" : "src/views/guest.html";
    ctx.response.body = await Deno.readFile(response);
})
router.get("/others", async (ctx) => {
    try {
        await Deno.stat("passwd");
        if (await ctx.cookies.get("authed") == await sha256("passwd")) {
            ctx.response.body = await Deno.readTextFile("src/views/others.html");
            return;
        }
        ctx.response.body = await Deno.readTextFile("src/views/verify.html")
    } catch (e) {
        if (e instanceof Deno.errors.NotFound){
            ctx.response.body = await Deno.readTextFile("src/views/others.html");
        }
        else ctx.response.body = `${e}`;
    }
})

router.get("/api/files", async (ctx) => {
    ctx.response.type = "json";    
    try {
        const arr: string[] = [];
        for await (const e of Deno.readDir("uploads")) if (e.isFile) arr.push(e.name);
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

    await Deno.mkdir("uploads").catch(() => { });
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
})

router.post("/api/verify", async (ctx) => {
    const password = await Deno.readTextFile("passwd");
    const data = await ctx.request.body.formData();
    const input = data.get("password");
    const ip = data.get("ip");
    if (password == input) {
        await ctx.cookies.set("authed", await sha256("passwd"));
        ctx.response.redirect(`/others?ip=${ip}`);
    } else {
        ctx.response.redirect(`/others?ip=${ip}`);
    }
})

app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/css") || ctx.request.url.pathname.startsWith("/js"))
        await send(ctx, ctx.request.url.pathname, { root: "src/views" })
    else if (ctx.request.url.pathname.startsWith("/uploads"))
        return await send(ctx, ctx.request.url.pathname, { root: "." });
    else
        await next()
})

app.use(async (ctx, next) => {
    const start = performance.now();
    await next();
    const ms = (performance.now() - start).toFixed(2);
    console.log(
        `[${new Date().toISOString()}] ${ctx.request.method} ${ctx.request.url} -> ${ctx.response.status} (${ms}ms)`
    );
});

app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200;
        return;
    }

    await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Running on 0.0.0.0:1145")
await app.listen({port: 1145})