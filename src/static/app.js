document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // always bypass browser cache so the latest data comes back
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // clear dropdown so we don't append duplicate options when refreshing
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list HTML (if any)
        const participantsHTML = details.participants.length
          ? `<div class="participants">
               <strong>Participants:</strong>
               <ul class="participant-list">
                 ${details.participants
                   .map(
                     p =>
                       `<li><span class="participant-email">${p}</span><button class="remove-btn" data-activity="${name}" data-email="${p}" title="Unregister">&times;</button></li>`
                   )
                   .join("")}
               </ul>
             </div>`
          : `<div class="participants"><em>No one has signed up yet.</em></div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities(); // refresh the list
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle unregister clicks using event delegation
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove-btn")) {
      const email = event.target.dataset.email;
      const activity = event.target.dataset.activity;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          await fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "An error occurred";
          messageDiv.className = "error";
        }
      } catch (error) {
        messageDiv.textContent = "Failed to unregister. Please try again.";
        messageDiv.className = "error";
        console.error("Error unregistering:", error);
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
