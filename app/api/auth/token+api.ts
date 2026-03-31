import {
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL,
  JWT_EXPIRATION_TIME,
  JWT_SECRET,
} from "@/constants";
import * as jose from "jose";
export async function POST(request: Request) {
  const body = (await request.formData()) as any;

  const code = body.get("code") as string;
  const platform = (body.get("platform") as string) || "native";
  if (!code) {
    return Response.json({ error: "Missing auth code" }, { status: 400 });
  }

  //  console.log(code);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  const data = await response.json();

  //console.log(data);
  if (!data.id_token) {
    return Response.json(
      { error: "Id token was not reveied" },
      { status: 400 },
    );
  }

  //we now have the id token!!! user information
  const userinfo = jose.decodeJwt(data.id_token) as object;

  const { exp, ...userInfoWithoutExp } = userinfo as any;

  // user id
  const sub = (userinfo as { sub: string }).sub;

  //current timestamp in seconds
  const issuedAt = Math.floor(Date.now() / 100);

  const accessToken = await new jose.SignJWT(userInfoWithoutExp)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .setSubject(sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));

  if (platform === "web") {
    const response = Response.json({
      success: true,
      issuedAt: issuedAt,
      expiresAt: issuedAt + COOKIE_MAX_AGE,
    });

    //set the access token in an HTTP-only cookie
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${accessToken}; Max-Age=${COOKIE_OPTIONS.maxAge};
      path=${COOKIE_OPTIONS.path}; ${COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""} 
      ${COOKIE_OPTIONS.secure ? "Secure;" : ""} SamSite=${COOKIE_OPTIONS.samSites}`,
    );
    return response;
  }
  return Response.json({
    accessToken,
  });
}
