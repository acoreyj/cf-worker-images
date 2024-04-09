import { getImageOriginUrl } from "./image";
import { Env, isImageRequest, getActualRequest } from "./lib";

/**
 * Our main entry point
 */
export default {
  async fetch(
    origRequest: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    console.log(origRequest.url);
    const request = getActualRequest(env, origRequest);

    // If its a request for an image, and its NOT a request from Cloudinary for a source iamge
    // Then we want to handle it and return an optimized images from Cloundary
    if (isImageRequest(request)) {
      const url = await getImageOriginUrl(env, request);
      let imageRequest = new Request(url, request);
      let cloudinaryResponse = await fetch(imageRequest, {
        cf: {
          cacheEverything: true,
          cacheTtlByStatus: {
            "200-299": 604800,
            "401-404": 1,
            "500-599": 0,
          },
        },
      });
      // if (cloudinaryResponse.status === 200) {
      return cloudinaryResponse;
      // } else if (url.includes("f_avif")) {
      //   const urlObj = new URL(request.url);
      //   urlObj.searchParams.set("f", "webp");
      //   imageRequest = new Request(urlObj.toString(), request);
      //   const url = await getImageOriginUrl(env, imageRequest);
      //   imageRequest = new Request(url.replace("f_avif", "f_webp"), request);
      //   cloudinaryResponse = await fetch(imageRequest);
      // }
      // return cloudinaryResponse;
    } else {
      // Ask Cloudflare to fetch the request from the origin
      return fetch(request);
    }
  },
};
