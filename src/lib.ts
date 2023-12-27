export const ACCEPT_HEADER = "Accept";
export const mimeTypeAVIF = "image/avif";
export const mimeTypeWEBP = "image/webp";

export const isImageRequest = (req: Request) => {
  const url = new URL(req.url);
  return url.pathname.startsWith("/images");
};

// Env variables defined in wrangler.toml
export interface Env {
  ORIGIN: string;
  WORKER_HOST: string | undefined;
  CLOUDINARY_CLOUD: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

export const getOriginalRequestHostReplace = (env: Env, request: Request) => {
  if (env.WORKER_HOST) {
    const url = request.url.replace(env.ORIGIN, env.WORKER_HOST);
    console.log(`Processing original ${url}`);
    return new Request(url, request);
  }

  return request;
};

export const getActualRequest = (env: Env, request: Request) => {
  if (env.WORKER_HOST) {
    const url = request.url.replace(env.WORKER_HOST, env.ORIGIN);
    console.log(`Processing actual ${url}`);
    return new Request(url, request);
  }

  return request;
};
