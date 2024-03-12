import { Env } from "./lib";

type ImageFormat = "jpg" | "png" | "webp" | "gif" | "avif";

const PARAM_FORMAT = "f";
const PARAM_POSTER = "poster";
const PARAM_WIDTH = "w";
const PARAMS = [PARAM_FORMAT, PARAM_POSTER, PARAM_WIDTH] as const;

const getImageFormat = (request: Request): ImageFormat | undefined => {
  const url = new URL(request.url);
  const filename = url.pathname.toLowerCase();

  if (filename.endsWith("jpg") || filename.endsWith("jpeg")) {
    return "jpg";
  }
  if (filename.endsWith("png")) {
    return "png";
  }
  if (filename.endsWith("webp")) {
    return "webp";
  }
  if (filename.endsWith("avif")) {
    return "avif";
  }
  if (filename.endsWith("gif")) {
    return "gif";
  }

  return undefined;
};

const getImageOutputOptions = (
  request: Request,
  format: ImageFormat | undefined
): string[] => {
  // Handle a specific format request, for example converting an animated GIF to a WEBM video
  // with a query param like: /image/12345.gif?f=webm
  const url = new URL(request.url);
  const queryParamFormat = url.searchParams.get(PARAM_FORMAT)
    ? `f_${url.searchParams.get(PARAM_FORMAT)}`
    : undefined;

  const queryParamWidth = url.searchParams.get(PARAM_WIDTH)
    ? `w_${url.searchParams.get(PARAM_WIDTH)}`
    : undefined;

  // Generate a poster (image) from a video, with a query param like: /image/12345.mp4?poster=1
  const isPoster = url.searchParams.get(PARAM_POSTER);
  if (isPoster) {
    // pg_0 tells Cloudinary to use the first frame of the video
    // try to deliver the poster in the most optimal format
    return ["pg_0", queryParamFormat || "f_avif"];
  }

  const options: string[] = [];

  if (format === "gif") {
    // we handle animated GIFS differently for now, try to aggressively optimize them for quality
    options.push("fl_lossy");
    options.push("q_50");
  } else {
    // scale images down (but never up)
    options.push("c_limit");
    options.push(queryParamWidth || "w_1280");
    // Let Cloudinary optimize the image for quality
    options.push("q_auto:good");
    // if we know what format it is (and its not GIF) then we can optimize it
    options.push(
      queryParamFormat ? queryParamFormat : format ? `f_${format}` : "f_avif"
    );
  }

  return options;
};

async function hashString(inputString: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return btoa(hashHex);
}
export const getImageOriginUrl = async (env: Env, request: Request) => {
  const apiSecret = env.CLOUDINARY_API_SECRET;
  // const apiKey = env.CLOUDINARY_API_KEY;
  const cloud = env.CLOUDINARY_CLOUD;
  // Check if the client suppports AVIF or WebP
  // Determine the format of the original image
  const origFormat = getImageFormat(request);
  // Do the actual work of choosing the optimized configuration for Cloudinary for this image
  const options = getImageOutputOptions(request, origFormat);
  console.log("Using cloudinary options", options);

  // Remove the query string parameters that are meant for us (that we checked for already)
  const parsed = new URL(request.url);
  PARAMS.forEach((p) => parsed.searchParams.delete(p));

  const toHash = `${options.join(",")}/${parsed.toString()}.${apiSecret}`;
  const hash = await hashString(toHash);
  const urlSignature = `s--${hash.substring(0, 8)}--`;
  const url = `https://res.cloudinary.com/${cloud}/image/fetch/${urlSignature}/${options.join(
    ","
  )}/${parsed.toString()}`;
  console.log("Using cloudinary url", url);
  return url;
};
