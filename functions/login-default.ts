import { AtpAgent } from "@atproto/api";

export interface Env {
  DEFAULT_APP_PWD: string;
}
export const onRequestPost = async ({ request, env }) => {
  if (request.method === "POST") {
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
    return new Response(JSON.stringify(response), {headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" // debug
    }});
  } else {
    return new Response("Operation Terminated.")
  };
};
