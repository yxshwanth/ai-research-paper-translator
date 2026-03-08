import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const isAuth0Configured =
  process.env.AUTH0_SECRET &&
  process.env.AUTH0_DOMAIN &&
  process.env.AUTH0_CLIENT_ID &&
  (process.env.AUTH0_CLIENT_SECRET || process.env.AUTH0_CLIENT_ASSERTION_SIGNING_KEY);

/** Re-body the response so the returned value has a fresh, unread body (avoids "disturbed or locked" in Next 16). */
async function rebodyResponse(res: Response): Promise<NextResponse> {
  const status = res.status;
  const headers = new Headers(res.headers);

  // Redirect: no body, return redirect response
  if (status >= 300 && status < 400) {
    const location = headers.get("location");
    if (location) return NextResponse.redirect(location, status as 301 | 302 | 303 | 307 | 308);
  }

  if (!res.body) {
    return new NextResponse(null, { status, headers });
  }

  // Read body once and build a new response with fresh body so nothing is disturbed/locked
  const contentType = headers.get("content-type") ?? "";
  const body =
    contentType.includes("application/json")
      ? JSON.stringify(await res.json())
      : await res.text();
  return new NextResponse(body, { status, headers });
}

export async function proxy(request: NextRequest) {
  if (!isAuth0Configured) {
    return NextResponse.next();
  }
  try {
    const res = await auth0.middleware(request);
    return await rebodyResponse(res);
  } catch (err) {
    // Auth0 SDK can throw in Edge (e.g. undefined pathname/domain). Fallback so app still loads.
    console.error("[Auth0 proxy]", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
