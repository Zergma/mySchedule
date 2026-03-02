const friends = [
    { name: "dad", status: "available" },
    { name: "mom", status: "busy" }
];

function updateFriendsList(isBusy) {
    const friendsContainer = document.getElementById("pinned-friends");
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
