import { BASE_URL, TOKEN_KEY_NAME } from "@/constants";
import { tokenCahe } from "@/utils/cache";
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import * as webBrowser from "expo-web-browser";
import * as jose from "jose";
import * as React from "react";
import { Platform } from "react-native";

webBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  provider?: string;
  exp?: number;
  cookieExpiration?: number;
};
const AuthContext = React.createContext({
  user: null,
  signIn: () => {},
  signOut: () => {},
  fetchwithAuth: async (url: string, options?: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const [accessToken, setAccessToken] = React.useState();
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const isWeb = Platform.OS === "web";

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  const handleResponse = async () => {
    if (response?.type === "success") {
      const { code } = response.params;

      try {
        //exchange the code
        setIsLoading(true);
        const formData = new FormData();
        formData.append("code", code);

        if (isWeb) {
          formData.append("platform", "web");
        }

        //Get the code verifier from the request object
        //This is the same verifier that was used to generate the code challenge
        if (request?.codeVerifier) {
          formData.append("code_verifier", request.codeVerifier);
        } else {
          console.warn("No code verifier found in request object");
        }

        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: "POST",
          body: formData,
          credentials: isWeb ? "include" : "same-origin",
        });
        if (isWeb) {
          //For web: The server sets the tokens in HTTP-only cookies
          //We just need to get the user data from the response
          const userData = await tokenResponse.json();

          if (userData.success) {
            //Fetch the session to get user data
            //This ensures we have the most up-to-date user information
            const sessionResponse = await fetch(
              `${BASE_URL}/api/auth/session`,
              {
                method: "GET",
                credentials: "include",
              },
            );
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setUser(sessionData as AuthUser);
            }
          }
        } else {
          const token = await tokenResponse.json();
          const accessToken = token.accessToken;
          if (!accessToken) {
            console.log("no access token");
            return;
          }
          setAccessToken(accessToken);
          //save token to local storage
          tokenCahe?.saveToken(TOKEN_KEY_NAME, accessToken);
          console.log(accessToken);
          //get the user info
          const decoded = jose.decodeJwt(accessToken);
          setUser(decoded as AuthUser);
        }
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
      console.log(code);
    } else if (response?.type === "error") {
      setError(response.error as AuthError);
    }
  };
  const signIn = async () => {
    try {
      if (!request) {
        console.log("no request");
        return;
      }
      await promptAsync();
    } catch (e) {
      console.log(e);
    }
  };

  const signOut = async () => {};

  const fetchwithAuth = async (url: string, options?: RequestInit) => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        fetchwithAuth,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be use within the AuthProvider");
  }
  return context;
};
