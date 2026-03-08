import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  // v2 logout supports wildcards in Allowed Logout URLs and is more reliable
  logoutStrategy: "v2",
});
