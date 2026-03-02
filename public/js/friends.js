document.addEventListener("DOMContentLoaded", () => {
    selectTab("all");
    loadDMs();
});

function selectTab(tab) {
    const content = document.getElementById("friendsContent");
    content.innerHTML = ""; // clear current content

    if (tab === "add") {
        renderAddFriend();
    } else if (tab === "all") {
        loadAllFriends();
    } else if (tab === "pending") {
        loadPending();
    } else if (tab === "online") {
        loadOnlineFriends();
    }
}

function renderAddFriend() {
    const content = document.getElementById("friendsContent");
    
    content.innerHTML = `
        <h2>Add Friend</h2>
        <input type="text" id="searchInput" placeholder="Search username">
        <button onclick="searchUsers()">Search</button>
        <div id="results"></div>
    `;
}

async function loadAllFriends() {
    const res = await fetch("/api/friends");
    const friends = await res.json();

    const content = document.getElementById("friendsContent");

    content.innerHTML = "<h2>All Friends</h2>";

    friends.forEach(friend => {
        const div = document.createElement("div");
        div.textContent = friend.username;
        content.appendChild(div);
    });
}

async function loadPending() {
    const res = await fetch ("/api/friends/pending");
    const pending = await res.json();

    const content = document.getElementById("friendsContent");
    content.innerHTML = "<h2>Pending Requests</h2>";

    pending.forEach(request => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${request.username}
            <button onclick="acceptRequest(${request.id}, true)">Accept</button>
            <button onclick="declineRequest(${request.id}, false)">Decline</button>
        `;
        content.appendChild(div);
    });
}

async function acceptRequest(requestId) {
    await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
    });

    loadPending();
}

async function declineRequest(requestId) {
    await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
    });

    loadPending();
}

async function loadDMs() {
    const res = await fetch("/api/friends");
    const friends = await res.json();
    const dmList = document.getElementById("dmList");
    dmList.innerHTML = "";

    friends.forEach(friend => {
        const div = document.createElement("div");
        div.textContent = friend.username;
        div.onclick = () => openChat(friend.username);
        dmList.appendChild(div);
    });
}

function openChat(username) {
    const content = document.getElementById("friendsContent");
    content.innerHTML = `<h2>Chat with ${username}</h2>`;
}

async function searchUsers() {
    const username = document.getElementById("searchInput").value;

    const res = await fetch(`/api/friends/search?username=${username}`);
    const users = await res.json();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    users.forEach(user => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${user.username}
            <button onclick="sendRequest(${user.id})">Add Friend</button>
        `;
        resultsDiv.appendChild(div);
    });
}

async function sendRequest(userId) {
    const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.success) {
        alert("Friend request sent!");
    } else {
        alert(data.message);
    }
}

// Check session to see if user is logged in
async function checkSession() {
    const response = await fetch("/session");
    const data = await response.json();

    const authButton = document.getElementById("authButton");

    if (data.loggedIn) {
        authButton.textContent = "Logout";
        authButton.href = "/logout";

        // Optional: add welcome text
        const welcome = document.createElement("span");
        welcome.textContent = `Welcome, ${data.username}`;
        welcome.style.marginRight = "15px";

        authButton.parentNode.insertBefore(welcome, authButton);
    } else {
        authButton.textContent = "Sign In";
        authButton.href = "login.html";
    }
}

checkSession();
