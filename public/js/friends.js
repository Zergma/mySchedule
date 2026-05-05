let currentTab = "online"
let currentData = null; // can be an array or object
let messageInterval = null;

console.log("frontend friends.js loaded");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    selectTab("all");
    loadDMs();
    checkSession();

    document.getElementById("chatInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // prevents newline
            sendMessage();
        }
    });

    // heartbeat to keep users online even during 2 minutes of inactivity
    setInterval(() => {
        fetch("/api/friends/ping");
    }, 60000);
});

document.getElementById("friendsearchInput").addEventListener("input", searchFriends);
document.getElementById("friendsearchInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchFriends();
    }
});

function selectTab(tab) {
    currentTab = tab;
    // Clear search input when switching tabs
    document.getElementById("friendsearchInput").value = "";

    const content = document.getElementById("friendsContent");
    const searchContainer = document.getElementById("friendSearchContainer");
    content.innerHTML = ""; // clear current content

    // Show search bar for these tabs
    if (tab ==="online" || tab === "all" || tab === "pending") {
        searchContainer.style.display = "block";
    } else {
        searchContainer.style.display = "none";
    }

    if (tab === "add") {
        renderAddFriend();
    } else if (tab === "all") {
        loadAllFriends();
    } else if (tab === "pending") {
        loadPending();
    } else if (tab === "online") {
        loadOnlineFriends();
    }

    // Remove active class from all tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active-tab"));

    // Add active class to current tab
    const clickedBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);

    if (clickedBtn) {
        clickedBtn.classList.add("active-tab");
    }
}

async function loadDMs() {
    const res = await fetch("/api/friends");
    const friends = await res.json();
    const dmList = document.getElementById("dmList");
    dmList.innerHTML = "";

    renderChat(false);

    friends.forEach(friend => {
        const div = document.createElement("div");
        div.textContent = friend.username;
        div.classList.add("dm-entry");

        div.addEventListener("click", () => {
            // Remove active from all
            document.querySelectorAll(".dm-entry").forEach(entry => entry.classList.remove("active-dm"));
            // Add active to clicked
            div.classList.add("active-dm");
            openChat(friend);
        });

        dmList.appendChild(div);
    });
}

function goToFriends() {
    const tabs = document.getElementById("friendsTabs");

    // Show tabs again
    tabs.style.display = "flex";

    // Remove active DM highlight
    document.querySelectorAll(".dm-entry").forEach(entry => {
        entry.classList.remove("active-dm");
    })

    renderChat(false);
    renderContent(true);

    // Default back to "all"
    selectTab("all");
}

function openChat(friend) {
    //content.innerHTML = `<h2>Chat with ${username}</h2>`;
    const tabs = document.getElementById("friendsTabs");
    const searchBar = document.getElementById("friendSearchContainer");

    tabs.style.display = "none"; // Hide tabs when in DM
    searchBar.style.display = "none"; // Hide search bar when in DM

    // Set chat title
    document.getElementById("chatHeader").textContent = `Chat with ${friend.username}`;
    document.getElementById("chatInput").placeholder = `Message ${friend.username}`;

    renderChat(true);
    renderContent(false);

    const chat = document.getElementById("chat");
    chat.dataset.userId = friend.id; // store ID instead of username
    chat.dataset.username = friend.username; // used in loadMessages

    loadMessages(friend.id);

    // Polling when a chat is open (refresh)
    if (messageInterval) { // Clear old interval first
        clearInterval(messageInterval);
    }

    messageInterval = setInterval(() => { // Start new interval
        loadMessages(friend.id);
    }, 2000); // every 2 seconds
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");
    const chat = document.getElementById("chat");

    const userId = chat.dataset.userId;
    //username = chat.dataset.username;

    if (!input.value.trim()) return;

    fetch("/api/messages/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ receiverId: userId, message: input.value })
    }).then(() => {
        input.value = ""; // Clear input after sending
        loadMessages(userId); // Refresh chat
    });
}

function loadMessages(userId) {
    const chat = document.getElementById("chat");
    const friendUser = chat.dataset.username;

    fetch(`/api/messages/${userId}`)
        .then(res => res.json())
        .then(messages => {
            const chatBox = document.getElementById("chatMessages");
            chatBox.innerHTML = ""; // Clear current messages

            messages.forEach(msg => {
                const div = document.createElement("div");
                if (msg.sender_id == userId) {
                    div.textContent = friendUser + ": " + msg.message;
                } else {
                    div.textContent = "You: " + msg.message;
                }
                chatBox.appendChild(div);
        })
    })
}

async function searchFriends() {
    const search = document.getElementById("friendsearchInput").value.toLowerCase();
    const content = document.getElementById("friendsContent");

    if (!currentData) { return; }

    if (currentTab === "pending") {
        const filtered = {
            received: currentData.received.filter(friend => friend.username.toLowerCase().includes(search)),
            sent: currentData.sent.filter(friend => friend.username.toLowerCase().includes(search))
        };

        renderPendingRequests(filtered);
    }

    if (currentTab === "all" || currentTab === "online") {
        const filtered = currentData.filter(friend => friend.username.toLowerCase().includes(search));
        renderFriends(filtered);
    }
}

async function loadOnlineFriends() {
    const res = await fetch("/api/friends/online");
    currentData = await res.json();

    renderFriends(currentData);
}

async function loadAllFriends() {
    const res = await fetch("/api/friends");
    //const friends = await res.json();
    currentData = await res.json();

    renderFriends(currentData);
}

async function loadPending() {
    const res = await fetch("/api/friends/pending", { method: "POST" });
    //const pending = await res.json();
    currentData = await res.json();

    const content = document.getElementById("friendsContent");

    renderPendingRequests(currentData);
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

function renderChat(trueorfalse) {
    const chat = document.getElementById("chat");
    if (trueorfalse) {
        chat.style.display = "flex";
    } else {
        chat.style.display = "none";
    }
}

function renderContent(trueorfalse) {
    const content = document.getElementById("friendsContent");
    if (trueorfalse) {
        content.style.display = "block";
    } else {
        content.style.display = "none";
    }
}

function renderAddFriend() {
    const content = document.getElementById("friendsContent");
    
    content.innerHTML = `
        <h2>Add Friend</h2>
        <input type="text" id="searchInput" class="friendSearch" placeholder="Search username">
        <button onclick="searchUsers()">Search</button>
        <div id="results"></div>
    `;

    document.getElementById("searchInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            searchUsers();
        }
    });
}

function renderPendingRequests(data) {
    const content = document.getElementById("friendsContent");
    content.innerHTML = "";

    // RECEIEVED
    const receivedHeader = document.createElement("h3");
    receivedHeader.textContent = "Received";
    content.appendChild(receivedHeader);

    if (data.received.length === 0) {
        content.innerHTML += "<p>No incoming requests</p>";
    }

    data.received.forEach(req => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${req.username}
            <button onclick="acceptRequest(${req.requestId})">Accept</button>
            <button onclick="declineRequest(${req.requestId})">Decline</button>`;
        content.appendChild(div);
    })

    // SENT
    const sentHeader = document.createElement("h3");
    sentHeader.textContent = "Sent";
    content.appendChild(sentHeader);

    if (data.sent.length === 0) {
        content.innerHTML += "<p>No outgoing requests</p>";
    }

    data.sent.forEach(request => {
        const div = document.createElement("div");
        div.textContent = request.username + " (pending)";
        div.classList.add("pending-request");
        content.appendChild(div);
    })
}

function renderFriends(data) {
    const content = document.getElementById("friendsContent");
    content.innerHTML = "<h2>All Friends</h2>";

    data.forEach(friend => {
        const div = document.createElement("div");
        div.textContent = friend.username;
        content.appendChild(div);
    });
}

async function searchUsers() {
    const username = document.getElementById("searchInput").value;
    const res = await fetch(`/api/friends/search?username=${username}`);
    const users = await res.json();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    users.forEach(user => {
        const div = document.createElement("div");
        div.innerHTML = `${user.username}
            <button onclick="sendRequest(${user.id})">
            Add Friend</button>`;
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

    console.log(data); // debug

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

        authButton.parentNode.append(authButton);
    } else {
        authButton.textContent = "Sign In";
        authButton.href = "login.html";
    }
}
