export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const assetResponse = await env.ASSETS.fetch(request);

    if (shouldServeSpaFallback(assetResponse, request)) {
      const url = new URL(request.url);
      url.pathname = "/index.html";
      return env.ASSETS.fetch(
        new Request(url.toString(), {
          method: request.method,
          headers: new Headers(request.headers),
        }),
      );
    }

    return assetResponse;
  },
};

type Env = {
  ASSETS: AssetFetcher;
};

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

function shouldServeSpaFallback(response: Response, request: Request): boolean {
  return (
    response.status === 404 &&
    request.method === "GET" &&
    acceptsHtml(request)
  );
}

function acceptsHtml(request: Request): boolean {
  const acceptHeader = request.headers.get("accept") ?? "";
  return acceptHeader.includes("text/html");
}
