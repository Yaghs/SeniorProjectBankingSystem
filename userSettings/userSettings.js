// settings.js

document.addEventListener("DOMContentLoaded", function() {
  // Other initialization code...

  // Attach event listener to the "About Us" list item
  const aboutUsItem = document.getElementById("aboutUs");
  if (aboutUsItem) {
    aboutUsItem.addEventListener("click", function() {
      window.location.href = "aboutUs.html";
    });
  }
});


document.addEventListener("DOMContentLoaded", function() {
  // Get references to DOM elements
  const form = document.getElementById("settingsForm");
  const messageEl = document.getElementById("message");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const notificationsInput = document.getElementById("notifications");

  // Load existing settings from localStorage, if any
  const savedSettings = JSON.parse(localStorage.getItem("userSettings"));
  if (savedSettings) {
    usernameInput.value = savedSettings.username || "";
    emailInput.value = savedSettings.email || "";
    // For security reasons, we do not prefill the password field.
    notificationsInput.checked = savedSettings.notifications || false;
  }

  // Listen for form submission
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    // Get the form values
    const settings = {
      username: usernameInput.value,
      email: emailInput.value,
      // Password should normally be handled securely on the server.
      password: passwordInput.value,
      notifications: notificationsInput.checked
    };

    // Save settings in localStorage
    localStorage.setItem("userSettings", JSON.stringify(settings));

    // Provide feedback to the user
    messageEl.textContent = "Settings saved successfully!";
    messageEl.style.color = "green";

    // Clear the password field for security
    passwordInput.value = "";
  });
});