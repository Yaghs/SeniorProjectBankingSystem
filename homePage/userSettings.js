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
document.addEventListener("DOMContentLoaded", function (){
const CommunitiesIveJoined = document.getElementById("communities");
if(CommunitiesIveJoined){
  CommunitiesIveJoined.addEventListener("click", function (){
    window.location.href = "myCommunities.html";
  });
}
});

document.addEventListener("DOMContentLoaded", function (){
  const HelpCenterPage = document.getElementById("helpCenter");
  if(HelpCenterPage){
    HelpCenterPage.addEventListener("click", function (){
      window.location.href = "helpCenter.html"
    });
  }
});

document.addEventListener("DOMContentLoaded", function() {
  // Attach event listener to the "Account Center" list item
  const accountCenterItem = document.getElementById("accountCenter");
  if (accountCenterItem) {
    accountCenterItem.addEventListener("click", function() {
      window.location.href = "accountCenter.html";
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

document.getElementById('logOut').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('signOutModal').style.display = 'block';
});

// Hide the modal when Cancel is clicked
document.getElementById('cancelSignOut').addEventListener('click', function() {
  document.getElementById('signOutModal').style.display = 'none';
});

// Redirect to login&create.html when Sign Out is confirmed
document.getElementById('confirmSignOut').addEventListener('click', function() {
  window.location.href = "../login%26create/login%26create.html";
});