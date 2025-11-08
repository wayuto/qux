import { Context } from "oak";
import { sha256 } from "./utils.ts";

const getPasswordHash = async (ip: string): Promise<string> => {
  try {
    const response = await fetch(`http://${ip}:1145/api/passwd`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Failed to fetch password hash:", error);
    throw error;
  }
};

export const verifyPassword = async (
  input: string,
  ip: string,
): Promise<boolean> => {
  try {
    const storedHash = await getPasswordHash(ip);
    const inputHash = await sha256(input);
    return storedHash === inputHash;
  } catch {
    return false;
  }
};

export const setAuthCookie = async (
  ctx: Context,
  ip: string,
): Promise<void> => {
  try {
    const passwordHash = await getPasswordHash(ip);
    await ctx.cookies.set(`authed_${ip}`, passwordHash, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60,
    });
  } catch (error) {
    console.error("Failed to set auth cookie:", error);
  }
};

export const isAuthenticated = async (
  ctx: Context,
  ip: string,
): Promise<boolean> => {
  try {
    const passwordHash = await getPasswordHash(ip);
    const cookieToken = await ctx.cookies.get(`authed_${ip}`);
    return cookieToken === passwordHash;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
};
