import { readdir } from "fs/promises";
import { join } from "path";

let gifsPromise: Promise<string[]> | null = null;

/** Lists `public/gifs` once per process instead of on every request. */
export function getLoadingGifs(): Promise<string[]> {
  if (!gifsPromise) {
    gifsPromise = readdir(join(process.cwd(), "public", "gifs"))
      .then((files) => files.filter((file) => /\.gif$/i.test(file)).map((file) => `/gifs/${file}`))
      .catch(() => {
        gifsPromise = null;
        return [];
      });
  }
  return gifsPromise;
}

export async function pickLoadingGif(): Promise<string | null> {
  const gifs = await getLoadingGifs();
  return gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)] : null;
}
