import { AtpAgent } from "@atproto/api";
import { profile } from "console";

var rerollCandidates = [];

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
numWinnersInput.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
        numWinnersInput.value = "1";
    };
});
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
const hostReplyList = <HTMLInputElement>document.getElementById("reply-text-list");
hostReplyInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        createSpecificReplyTag();
    } else if (event.key === "Escape") {
        hostReplyList.value = "";
    };
});
const hostReplyAddButton = <HTMLInputElement>document.getElementById("add-reply-button");
hostReplyAddButton.addEventListener("click", () => {createSpecificReplyTag()});
function createSpecificReplyTag() {
    if (hostReplyInput.value.trim() !== "") {
        let newReply = document.createElement("button");
        newReply.textContent = hostReplyInput.value.trim();
        hostReplyList.appendChild(newReply);
        newReply.addEventListener("click", () => {newReply.remove()});
    };
    hostReplyInput.value = "";
};
function getSpecificReplies() {
    let output = []
    for (let hostSpecificReply of hostReplyList.children) {
        output.push(hostSpecificReply.textContent);
    };
    return output.length > 0 ? output : [""];
};
const replyCaseSensitiveCheckbox = <HTMLInputElement>document.getElementById("case-sensitive");
const replyExactMatchCheckbox = <HTMLInputElement>document.getElementById("exact-match");

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

const winnerSection = document.getElementById("winner-section");
const clearWinnersButton = document.getElementById("clear-winners");
clearWinnersButton.addEventListener("click", () => clearWinners());
const rerollButton = document.getElementById("reroll");
rerollButton.addEventListener("click", () => rerollWinners());
const displayWinners = document.getElementById("winner-grid");


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
            specificReplies: getSpecificReplies(),
            caseSensitive: replyCaseSensitiveCheckbox.checked,
            exact: replyExactMatchCheckbox.checked
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
    usr = usr[0] === "@" ? usr.substring(1) : usr;
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
    while (enumCursor !== undefined) {
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
    while (enumCursor !== undefined) {
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
    while (enumCursor !== undefined) {
        let returnData = (await agent.getFollowers({actor: hostActor, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.followers);
    };
    return output;
};

async function getLikes(agent:AtpAgent, postUri:string) {
    let likes = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.getLikes({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        likes = likes.concat(returnData.likes);
    };
    let output = [];
    for (let like of likes) {
        output.push(like["actor"])
    };
    return output;
};

async function getReposts(agent:AtpAgent, postUri:string) {
    let output = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
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
            if (embedTypes["any"] && embedData !== undefined){
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
function commentReplyFilter(comments:Object, hostHandle:string, replyConfig:Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        let replies = comment["replies"];
        if (replies.length > 0) {
            for (let reply of replies) {
                let handle = reply["post"]["author"]["handle"];
                let contents = reply["post"]["record"]["text"];
                if (handle === hostHandle) {
                    if (replyConfig["specific"] && !(replyConfig["specificReplies"][0] === "")) {
                        let validReplies = replyConfig["specificReplies"]
                        let isValidReply = false;
                        for (let validReply of validReplies) {
                            if (!replyConfig["caseSensitive"]) {
                                validReply = validReply.toLocaleLowerCase();
                                contents = contents.toLocaleLowerCase();
                            };
                            isValidReply = replyConfig["exact"] ? isValidReply = contents === validReply : contents.includes(validReply); 
                            if (isValidReply) {break};
                        };
                        if (isValidReply) {
                            output.push(comment);
                            continue;
                        };
                    } else {
                        output.push(comment);
                        continue;
                    };
                };
            };
        };
    };
    return output;
};
function getCommentActors(comments:Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        output.push(comment["post"]["author"]);
    };
    return output;
};

function getCandidates(candidateGroups:Array<Array<Object>>, denyList:Array<string>) {
    let prevBuffer = [];
    let output = [];
    let firstGroup = true;
    for (let group of candidateGroups) {
        if (group != undefined) {
            if (firstGroup) {
                firstGroup = false;
                prevBuffer = group;
                continue;
            };
            for (let [_, candidate] of Object.entries(group)) {
                if (!denyList.includes(candidate["handle"])) {
                    for (let prev of prevBuffer) {
                        if (candidate["handle"] === prev["handle"]) {
                            output.push(candidate);
                            break;
                        };
                    };
                };
            };
            prevBuffer = output;
            output = [];
        };
    };
    output = prevBuffer;
    return output;
};

function shuffleArray(array:Array<any>) {
    let output = [];
    for (let iRange = array.length; iRange > 0; iRange--) {
        let i = Math.floor(Math.random() * iRange)
        output.push(array.splice(i, 1)[0]);
    };
    return output;
};
function pickWinners(candidates:Array<Object>, numWinners:number) {
    candidates = shuffleArray(candidates);
    
    let winners = [];
    for (let roll = 0; roll < numWinners; roll++) {
        let winnerIndex = Math.floor(Math.random() * candidates.length)
        winners.push(candidates.splice(winnerIndex, 1)[0]);
    };
    winnerSection.className = "show";
    displayWinners.className = "show";
    return [winners, candidates];
};

function addWinner(winner:Object) {
    let handle = winner["handle"];
    let avatar = winner["avatar"];
    let profile = `https://bsky.app/profile/${handle}`;
    let name = winner["displayName"] != "" ? winner["displayName"] : handle;

    let winnerSpan = document.createElement("span");
    winnerSpan.id = handle;
    winnerSpan.className = "winner";
    
    let pfp = document.createElement("img");
    pfp.src = avatar;
    pfp.alt = `Avatar for Bluesky user ${handle}`
    pfp.className = "winner-pfp";
    winnerSpan.appendChild(pfp);

    let infoDiv = document.createElement("div");
    infoDiv.id = `${handle}-info`;
    infoDiv.className = "winner-info";
    winnerSpan.appendChild(infoDiv);

    let displayName = document.createElement("p");
    displayName.innerText = name;
    displayName.className = "winner-display-name";
    infoDiv.appendChild(displayName);

    let displayHandle = document.createElement("p");
    displayHandle.innerText = handle;
    displayHandle.className = "winner-handle";
    infoDiv.appendChild(displayHandle);

    let profileLink = document.createElement("a");
    profileLink.href = profile;
    profileLink.innerText = "Link to Profile";
    profileLink.className = "winner-profile";
    infoDiv.appendChild(profileLink);

    winnerSpan.addEventListener("click", () => toggleReroll(infoDiv.id))

    return winnerSpan
};

function clearWinners() {
    while (displayWinners.children.length > 0) {
        displayWinners.children[0].remove();
    };
};

function toggleReroll(targetId:string) {
    let selection = document.getElementById(targetId);
    console.log(selection.className)
    if (selection.className === "winner-info") {
        selection.className = "winner-info-reroll-select";
    } else if (selection.className === "winner-info-reroll-select") {
        selection.className = "winner-info";
    } else if (selection.className === "winner-info-rerolled") {
        selection.className = "winner-info-reroll-select-again";
    } else if ((selection.className === "winner-info-reroll-select-again")) {
        selection.className = "winner-info-rerolled"
    };
};

function rerollWinners() {
    for (let winner of displayWinners.children) {
        for (let child of winner.children) {
            if (["winner-info-reroll-select", "winner-info-reroll-select-again"].includes(child.className)) {
                if (rerollCandidates.length > 0) { 
                    let newWinnerData = pickWinners(rerollCandidates, 1);
                    rerollCandidates = newWinnerData[1];
                    let newWinner = addWinner(newWinnerData[0][0]);
                    displayWinners.replaceChild(newWinner, winner);
                    document.getElementById(`${newWinner.id}-info`).className = "winner-info-rerolled";
                };
            };
        };
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
            if (Object.values(raffleConfig.embedTypes).find((a) => {return a === true})) {
                comments = commentEmbedFilter(comments, raffleConfig.embedTypes);
            };
            if (raffleConfig.hostReply.enabled) {
                comments = commentReplyFilter(
                    comments,
                    postInfo.hostHandle,
                    raffleConfig.hostReply
                );
            };
            comments = getCommentActors(comments);
        };
        let candidates = getCandidates([follows, likes, reposts, comments], raffleConfig.blockedHandles);

        if (candidates.length > 0) {
            var winnerData = candidates.length > raffleConfig.winners ? pickWinners(candidates, raffleConfig.winners) : candidates;
            var winners = winnerData[0];
            rerollCandidates = winnerData[1];
        };
        clearWinners();
        for (let winner of winners) {
            displayWinners.appendChild(addWinner(winner));
        };
    };

    // var test = document.createElement("img");
    // test.src = postInfo.hostAvatar;
    // test.style.width="256px"
    // document.body.insertAdjacentElement("afterend", test)

};
