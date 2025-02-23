import { AtpAgent } from "@atproto/api";

/** 
 * @todo Replace all console.log()s with actual on-page messages for errors and stuff. 
 */

function toggleElementVisibility(ids:string[]) {
    for (const id of ids) {
        let element = document.getElementById(id);
        element.className = element.className === "hide" ? "show" : "hide";
    };
};

function togglePasswordVisibility() {
    var pwdInput = <HTMLInputElement>document.getElementById("password");
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
(<HTMLInputElement>document.getElementById("link")).value = import.meta.env.VITE_TEST_LINK;

function setRaffleConfig() {
    var raffleConfig = {
        identifier: (<HTMLInputElement>document.getElementById("identifier")).value,
        password: (<HTMLInputElement>document.getElementById("password")).value,
        follow: (<HTMLInputElement>document.getElementById("follow")).checked,
        like: (<HTMLInputElement>document.getElementById("like")).checked,
        repost: (<HTMLInputElement>document.getElementById("repost")).checked,
        comment:(<HTMLInputElement>document.getElementById("comment")).checked,
        image: (<HTMLInputElement>document.getElementById("image")).checked,
        winners: (<HTMLInputElement>document.getElementById("winners")).valueAsNumber,
        link: (<HTMLInputElement>document.getElementById("link")).value,
        blockList: (<HTMLInputElement>document.getElementById("block-list-check")).checked,
        blockedHandles: (<HTMLInputElement>document.getElementById("block-list")).value.split(" ")
    };
    if (!raffleConfig.comment) {
        raffleConfig.image = false;
    };
    if (!raffleConfig.blockList) {
        raffleConfig.blockedHandles = []
    };
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
    return agent;
};

async function getHostInfo(agent:AtpAgent, link:string) {
    var splitUri = link.replace("//", "/").split("/");
    var linkType = link.substring(0, 5) === "at://" ? "at" : "https";
    var actorParam = linkType === "https" ? splitUri[3] : splitUri[1];

    var profile = await agent.app.bsky.actor.getProfile({actor: actorParam});

    var did = profile.data.did;
    var uri = `at://${did}/app.bsky.feed.post/${splitUri[5]}`;

    var handle = profile.data.handle;
    var avatar = profile.data.avatar;

    return {postUri: uri, hostHandle: handle, hostAvatar: avatar};
};

async function getFollowing(agent, uri, handle) {
    /**
     * @todo add this
     */
};

async function getLikes(agent, uri, handle) {
    /**
     * @todo add this
     */
};

async function runRaffle() {
    var raffleConfig = setRaffleConfig();
    var agent = await signIn(raffleConfig.identifier, raffleConfig.password);
    var postInfo = await getHostInfo(agent, raffleConfig.link);
    // Ensure the host of the raffle doesn't win.
    if (!raffleConfig.blockedHandles.includes(postInfo.hostHandle)) {
        raffleConfig.blockedHandles.push(postInfo.hostHandle);
    };

    var test = document.createElement("img");
    test.src = postInfo.hostAvatar;
    test.style.width="256px"
    document.body.insertAdjacentElement("afterend", test)

};
