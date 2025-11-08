import { Context } from "oak";
import { sha256 } from "./utils.ts";

export const verifyPassword = async (input: string): Promise<boolean> => {
    try {
        const password = await Deno.readTextFile("passwd");
        return password === input;
    } catch {
        return false;
    }
};

export const setAuthCookie = async (ctx: Context): Promise<void> => {
    try {
        await ctx.cookies.set("authed", await sha256("passwd"), {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60
        });
    } catch (error) {
        console.error("Failed to set auth cookie:", error);
    }
};

export const isAuthenticated = async (ctx: Context): Promise<boolean> => {
    try {
        await Deno.stat("passwd");

        const cookieToken = await ctx.cookies.get("authed");
        return cookieToken === await sha256("passwd");
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return true;
        } else {
            console.error("Authentication error:", e);
            return false;
        }
    }
};