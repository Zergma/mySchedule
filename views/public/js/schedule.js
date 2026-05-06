let currentDate = new Date();
let currentView = "month";
let events = [];

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

// Load events from backend
async function loadEvents() {
    const res = await fetch("/api/events");
    events = await res.json();
}

function setupModal() {
    const sidebar = document.querySelector(".sidebar");
    const modal = document.getElementById("eventModal");
    const openBtn = document.getElementById("openModal");
    const closeBtn = document.getElementById("closeModal");
    const submitBtn = document.getElementById("submitEvent");

    openBtn.onclick = () => {
        modal.classList.remove("hidden");
        openBtn.classList.add("active");
    }
    closeBtn.onclick = () => {
        modal.classList.add("hidden");
        openBtn.classList.remove("active");
    }

    // Click outside closes modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
            openBtn.classList.remove("active");
        }
    };

    submitBtn.onclick = async () => {
        const event = {
            title: document.getElementById("title").value,
            start_time: document.getElementById("start").value,
            end_time: document.getElementById("end").value,
            visibility: document.getElementById("visibility").value,
            recurrence: document.getElementById("recurrence").value,
            color: document.getElementById("color").value
        };
        
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event)
        });

        if (res.ok) {
            modal.classList.add("hidden");
            refreshCalendar();
        } else {
            alert("Error creating event");
        }
    };
}

function eventOccursOnDate(event, date) {
    const eventDate = new Date(event.start_time);

    if (event.recurrence === "none") {
        return eventDate.toDateString() === date.toDateString();
    }
    console.log(event.start_time, new Date(event.start_time));

    if (event.recurrence === "weekly") {
        return eventDate.getDay() === date.getDay();
    }

    return false;
}

async function renderCalendar(view = currentView, date = currentDate) { // decides what to show
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    renderHeader(calendar, view, date);

    if (view === "month") {
        renderMonthView(calendar, date);
    } else {
        renderWeekView(calendar, date);
    }
}

function renderMonthView(calendar, date) { // handles month layout
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Grid
    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement("div"));
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";

        const date = new Date(year, month, day);

        // Day number
        const dayLabel = document.createElement("div");
        dayLabel.className = "day-label";
        dayLabel.textContent = day;

        cell.appendChild(dayLabel);

        // Events inside cell
        events.forEach(event => {
            if (eventOccursOnDate(event, date)) {
                const eventDiv = document.createElement("div");
                eventDiv.className = "event";
                eventDiv.textContent = event.title;
                eventDiv.style.backgroundColor = event.color;
                //eventDiv.draggable = true;
                
                /*eventDiv.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("eventId", event.id);
                });*/

                eventDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm("Delete event?")) {
                        deleteEvent(event.id);
                    }
                    /*e.stopPropagation(); // prevent day click

                    const action = prompt("Delete?", "delete");
                    if (action === "delete") {
                        deleteEvent(event.id);
                    }*/
                    /*const action = prompt("Edit or Delete?", "edit");
                    if (action === "delete") {
                        deleteEvent(event.id);
                    } else if (action === "edit") {
                        editEvent(event);
                    }*/
                }

                cell.appendChild(eventDiv);
            }
        });

        // Click to create event
        cell.onclick = () => {
            openCreateModal(date);
            /*document.getElementById("start").value = date.toISOString().slice(0, 16);
            document.getElementById("end").value = date.toISOString().slice(0, 16);*/
        };
/*
        cell.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        cell.addEventListener("drop", async (e) => {
            const eventId = e.dataTransfer.getData("eventId");

            const newDate = new Date(year, month, day);

            await fetch(`/api/events/${eventId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start_time: newDate })
            });

            renderCalendar();
        });*/

        grid.appendChild(cell);
    }
    calendar.appendChild(grid);
}

function renderWeekView(calendar, date) { // handles week layout
    const container = document.createElement("div");
    container.className = "week-container";
    
    // Grid
    const grid = document.createElement("div");
    grid.className = "week-grid";

    // Get start of week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    // --- Header row (days) ---
    const headerRow = document.createElement("div");
    headerRow.className = "week-header";
    
    // Empty top-left corner for time column
    const emptyCorner = document.createElement("div");
    headerRow.appendChild(emptyCorner);

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);

        const dayHeader = document.createElement("div");
        dayHeader.className = "week-day-header";
        dayHeader.textContent = day.toLocaleString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
        headerRow.appendChild(dayHeader);

        const today = new Date();
        if (day.toDateString() === today.toDateString()) {
            dayHeader.classList.add("today-column");
        }
    }

    //grid.appendChild(headerRow);
    container.appendChild(headerRow);

    // --- Hour rows ---
    for (let hour = 0; hour <= 23; hour++) {
        const row = document.createElement("div");
        row.className = "week-row";

        // Time label
        const timeLabel = document.createElement("div");
        timeLabel.className = "time-label";
        timeLabel.textContent = hour === 0 ? "" : `${hour}:00`; // somehow adding "hour === 0 ? "" : " makes the first 0:00 disappear.
        row.appendChild(timeLabel);

        // 7 day columns
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement("div");
            cell.className = "week-cell";

            const cellDate = new Date(startOfWeek);
            cellDate.setDate(startOfWeek.getDate() + i);
            cellDate.setHours(hour, 0, 0, 0);

            const today = new Date();
            if (cellDate.toDateString() === today.toDateString()) {
                cell.classList.add("today-column");
            }

            // Render events in this hour slot
            events.forEach(event => {
                const eventStart = new Date(event.start_time);
                if (eventOccursOnDate(event, cellDate) && eventStart.getHours() === hour) {
                    const eventDiv = document.createElement("div");
                    eventDiv.className = "event";
                    eventDiv.textContent = event.title;
                    eventDiv.style.backgroundColor = event.color;

                    eventDiv.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm("Delete event?")) {
                            deleteEvent(event.id);
                        }
                    }
                    cell.appendChild(eventDiv);
                }
            });
            // Click to create an event at this hour
            cell.onclick = () => {
                openCreateModal(cellDate);
                /*const iso = cellDate.toISOString().slice(0, 16);
                document.getElementById("start").value = iso;
                document.getElementById("end").value = iso;*/
            };
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
    container.appendChild(grid);
    calendar.appendChild(container);
}

function renderHeader(calendar, view, date) {
    // Header
    const header = document.querySelector(".calendar-header");

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "<";
    prevBtn.onclick = () => {
        if (currentView === "month") {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
    }
    prevBtn.className = "prev-btn";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = ">";
    nextBtn.onclick = () => {
        if (currentView === "month") {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
    }
    nextBtn.className = "next-btn";
    
    const title = document.createElement("h2");
    title.textContent = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`

    header.innerHTML = ""; // Clear the header before appending, otherwise they'll stack
    header.appendChild(title);
    header.appendChild(prevBtn);
    header.appendChild(nextBtn);
}

function createViewToggle() {
    const header = document.querySelector(".navbar");
    const existing = document.getElementById("authButton");

    const wrapper = document.createElement("div");
    wrapper.className = "view-dropdown";

    wrapper.innerHTML = `
        <button id="viewButton">Month ▼</button>
        <div id="viewMenu" class="view-menu">
            <div data-view="month">Month</div>
            <div data-view="week">Week</div>
        </div>
    `;

    header.insertBefore(wrapper, existing);

    const button = document.getElementById("viewButton");
    const menu = document.getElementById("viewMenu");

    button.onclick = () => {
        menu.classList.toggle("show");
    }
    
    menu.querySelectorAll("div").forEach(item => {
        item.onclick = async () => {
            currentView = item.dataset.view;
            button.textContent = currentView === "month" ? "Month ▼" : "Week ▼";
            menu.classList.remove("show");

            await renderCalendar(currentView);
        };
    });
}

/*function editEvent(event) {
    const newTitle = prompt("Edit title:", event.title);
    if (!newTitle) return;

    fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
    }).then(() => renderCalendar());
}*/

// Helper Functions

function openCreateModal(date) {
    const modal = document.getElementById("eventModal");

    const iso = date.toISOString().slice(0, 16);

    document.getElementById("start").value = iso;
    document.getElementById("end").value = iso;

    modal.classList.remove("hidden");
}

async function deleteEvent(id) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    refreshCalendar();
}

async function refreshCalendar() {
    await loadEvents(); // refresh data from DB
    renderCalendar();
}

// Check session to see if user is logged in
async function checkSession() {
    const response = await fetch("/session");
    const data = await response.json();

    const authButton = document.getElementById("authButton");

    if (data.loggedIn) {
        authButton.textContent = "Logout";
        authButton.href = "/logout";
    } else {
        authButton.textContent = "Sign In";
        authButton.href = "login.html";
    }
}

checkSession();
document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".navbar a").forEach(el => {
        el.addEventListener("click", e => {
            const ripple = document.createElement("span");
            ripple.classList.add("ripple");

            const rect = el.getBoundingClientRect();

            ripple.style.left = `${rect.left + rect.width / 2 - 50}px`;
            ripple.style.top = `${rect.top + rect.height / 2 - 50}px`;

            document.body.appendChild(ripple);

            setTimeout(() => ripple.remove(), 500);
        });
    });

    createViewToggle();
    setupModal();
    refreshCalendar();
});
