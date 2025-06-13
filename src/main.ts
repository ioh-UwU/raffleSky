import { AtpAgent } from "@atproto/api";

// Page functionality
function toggleElementVisibility(ids:string[]) {
    for (let id of ids) {
        let element = document.getElementById(id);
        element.className = element.className === "hide" ? "show" : "hide";
    }
}
let timerIDs = [];
function fadeInElement(element:HTMLElement, msDuration:number) {
    element.className = "show";
    const step = 0.05; // 20 times
    const delay = msDuration / 20;
    let opacity = 0;
    let timer = setInterval(() => {
        opacity += step;
        if (opacity > 1) {
            opacity = 1;
            window.clearInterval(timer);
        }
        element.style.opacity = opacity.toPrecision(2);
    }, delay);
    timerIDs.push(timer);
}
function fadeOutElement(element:HTMLElement, msDuration:number) {
    const step = 0.05; // 20 times
    const delay = msDuration / 20;
    let opacity = 1;
    let timer = setInterval(() => {
        opacity -= step;
        if (opacity < 0) {
            opacity = 0;
            window.clearInterval(timer);
        }
        element.style.opacity = opacity.toPrecision(2);
    }, delay);
    timerIDs.push(timer);
}

function createFilterTag(inputText:HTMLInputElement, outputList:HTMLElement) {
    let newTagText = inputText.value.trim();
    if (newTagText !== "") {
        let newTag = true;
        for (let tag of outputList.children) {
            if (newTagText === (<Element>tag).textContent) {
                newTag = false;
                break;
            }
        }
        if (newTag) {
            let newTagElement = document.createElement("button");
            newTagElement.textContent = newTagText;
            newTagElement.className = "tag";
            outputList.appendChild(newTagElement);
            newTagElement.addEventListener("click", () => {newTagElement.remove()});
        }
    }
    inputText.value = "";
}
function getTags(tagList:HTMLInputElement) {
    let output = [];
    for (let tag of tagList.children) {
        output.push(tag.textContent);
    }
    return output.length > 0 ? output : [""];
}
function tagTextboxShortcuts(event:KeyboardEvent, inputText:HTMLInputElement, outputList:HTMLElement) {
    if (event.key === "Enter") {
        createFilterTag(inputText, outputList);
    } else if (event.key === "Escape") {
        inputText.value = "";
    } else if (event.key === "Delete") {
        while (outputList.children.length > 0) {
            outputList.children[0].remove();
        }
    }
}

function showError(text:string) {
    errorText.textContent = text;
    for (let timer of timerIDs) {
        window.clearInterval(timer);
    }
    fadeInElement(errorText, 500);
    let errorTimeout = setTimeout(() => {
        fadeOutElement(errorText, 1000);
    }, 3000);
    timerIDs.push(errorTimeout);
}

// Initialize page elements
const importConfigButton = document.getElementById("import-config");
importConfigButton.addEventListener("click", () => {
    //TODO: Implement this.
});

const exportConfigButton = document.getElementById("export-config");
exportConfigButton.addEventListener("click", () => {
    //TODO: Implement this.
});

const linkInput = <HTMLInputElement>document.getElementById("link");

const numWinnersInput = <HTMLInputElement>document.getElementById("winners");
numWinnersInput.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
        numWinnersInput.value = "1";
    }
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
    }
});
const videoEmbedCheckbox = <HTMLInputElement>document.getElementById("video-embed");
videoEmbedCheckbox.addEventListener("click", () => {
    if (videoEmbedCheckbox.checked) {
        anyEmbedCheckbox.checked = false;
    }
});
const gifEmbedCheckbox = <HTMLInputElement>document.getElementById("gif-embed");
gifEmbedCheckbox.addEventListener("click", () => {
    if (gifEmbedCheckbox.checked) {
        anyEmbedCheckbox.checked = false;
    }
});
const anyEmbedCheckbox = <HTMLInputElement>document.getElementById("any-embed");
anyEmbedCheckbox.addEventListener("click", () => {
    if (anyEmbedCheckbox.checked) { 
        imageEmbedCheckbox.checked = false;
        videoEmbedCheckbox.checked = false;
        gifEmbedCheckbox.checked = false;
    }
});
const hostReplyCheckbox = <HTMLInputElement>document.getElementById("host-reply");
hostReplyCheckbox.checked = false;
hostReplyCheckbox.addEventListener("click", () => {toggleElementVisibility(["specific-reply-div"])});

const hostReplySpecificCheckbox = <HTMLInputElement>document.getElementById("specific-reply");
hostReplySpecificCheckbox.checked = false;
hostReplySpecificCheckbox.addEventListener("click", () => {toggleElementVisibility(["specific-reply-text"])});


const hostReplyInput = <HTMLInputElement>document.getElementById("reply-text");
const hostReplyList = <HTMLInputElement>document.getElementById("reply-text-list");
hostReplyInput.addEventListener("keyup", (event) => tagTextboxShortcuts(event, hostReplyInput, hostReplyList));

const hostReplyAddButton = document.getElementById("add-reply-button");
hostReplyAddButton.addEventListener("click", () => {createFilterTag(hostReplyInput, hostReplyList)});

const replyCaseSensitiveCheckbox = <HTMLInputElement>document.getElementById("case-sensitive");
const replyExactMatchCheckbox = <HTMLInputElement>document.getElementById("exact-match");

const userFilterCheckbox = <HTMLInputElement>document.getElementById("user-filter-check");
userFilterCheckbox.checked = false;
userFilterCheckbox.addEventListener("click", () => toggleElementVisibility(["user-filter"]));

const userFilterInput = <HTMLInputElement>document.getElementById("user-filter-text");
const userFilterList = <HTMLInputElement>document.getElementById("user-filter-list");
userFilterInput.addEventListener("keyup", (event) => tagTextboxShortcuts(event, userFilterInput, userFilterList));

const userFilterAddButton = document.getElementById("add-user-filter-button");
userFilterAddButton.addEventListener("click", () => {createFilterTag(userFilterInput, userFilterList)});

const raffleButton = document.getElementById("run-raffle");
raffleButton.addEventListener("click", () => runRaffle())

const errorText = document.getElementById("error");

var rerollCandidates = [];
const winnerSection = document.getElementById("winner-section");
const clearWinnersButton = document.getElementById("clear-winners");
clearWinnersButton.addEventListener("click", () => clearWinners());
const rerollButton = document.getElementById("reroll");
rerollButton.addEventListener("click", () => rerollWinners());
const displayWinners = document.getElementById("winner-grid");

// Config
function setRaffleConfig() {
    let raffleConfig = {
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
            specificReplies: getTags(hostReplyList),
            caseSensitive: replyCaseSensitiveCheckbox.checked,
            exact: replyExactMatchCheckbox.checked
        },
        blockList: userFilterCheckbox.checked,
        blockedHandles: getTags(userFilterList)
    }
    return raffleConfig;
}

// API calls
async function signIn() {
    let agent = new AtpAgent({service: "https://public.api.bsky.app"});
    return agent;
}

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
    }
}

async function getFollows(agent:AtpAgent, hostActor:string) {
    let output = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.app.bsky.graph.getFollowers({actor: hostActor, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.followers);
    }
    return output;
}

async function getLikes(agent:AtpAgent, postUri:string) {
    let likes = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.app.bsky.feed.getLikes({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        likes = likes.concat(returnData.likes);
    }
    let output = [];
    for (let like of likes) {
        output.push(like["actor"]);
    }
    return output;
}

async function getReposts(agent:AtpAgent, postUri:string) {
    let output = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.app.bsky.feed.getRepostedBy({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.repostedBy);
    }
    return output;
}

async function getComments(agent:AtpAgent, postUri:string) {
    return (await agent.app.bsky.feed.getPostThread({uri: postUri, depth: 2})).data.thread["replies"];
}

function commentEmbedFilter(comments:Object, embedTypes:Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        try { // Check if embed exists.
            let embedData = comment["post"]["embed"];
            if (embedTypes["any"] && embedData !== undefined){
                output.push(comment);
                continue; 
            }
            try { // Check embed for image.
                if (embedTypes["image"] && embedData["$type"].includes("image")) {
                    output.push(comment);
                    continue; 
                }
            } catch {}
            try { // Check embed for video.
                if (embedTypes["video"] && embedData["$type"].includes("video")) {
                    output.push(comment);
                    continue; 
                }
            } catch {}
            try { // Check embed for GIF.
                if (embedTypes["gif"] && embedData["external"]["uri"].includes("://media.tenor.com/") && embedData["external"]["uri"].includes(".gif")) {
                    output.push(comment);
                    continue; 
                }
            } catch {}
        } catch {}
    }
    return output;
}
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
                        let validReplies = replyConfig["specificReplies"];
                        let isValidReply = false;
                        for (let validReply of validReplies) {
                            if (!replyConfig["caseSensitive"]) {
                                validReply = validReply.toLocaleLowerCase();
                                contents = contents.toLocaleLowerCase();
                            }
                            isValidReply = replyConfig["exact"] ? isValidReply = contents === validReply : contents.includes(validReply); 
                            if (isValidReply) {
                                break;
                            }
                        }
                        if (isValidReply) {
                            output.push(comment);
                            continue;
                        }
                    } else {
                        output.push(comment);
                        continue;
                    }
                }
            }
        }
    }
    return output;
}
function getCommentActors(comments:Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        output.push(comment["post"]["author"]);
    }
    return output;
}

function getCandidates(candidateGroups:Array<Array<Object>>, denyList:Array<string>) {
    let prevBuffer = [];
    let output = [];
    let firstGroup = true;
    // Make sure all required parameters are met for all entrants.
    for (let group of candidateGroups) {
        if (group != undefined) {
            if (firstGroup) {
                firstGroup = false;
                prevBuffer = group;
                continue;
            }
            for (let [_, candidate] of Object.entries(group)) {
                for (let prev of prevBuffer) {
                    if (candidate["handle"] === prev["handle"]) {
                        output.push(candidate);
                        break;
                    }
                }
            }
            prevBuffer = output;
            output = [];
        }
    }
    // Apply user filter.
    for (let [_, candidate] of Object.entries(prevBuffer)) {
        if (!denyList.includes(candidate["handle"])) {
            output.push(candidate);
        }
    }
    return output;
}

function pickWinners(candidates:Array<Object>, numWinners:number, reroll?:boolean) {
    if (!reroll) {
        clearWinners();
    }
    let winners = [];
    for (let roll = 0; roll < numWinners; roll++) {
        let winnerIndex = Math.floor(Math.random() * candidates.length);
        winners.push(candidates.splice(winnerIndex, 1));
        winners = winners.flat();
    }
    rerollCandidates = candidates;
    return winners;
}

function addWinner(winner:Object) {
    let handle = winner["handle"];
    let avatar = winner["avatar"];
    let profile = `https://bsky.app/profile/${handle}`;
    let name = winner["displayName"] != "" ? winner["displayName"] : handle;
    if (name.length > 16) {
        name = name.substring(0, 16) + "...";
    }

    let winnerSpan = document.createElement("span");
    winnerSpan.id = handle;
    winnerSpan.className = "winner";
    
    let pfp = document.createElement("img");
    pfp.src = avatar;
    pfp.alt = `Avatar for Bluesky user ${handle}`;
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
    profileLink.target = "_blank";
    profileLink.rel = "noopener noreferrer";
    infoDiv.appendChild(profileLink);

    winnerSpan.addEventListener("click", () => toggleReroll(infoDiv.id));
    return winnerSpan;
}

function clearWinners() {
    while (displayWinners.children.length > 0) {
        displayWinners.children[0].remove();
    }
    winnerSection.className = "hide";
    displayWinners.className = "hide";
}

function toggleReroll(targetId:string) {
    let selection = document.getElementById(targetId);
    if (selection.className === "winner-info") {
        selection.className = "winner-info-reroll-select";
    } else if (selection.className === "winner-info-reroll-select") {
        selection.className = "winner-info";
    } else if (selection.className === "winner-info-rerolled") {
        selection.className = "winner-info-reroll-select-again";
    } else if ((selection.className === "winner-info-reroll-select-again")) {
        selection.className = "winner-info-rerolled";
    }
    rerollButton.className = "hide";
    for (let element of displayWinners.children) {
        for (let child of element.children) {
            if (["winner-info-reroll-select", "winner-info-reroll-select-again"].includes(child.className)) {
                rerollButton.className = "show";
                break;
            }
        }
        if (rerollButton.className === "show") {
            break;
        }
    }
}

function rerollWinners() {
    for (let oldWinner of displayWinners.children) {
        for (let child of oldWinner.children) {
            if (["winner-info-reroll-select", "winner-info-reroll-select-again"].includes(child.className)) {
                if (rerollCandidates.length > 0) {
                    let newWinner = pickWinners(rerollCandidates, 1, true)[0];
                    let newWinnerElement = addWinner(newWinner);
                    displayWinners.replaceChild(newWinnerElement, oldWinner);
                    document.getElementById(`${newWinnerElement.id}-info`).className = "winner-info-rerolled";
                }
            }
        }
    }
}

// Raffle procedure
async function runRaffle() {
    showError("Please wait...")
    clearWinners();
    let raffleConfig = setRaffleConfig();
    if (raffleConfig.link === "") {
        showError("No post specifiied.");
        return;
    }
    if ([raffleConfig.follow, raffleConfig.like, raffleConfig.repost, raffleConfig.comment].find((a) => {return a === false})) {
        showError("No raffle options set!");
        return;
    }
    let agent = await signIn();
    let postInfo = await getHostInfo(agent, raffleConfig.link);

    // Ensure raffle host can't win.
    if (!raffleConfig.blockedHandles.includes(postInfo.hostHandle)) {
        raffleConfig.blockedHandles.push(postInfo.hostHandle);
    }
    raffleConfig.blockedHandles = raffleConfig.blockedHandles.filter((a) => {return a != ""});
    if (raffleConfig.follow) {
        var follows = await getFollows(agent, postInfo.hostHandle);
    }
    if (raffleConfig.like) {
        var likes = await getLikes(agent, postInfo.postUri);
    }
    if (raffleConfig.repost) {
        var reposts = await getReposts(agent, postInfo.postUri);
    }
    if (raffleConfig.comment) {
        var comments = await getComments(agent, postInfo.postUri);
        if (Object.values(raffleConfig.embedTypes).find((a) => {return a === true})) {
            comments = commentEmbedFilter(comments, raffleConfig.embedTypes);
        }
        if (raffleConfig.hostReply.enabled) {
            comments = commentReplyFilter(
                comments,
                postInfo.hostHandle,
                raffleConfig.hostReply
            )
        }
        comments = getCommentActors(comments);
    }
    let candidates = getCandidates([follows, likes, reposts, comments], raffleConfig.blockedHandles);
    if (candidates.length > 0) {
        var winners = candidates.length > raffleConfig.winners ? pickWinners(candidates, raffleConfig.winners) : candidates;
    } else {
        showError("No viable candidates. No winners!");
        return;
    }
    for (let winner of winners) {
        displayWinners.appendChild(addWinner(winner));
    }
    winnerSection.className = "show";
    displayWinners.className = "show";

    errorText.className = "hide";
    errorText.style.opacity = "0";
    errorText.textContent = "unset";

    document.getElementById("scroll-point").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
