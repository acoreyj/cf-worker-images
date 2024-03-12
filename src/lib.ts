export const ACCEPT_HEADER = "Accept";
export const mimeTypeAVIF = "image/avif";
export const mimeTypeWEBP = "image/webp";

export const isImageRequest = (req: Request) => {
  const url = new URL(req.url);
  return (
    url.pathname.startsWith("/images") || url.pathname.startsWith("/tus/images")
  );
};

// Env variables defined in wrangler.toml
export interface Env {
  ORIGIN: string;
  ORIGIN_PORT: string;
  CLOUDINARY_CLOUD: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

export const getActualRequest = (env: Env, request: Request) => {
  const urlObj = new URL(request.url);
  urlObj.port = env.ORIGIN_PORT || "";
  urlObj.protocol = "https";
  const url = urlObj.href.replace(urlObj.hostname, env.ORIGIN);
  console.log(`Processing actual ${url}`);
  return new Request(url, request);
};
