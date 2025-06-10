import { AtpAgent } from "@atproto/api";

export interface Env {
  DEFAULT_APP_PWD: string;
}
export const onRequestPost = async ({ request, env }) => {
  if (request.method === "POST"){// && request.headers.get("Origin") === "https://raffle.iohtheprotogen.art" && request.headers.get("Referer") === "https://raffle.iohtheprotogen.art/") {
    const defaultUser = "raffle.iohtheprotogen.art";
    const defaultPassword = env.DEFAULT_APP_PWD;
    let agent = new AtpAgent({service: "https://bsky.social"});
    let response:any = ''
    try {
        await agent.login({identifier: defaultUser, password: defaultPassword});
        response = agent;
    } catch {
        response = null;
    };
    return new Response(JSON.stringify(response));
  } else {
    return new Response("Operation Terminated.")
  };
};
