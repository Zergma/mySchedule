const friends = [
    { name: "dad", status: "available" },
    { name: "mom", status: "busy" }
];

function updateFriendsList(isBusy) {
    const friendsContainer = document.getElementById("pinnedFriends");
    friendsContainer.innerHTML = ""; // clear current content

    friends.forEach(f => {
        const div = document.createElement("div");
        div.classList.add("friend", f.status); // adds both .friend and .available/.busy

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("name");
        nameSpan.textContent = f.name;

        const statusSpan = document.createElement("span");
        statusSpan.classList.add("status");

        div.appendChild(nameSpan);
        div.appendChild(statusSpan);
        friendsContainer.appendChild(div);
    });
}

// Call once to populate list
updateFriendsList();

function renderFriends(friends) {
    const pinnedContainer = document.getElementById("pinnedFriends");
    const allContainer = document.getElementById("allFriends");

    pinnedContainer.innerHTML = "";
    allContainer.innerHTML = "";

    friends.forEach(friend => {
        const friendDiv = document.createElement("div");
        friendDiv.classList.add("friend");

        const name = document.createElement("span");
        name.classList.add("name");
        name.textContent = friend.username;

        const status = document.createElement("span");
        status.classList.add("status");

        if (friend.available) {
            friendDiv.classList.add("available");
        } else {
            friendDiv.classList.add("busy");
        }

        friendDiv.appendChild(name);
        friendDiv.appendChild(status);

        if (friend.pinned) {
            pinnedContainer.appendChild(friendDiv);
        } else {
            allContainer.appendChild(friendDiv);
        }
    });

    friends.sort((a, b) => {
        return isAvailable(b) - isAvailable(a);
    });
}

// Helper functions

async function loadFriends() {
    const res = await fetch("/api/friends-with-events");
    const friends = await res.json();

    renderFriends(friends);
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
        welcome.style.color = "white";

        authButton.parentNode.insertBefore(welcome, authButton);
    } else {
        authButton.textContent = "Sign In";
        authButton.href = "login.html";
    }
}

checkSession();
loadFriends();
setInterval(loadFriends, 60000); // every minute
