document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const event = {
        title: document.getElementById("title").value,
        start_time: document.getElementById("start").value,
        end_time: document.getElementById("end").value,
        visibility: document.getElementById("visibility").value
    };

    const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
    });

    const data = await res.json();

    if (data.success) {
        alert("Event created!");
    } else {
        alert("Error creating event");
    }
});

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