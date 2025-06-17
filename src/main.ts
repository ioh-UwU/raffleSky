import { AtpAgent } from "@atproto/api";

// Page functionality
function toggleElementVisibility(ids: (string | HTMLElement)[], visible?: boolean) {
    for (let id of ids) {
        if (typeof id === "string") {
            var element = document.getElementById(id);
        } else {
            var element = id;
        }
        if (visible !== undefined) {
            element.className = visible ? "show" : "hide";
        } else {
            element.className = element.className === "hide" ? "show" : "hide";
        }
    }
}
var messageTimerIDs = [];
function fadeInElement(element: HTMLElement, msDuration: number) {
    const step = 0.05; // 20 times
    const delay = msDuration / 20;
    let opacity = 0;
    element.style.opacity = "0";
    element.className = "show";
    let timer = setInterval(() => {
        opacity += step;
        if (opacity > 1) {
            opacity = 1;
            window.clearInterval(timer);
        }
        element.style.opacity = opacity.toPrecision(2);
    }, delay);
    if (element.hasAttribute("value")) {
        messageTimerIDs.push(timer);
    }
}
function fadeOutElement(element: HTMLElement, msDuration: number) {
    const step = 0.05; // 20 times
    const delay = msDuration / 20;
    let opacity = 1;
    let timer = setInterval(() => {
        opacity -= step;
        if (opacity < 0) {
            opacity = 0;
            element.className = "hide";
            window.clearInterval(timer);
        }
        element.style.opacity = opacity.toPrecision(2);
    }, delay);
    if (element.hasAttribute("value")) {
        messageTimerIDs.push(timer);
    }
}

function createFilterTag(inputText: string | HTMLInputElement, outputList: HTMLElement) {
    if (typeof inputText === "string") {
        var newTagText = inputText.trim();
    } else {
        var newTagText = inputText.value.trim();
        inputText.value = "";
    }
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
}
function getTags(tagList: HTMLInputElement) {
    let output = [];
    for (let tag of tagList.children) {
        output.push(tag.textContent);
    }
    return output.length > 0 ? output : [];
}
function tagTextboxShortcuts(event: KeyboardEvent, inputText: HTMLInputElement, outputList: HTMLElement) {
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

function optimizeUserObject(user: Object) {
    let optimizedUser = {
        handle: user["handle"],
        displayName: user["displayName"] || "",
        avatar: user["avatar"],
        rerolled: user["rerolled"]
    }
    return optimizedUser;
}

function showMessage(text: string, { upload=false, type }: { upload?: boolean, type: string }) {
    if (upload) {
        var messageContainer = document.getElementById("upload-message");
    } else {
        var messageContainer = document.getElementById("raffle-message");
    }
    messageContainer.style.display = "inline"
    let message = messageContainer.children[0];
    if (type === "warning") {
        message.className = "warning";
    } else if (type === "success") {
        message.className = "success";
    } else {
        message.className = "message";
    }
    message.textContent = text;
    for (let timer of messageTimerIDs) {
        window.clearInterval(timer);
    }
    fadeInElement(messageContainer, 500);
    let messageTimeout = setTimeout(() => {
        fadeOutElement(messageContainer, 1000);
    }, 3000);
    messageTimerIDs.push(messageTimeout);
}

// Initialize page elements
const importConfigButton = document.getElementById("import-config");
importConfigButton.addEventListener("click", () => {
    importConfigFileUploadInput.value = null;
    importConfigKeepLinkInput.checked = true;
    importConfigKeepWinnersInput.checked = true;
    fadeInElement(importConfigOverlay, 40);
    importConfigFileUploadInput.click();
});
const importConfigOverlay = document.getElementById("import-config-overlay");
document.addEventListener("keyup", (event) => {
    if (event.key === "Escape" && importConfigOverlay.className === "show") {
        fadeOutElement(importConfigOverlay, 40);
    }
});
const importConfigExitButton = document.getElementById("import-exit-button")
importConfigExitButton.addEventListener("click", () => {
    fadeOutElement(importConfigOverlay, 40);
});

const importConfigFileUploadInput = <HTMLInputElement>document.getElementById("import-config-file-upload");
const importConfigKeepLinkInput = <HTMLInputElement>document.getElementById("import-config-keep-link");
importConfigKeepLinkInput.checked = true;
const importConfigKeepWinnersInput = <HTMLInputElement>document.getElementById("import-config-keep-winners");
importConfigKeepWinnersInput.checked = true;

const confirmImportConfigButton = document.getElementById("confirm-import-config");
confirmImportConfigButton.addEventListener("click", async () => {
    let configFile = importConfigFileUploadInput.files[0];
    if (configFile === undefined) {
        showMessage("No file selected.", {upload: true, type: "warning"} );
    } else {
        let config = JSON.parse(await configFile.text());
        importRaffle(config);
        fadeOutElement(importConfigOverlay, 40);
        showMessage("Config import success!", { type: "success" });
    }
});

const exportConfigOverlay = document.getElementById("export-config-overlay");
document.addEventListener("keyup", (event) => {
    if (event.key === "Escape" && exportConfigOverlay.className === "show") {
        fadeOutElement(exportConfigOverlay, 40);
    }
});
const exportConfigExitButton = document.getElementById("export-exit-button");
exportConfigExitButton.addEventListener("click", () => {  
    fadeOutElement(exportConfigOverlay, 40);
});

const exportConfigButton = document.getElementById("export-config");
exportConfigButton.addEventListener("click", () => {
    exportConfigFileNameInput.value = "";
    fadeInElement(exportConfigOverlay, 40);
});
const exportConfigFileNameInput = <HTMLInputElement>document.getElementById("export-config-file-name");
exportConfigFileNameInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        confirmExportConfigButton.click();
    }
});
const confirmExportConfigButton = document.getElementById("confirm-export-config");
confirmExportConfigButton.addEventListener("click", () => {
    if (exportConfigFileNameInput.value !== "") {
        // First replace: remove file extension.
        // Second replace: remove uncommon characters.
        var exportFileName = exportConfigFileNameInput.value.replace(/\.[a-zA-Z0-9-_]+$/g, "").replace(/[^a-zA-Z0-9-_]/g, "-");
    } else {
        var exportFileName = "bluesky-raffle-config";
    }
    try {
        let exportCandidates = [];
        for (let candidate of candidates) {
            candidate = optimizeUserObject(candidate);
            exportCandidates.push(candidate);
        }
        let exportWinners = [];
        for (let winner of winners) {
            winner = optimizeUserObject(winner);
            exportWinners.push(winner);
        }
        let exportConfig = {
            raffleConfig: getRaffleConfig(),
            candidates: exportCandidates,
            winners: exportWinners,
        }
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportConfig, null, 2));
        let downloadAnchorElement = document.getElementById("download-anchor");
        downloadAnchorElement.setAttribute("href", dataStr);
        downloadAnchorElement.setAttribute("download", `${exportFileName}.json`);
        downloadAnchorElement.click();
        fadeOutElement(exportConfigOverlay, 40);
        showMessage("Export successful!", { type: "success" });
    } catch {
        showMessage("Export unsuccessful.", { type: "warning" });
    }
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
hostReplyCheckbox.addEventListener("click", () => { 
    toggleElementVisibility(["specific-reply-div"])
});

const hostReplySpecificCheckbox = <HTMLInputElement>document.getElementById("specific-reply");
hostReplySpecificCheckbox.checked = false;
hostReplySpecificCheckbox.addEventListener("click", () => {
    toggleElementVisibility(["specific-reply-text"])
});


const hostReplyInput = <HTMLInputElement>document.getElementById("reply-text");
const hostReplyList = <HTMLInputElement>document.getElementById("reply-text-list");
hostReplyInput.addEventListener("keyup", (event) => tagTextboxShortcuts(event, hostReplyInput, hostReplyList));

const hostReplyAddButton = document.getElementById("add-reply-button");
hostReplyAddButton.addEventListener("click", () => {
    createFilterTag(hostReplyInput, hostReplyList)
});

const replyCaseSensitiveCheckbox = <HTMLInputElement>document.getElementById("case-sensitive");
const replyExactMatchCheckbox = <HTMLInputElement>document.getElementById("exact-match");

const userFilterCheckbox = <HTMLInputElement>document.getElementById("user-filter-check");
userFilterCheckbox.checked = false;
userFilterCheckbox.addEventListener("click", () => toggleElementVisibility(["user-filter"]));

const userFilterInput = <HTMLInputElement>document.getElementById("user-filter-text");
const userFilterList = <HTMLInputElement>document.getElementById("user-filter-list");
userFilterInput.addEventListener("keyup", (event) => tagTextboxShortcuts(event, userFilterInput, userFilterList));

const userFilterAddButton = document.getElementById("add-user-filter-button");
userFilterAddButton.addEventListener("click", () => {
    createFilterTag(userFilterInput, userFilterList)
});

const raffleButton = document.getElementById("run-raffle");
raffleButton.addEventListener("click", () => runRaffle())

const winnerSection = document.getElementById("winner-section");
const clearWinnersButton = document.getElementById("clear-winners");
clearWinnersButton.addEventListener("click", () => clearWinners());
const rerollButton = document.getElementById("reroll");
rerollButton.addEventListener("click", () => pickWinners({ reroll: true }));
const displayWinners = document.getElementById("winner-grid");

var candidates = [];
var winners = [];

// Config
function getRaffleConfig() {
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
function importRaffle(config: Object) {
    let raffleConfig = config["raffleConfig"];
    clearWinners();

    if (importConfigKeepLinkInput.checked) {
        linkInput.value = raffleConfig["link"];
    } else {
        linkInput.value = "";
    }
    numWinnersInput.value = raffleConfig["winners"];
    followCheckbox.checked = raffleConfig["follow"];
    likeCheckbox.checked = raffleConfig["like"];
    repostCheckbox.checked = raffleConfig["repost"];
    commentCheckbox.checked = raffleConfig["comment"];
    if (commentCheckbox.checked) {
        toggleElementVisibility(["embed-config", "host-reply-div"], true);
    }
    imageEmbedCheckbox.checked = raffleConfig["embedTypes"]["image"];
    videoEmbedCheckbox.checked = raffleConfig["embedTypes"]["video"];
    gifEmbedCheckbox.checked = raffleConfig["embedTypes"]["gif"];
    anyEmbedCheckbox.checked = raffleConfig["embedTypes"]["any"];
    hostReplyCheckbox.checked = raffleConfig["hostReply"]["enabled"];
    if (hostReplyCheckbox.checked) {
        toggleElementVisibility(["specific-reply-div"], true);
    }
    hostReplySpecificCheckbox.checked = raffleConfig["hostReply"]["specific"];
    if (hostReplySpecificCheckbox.checked) {
        toggleElementVisibility(["specific-reply-text"], true);
    }
    for (let tag of raffleConfig["hostReply"]["specificReplies"]) {
        createFilterTag(tag, hostReplyList);
    }
    replyCaseSensitiveCheckbox.checked = raffleConfig["hostReply"]["caseSensitive"];
    replyExactMatchCheckbox.checked = raffleConfig["hostReply"]["exact"];
    userFilterCheckbox.checked = raffleConfig["blockList"];
    if (userFilterCheckbox.checked) {
        toggleElementVisibility(["user-filter"], true);
    }
    for (let tag of raffleConfig["blockedHandles"]) {
        createFilterTag(tag, userFilterList);
    }
    if (importConfigKeepWinnersInput.checked) {
        winners = config["winners"];
        if (winners.length > 0) {
            candidates = config["candidates"];
            for (let [_, winner] of Object.entries(winners)) {
                displayWinners.appendChild(addWinner(winner));
            }
            showWinners();
        }
    }
}

// API calls
async function signIn() {
    let agent = new AtpAgent({service: "https://public.api.bsky.app"});
    return agent;
}

// Raffle data requests
async function getHostInfo(agent: AtpAgent, link: string) {
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

async function getFollows(agent: AtpAgent, hostActor: string) {
    let output = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.app.bsky.graph.getFollowers({actor: hostActor, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.followers);
    }
    return output;
}

async function getLikes(agent: AtpAgent, postUri: string) {
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

async function getReposts(agent: AtpAgent, postUri: string) {
    let output = [];
    let enumCursor = "";
    while (enumCursor !== undefined) {
        let returnData = (await agent.app.bsky.feed.getRepostedBy({uri: postUri, limit: 100, cursor: enumCursor})).data;
        enumCursor = returnData.cursor;
        output = output.concat(returnData.repostedBy);
    }
    return output;
}

async function getComments(agent: AtpAgent, postUri: string) {
    return (await agent.app.bsky.feed.getPostThread({uri: postUri, depth: 2})).data.thread["replies"];
}

function commentEmbedFilter(comments: Object, embedTypes: Object) {
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
function commentReplyFilter(comments: Object, hostHandle: string, replyConfig: Object) {
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
function getCommentActors(comments: Object) {
    let output = [];
    for (let [_, comment] of Object.entries(comments)) {
        output.push(comment["post"]["author"]);
    }
    return output;
}

function getCandidates(candidateGroups: Array<Array<Object>>, denyList: Array<string>) {
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
    // Apply user filter and add "rerolled" property (used by imported configs).
    for (let [_, candidate] of Object.entries(prevBuffer)) {
        if (!denyList.includes(candidate["handle"])) {
            Object.defineProperty(candidate, "rerolled", { value: false, writable: true, enumerable: true });
            output.push(candidate);
        }
    }
    return output;
}

function pickWinners({ numWinners, reroll=false }: { numWinners?: number, reroll?: boolean }) {
    if (reroll) {
        for (let oldWinner of displayWinners.children) {
            for (let child of oldWinner.children) {
                if (["winner-info-reroll-select", "winner-info-reroll-select-again"].includes(child.className)) {
                    if (candidates.length > 0) {
                        let winnerIndex = Math.floor(Math.random() * candidates.length);
                        let newWinner = candidates.splice(winnerIndex, 1)[0];
                        newWinner["rerolled"] = true;
                        let newWinnerElement = addWinner(newWinner);
                        for (let winner of winners) {
                            if (winner["handle"] === oldWinner.id) {
                                winners.splice(winners.indexOf(winner), 1, newWinner);
                                break;
                            }
                        }
                        displayWinners.replaceChild(newWinnerElement, oldWinner);
                        document.getElementById(`${newWinnerElement.id}-info`).className = "winner-info-rerolled";
                    } else {
                        showMessage("No more candidates to reroll with!", { type: "message" });
                    }
                }
            }
        }
    } else {
        for (let roll = 0; roll < numWinners; roll++) {
            let winnerIndex = Math.floor(Math.random() * candidates.length);
            let newWinner = candidates.splice(winnerIndex, 1);
            winners.push(newWinner);
            winners = winners.flat();
        }
    }
    return winners;
}

function addWinner(winner: Object) {
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
    if (winner["rerolled"]) {
        infoDiv.className = "winner-info-rerolled";
    } else {
        infoDiv.className = "winner-info";
    }
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

function showWinners() {
    winnerSection.className = "show";
    displayWinners.className = "show";
    showMessage("Success!", { type: "success" });
    
    document.getElementById("scroll-point").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function clearWinners() {
    winners = [];
    candidates = [];
    while (displayWinners.children.length > 0) {
        displayWinners.children[0].remove();
    }
    winnerSection.className = "hide";
    displayWinners.className = "hide";
}

function toggleReroll(targetId: string) {
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

// Raffle procedure
async function runRaffle() {
    showMessage("Please wait...", { type: "message" });
    clearWinners();
    let raffleConfig = getRaffleConfig();
    if (raffleConfig.link === "") {
        showMessage("No post specifiied.", { type: "warning" });
        return;
    }
    if ([raffleConfig.follow, raffleConfig.like, raffleConfig.repost, raffleConfig.comment].find((a) => {return a === false})) {
        showMessage("No raffle options set!", { type: "warning" });
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
    candidates = getCandidates([follows, likes, reposts, comments], raffleConfig.blockedHandles);
    if (candidates.length > 0) {
        winners = candidates.length > raffleConfig.winners ? pickWinners({ numWinners: raffleConfig.winners }) : candidates;
    } else {
        showMessage("No viable candidates. No winners!", { type: "message" });
        return;
    }
    for (let winner of winners) {
        displayWinners.appendChild(addWinner(winner));
    }
    showWinners();
}
