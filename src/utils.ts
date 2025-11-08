export const sha256 = async (file: string): Promise<string> => {
  const fileContent = await Deno.readTextFile(file);
  const encoder = new TextEncoder();
  const data = encoder.encode(fileContent);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  return hashHex;
};
