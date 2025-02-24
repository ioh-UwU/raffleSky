import { AtpAgent } from "@atproto/api";

/** 
 * @todo Replace all console.log()s with actual on-page messages for errors and stuff. 
 */

// Page functionality
function toggleElementVisibility(ids:string[]) {
    for (let id of ids) {
        let element = document.getElementById(id);
        element.className = element.className === "hide" ? "show" : "hide";
    };
};

function togglePasswordVisibility() {
    let pwdInput = <HTMLInputElement>document.getElementById("password");
    pwdInput.type = pwdInput.type === "password" ? "text" : "password";
};

// Initialize page elements
const numWinnersInput = <HTMLInputElement>document.getElementById("winners");
const followCheckbox = <HTMLInputElement>document.getElementById("follow");
const likeCheckbox = <HTMLInputElement>document.getElementById("like");
const repostCheckbox = <HTMLInputElement>document.getElementById("repost");

const commentCheckbox = <HTMLInputElement>document.getElementById("comment");
commentCheckbox.checked = false;
commentCheckbox.addEventListener("click", () => toggleElementVisibility(["embed-config", "host-reply-div"]));

const imageEmbedCheckbox = <HTMLInputElement>document.getElementById("image-embed");
imageEmbedCheckbox.addEventListener("click", () => {
    if (imageEmbedCheckbox.checked) {
        anyEmbedCheckbox.checked = false;
    };
});
const videoEmbedCheckbox = <HTMLInputElement>document.getElementById("video-embed");
videoEmbedCheckbox.addEventListener("click", () => {
    if (videoEmbedCheckbox.checked) {
        anyEmbedCheckbox.checked = false;
    };
});
const gifEmbedCheckbox = <HTMLInputElement>document.getElementById("gif-embed");
gifEmbedCheckbox.addEventListener("click", () => {
    if (gifEmbedCheckbox.checked) {
        anyEmbedCheckbox.checked = false;
    };
});
const anyEmbedCheckbox = <HTMLInputElement>document.getElementById("any-embed");
anyEmbedCheckbox.addEventListener("click", () => {
    if (anyEmbedCheckbox.checked) { 
        imageEmbedCheckbox.checked = false;
        videoEmbedCheckbox.checked = false;
        gifEmbedCheckbox.checked = false;
    };
});
const hostReplyCheckbox = <HTMLInputElement>document.getElementById("host-reply");
hostReplyCheckbox.checked = false;
hostReplyCheckbox.addEventListener("click", () => {toggleElementVisibility(["specific-reply-div"])});

const hostReplySpecificCheckbox = <HTMLInputElement>document.getElementById("specific-reply");
hostReplySpecificCheckbox.checked = false;
hostReplySpecificCheckbox.addEventListener("click", () => {toggleElementVisibility(["specific-reply-text"])})

const hostReplyInput = <HTMLInputElement>document.getElementById("reply-text");

const userFilterCheckbox = <HTMLInputElement>document.getElementById("user-filter-check");
userFilterCheckbox.checked = false;
userFilterCheckbox.addEventListener("click", () => toggleElementVisibility(["user-filter"]));

const hostBlockCheckbox = <HTMLInputElement>document.getElementById("host-blocks");
hostBlockCheckbox.checked = true;
const hostMuteCheckbox = <HTMLInputElement>document.getElementById("host-mutes");
hostMuteCheckbox.checked = true;
const blockedUserInput = <HTMLInputElement>document.getElementById("filtered-users");

const usernameInput = <HTMLInputElement>document.getElementById("identifier");

const passwordInput = <HTMLInputElement>document.getElementById("password");
const passwordCheckbox = <HTMLInputElement>document.getElementById("password-checkbox");
passwordCheckbox.checked = false;
passwordCheckbox.addEventListener("click", () => togglePasswordVisibility());

const linkInput = <HTMLInputElement>document.getElementById("link");

const raffleButton = document.getElementById("run-raffle");
raffleButton.addEventListener("click", () => runRaffle());


// Testing parameters
usernameInput.value = import.meta.env.VITE_USER;
passwordInput.value = import.meta.env.VITE_PASS;
linkInput.value = import.meta.env.VITE_TEST_LINK;


// Config
function setRaffleConfig() {
    let raffleConfig = {
        identifier: usernameInput.value,
        password: passwordInput.value,
        link: linkInput.value,
        winners: numWinnersInput.valueAsNumber,

        follow: followCheckbox.checked,
        like: likeCheckbox.checked,
        repost: repostCheckbox.checked,
        comment: commentCheckbox.checked,
        embedTypes: {
            image: imageEmbedCheckbox.checked,
            video: videoEmbedCheckbox.checked,
            gif: gifEmbedCheckbox.checked,
            any: anyEmbedCheckbox.checked
        },
        hostReply: {
            enabled: hostReplyCheckbox.checked,
            specific: hostReplySpecificCheckbox.checked,
            text: hostReplyInput.value
        },

        blockList: userFilterCheckbox.checked,
        hostBlocks: hostBlockCheckbox.checked,
        hostMutes: hostMuteCheckbox.checked,
        blockedHandles: blockedUserInput.value.split(" ")
    };
    return raffleConfig;
};


// API calls
async function signIn(usr:string, pwd:string) {
    let agent = new AtpAgent({service: "https://bsky.social"});
    await agent.login({identifier: usr, password: pwd});
    return agent;
};

// Raffle data requests
async function getHostInfo(agent:AtpAgent, link:string) {
    let splitUri = link.replace("//", "/").split("/");
    let linkType = link.substring(0, 5) === "at://" ? "at" : "https";
    let actorParam = linkType === "https" ? splitUri[3] : splitUri[1];

    let profile = await agent.app.bsky.actor.getProfile({actor: actorParam});
    let did = profile.data.did;

    let uri = `at://${did}/app.bsky.feed.post/${splitUri[5]}`;
    let handle = profile.data.handle;
    let avatar = profile.data.avatar;
    let displayName = profile.data.displayName;
    return {
        postUri: uri,
        hostHandle: handle, 
        hostAvatar: avatar, 
        hostDisplayName: displayName
    };
};

async function getBlocks(agent:AtpAgent) {
    let cumulativeBlocks = [];
    let enumCursor = "";
    while (enumCursor != undefined) {
        let returnData = (await agent.app.bsky.graph.getBlocks({limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        cumulativeBlocks = cumulativeBlocks.concat(returnData.blocks);
    };

    let output = [];
    for (let block of cumulativeBlocks) {
        output.push(block["handle"]);
    };
    return output;
};

async function getMutes(agent:AtpAgent) {
    let cumulativeMutes = [];

    let enumCursor = "";
    while (enumCursor != undefined) {
        let returnData = (await agent.app.bsky.graph.getMutes({limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        cumulativeMutes = cumulativeMutes.concat(returnData.mutes);
    };

    let output = [];
    for (let mute of cumulativeMutes) {
        output.push(mute["handle"])
    };
    return output;
};

async function getFollows(agent:AtpAgent, hostActor:string) {
    let output = [];

    let enumCursor = "";
    while (enumCursor != undefined) {
        let returnData = (await agent.getFollowers({actor: hostActor, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.followers);
    };
    return output;
};

async function getLikes(agent:AtpAgent, postUri:string) {
    let output = [];

    let enumCursor = "";
    while (enumCursor != undefined) {
        let returnData = (await agent.getLikes({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.likes);
    };
    return output;
};

async function getReposts(agent:AtpAgent, postUri:string) {
    let output = [];

    let enumCursor = "";
    while (enumCursor != undefined) {
        let returnData = (await agent.getRepostedBy({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.repostedBy);
    };
    return output;
};

async function getComments(agent:AtpAgent, postUri:string) {
    return (await agent.getPostThread({uri: postUri, depth: 2})).data.thread["replies"];
};

function commentEmbedFilter(comments:Object, embedTypes:Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        try { // Check if embed exists.
            let embedData = comment["post"]["embed"];
            if (embedTypes["any"] && embedData != undefined){
                output.push(comment);
                continue; 
            };
            try { // Check embed for image.
                if (embedTypes["image"] && embedData["$type"].includes("image")) {
                    output.push(comment);
                    continue; 
                }
            } catch {};
            try { // Check embed for video.
                if (embedTypes["video"] && embedData["$type"].includes("video")) {
                    output.push(comment);
                    continue; 
                }
            } catch {};
            try { // Check embed for GIF.
                if (embedTypes["gif"] && embedData["external"]["uri"].includes("://media.tenor.com/") && embedData["external"]["uri"].includes(".gif")) {
                    output.push(comment);
                    continue; 
                }
            } catch {};
        } catch {};
    };
    return output;
};

function commentReplyFilter(comments:Object, hostHadle:string, requireSpecificReply:boolean, specificReplyContents:string) {
    for (let [_, comment] of Object.entries(comments)) {

    };
};

// Raffle procedure
async function runRaffle() {
    let raffleConfig = setRaffleConfig();
    let agent = await signIn(raffleConfig.identifier, raffleConfig.password);
    let postInfo = await getHostInfo(agent, raffleConfig.link);

    // Construct the user filter list.
    if (raffleConfig.hostBlocks) {
        raffleConfig.blockedHandles = raffleConfig.blockedHandles.concat(await getBlocks(agent));
    };
    if (raffleConfig.hostMutes) {
        raffleConfig.blockedHandles = raffleConfig.blockedHandles.concat(await getMutes(agent));
    };
    // Ensure raffle host can't win.
    if (!raffleConfig.blockedHandles.includes(postInfo.hostHandle)) {
        raffleConfig.blockedHandles.push(postInfo.hostHandle);
    };
    raffleConfig.blockedHandles = raffleConfig.blockedHandles.filter((a) => {return a != ""});

    // To prevent fraud, raffles may only be run on your own posts. 
    if (raffleConfig.identifier === postInfo.hostHandle) {
        if (raffleConfig.follow) {
            var follows = await getFollows(agent, postInfo.hostHandle);
        };
        if (raffleConfig.like) {
            var likes = await getLikes(agent, postInfo.postUri);
        };
        if (raffleConfig.repost) {
            var reposts = await getReposts(agent, postInfo.postUri);
        };
        if (raffleConfig.comment) {
            var comments = await getComments(agent, postInfo.postUri);
            comments = commentEmbedFilter(comments, raffleConfig.embedTypes)
            if (raffleConfig.hostReply.enabled) {
                comments = commentReplyFilter(
                    comments,
                    postInfo.hostHandle,
                    raffleConfig.hostReply.specific,
                    raffleConfig.hostReply.text
                );
            };
        };
    };
    console.log(comments)
    // var test = document.createElement("img");
    // test.src = postInfo.hostAvatar;
    // test.style.width="256px"
    // document.body.insertAdjacentElement("afterend", test)

};
