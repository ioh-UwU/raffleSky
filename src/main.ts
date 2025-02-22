import { AtpAgent } from "@atproto/api";

/** 
 * @todo Replace all console.log()s with actual on-page messages for errors and stuff. 
 */

// const agent = new AtpAgent({
//     service: "https://bsky.social"
// });
// agent.login({
//     identifier: process.env.USER,
//     password: process.env.PASS
// });

function toggleElementVisibility(ids) {
    for (const id of ids) {
        let element = document.getElementById(id);
        element.className = element.className === "hide" ? "show" : "hide";
    }
};

function togglePasswordVisibility() {
    var pwdInput = <HTMLInputElement>document.getElementById("password")
    pwdInput.type = pwdInput.type === "password" ? "text" : "password";
};

const passwordCheckbox = document.getElementById("password");
passwordCheckbox.addEventListener("click", () => togglePasswordVisibility());

const commentCheckbox = document.getElementById("comment");
commentCheckbox.addEventListener("click", () => toggleElementVisibility(['image-checkbox']));

const blockListCheckbox = document.getElementById("block-list-check");
blockListCheckbox.addEventListener("click", () => toggleElementVisibility(['block-list']));

const raffleButton = document.getElementById("run-raffle");
raffleButton.addEventListener("click", () => runRaffle());

(<HTMLInputElement>document.getElementById("identifier")).value = import.meta.env.VITE_USER;
(<HTMLInputElement>document.getElementById("password")).value = import.meta.env.VITE_PASS;


function setRaffleConfig() {
    var raffleConfig = {
        identifier: (<HTMLInputElement>document.getElementById("identifier")).value,
        password: (<HTMLInputElement>document.getElementById("password")).value,
        follow: (<HTMLInputElement>document.getElementById("follow")).value,
        like: (<HTMLInputElement>document.getElementById("like")).value,
        repost: (<HTMLInputElement>document.getElementById("repost")).value,
        comment:(<HTMLInputElement>document.getElementById("comment")).value,
        image: (<HTMLInputElement>document.getElementById("image")).value,
        winners: (<HTMLInputElement>document.getElementById("winners")).value,
        link: (<HTMLInputElement>document.getElementById("link")).value,
        blockList: (<HTMLInputElement>document.getElementById("block-list-check")).value,
        blockedHandles: (<HTMLInputElement>document.getElementById("block-list")).value.split(" ")
    };
    if (raffleConfig.comment === "off") {
        raffleConfig.image = "off";
    }
    if (raffleConfig.blockList === "off") {
        raffleConfig.blockedHandles = [""]
    }
    return raffleConfig;
};

async function signIn(usr:string, pwd:string) {
    let agent = new AtpAgent({
        service: "https://bsky.social"
    });
    await agent.login({
        identifier: usr,
        password: pwd
    });
    return agent
};

async function getPost(agent:AtpAgent, link:string) {
    var splitUri = link.replace("//", "/").split("/");

    var linkType = link.substring(0, 5) === "at://" ? "at" : "https";

    var actorParam = linkType === "https" ? splitUri[-3] : splitUri[1];
    var actor = agent.app.bsky.actor.getProfile({actor: actorParam});
    console.log(actor)
    var did = (await actor).data.did;

    var uri = `at://${did}/app.bsky.feed.post/${splitUri[-1]}`;
    var handle = (await actor).data.handle;
    // postInfo.postUri, postInfo.raffleHadle = uri, handle;
    return {postUri: uri, raffleHandle: handle};
}

async function getFollowing(uri, handle) {
    /**
     * @todo add this
     */
}

async function runRaffle() {
    var raffleConfig = setRaffleConfig();
    var agent = signIn(raffleConfig.identifier, raffleConfig.password);
    var postInfo = await getPost(await agent, raffleConfig.link)
    console.log(postInfo)
};