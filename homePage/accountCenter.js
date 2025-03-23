// accountCenter.js
document.addEventListener("DOMContentLoaded", function() {
  // Username Section
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameLink = document.getElementById("changeUsernameLink");
  const usernameEdit = document.querySelector(".username-edit");
  const usernameInput = document.getElementById("usernameInput");
  const confirmButton = document.getElementById("confirmButton");

  // Retrieve username from localStorage or use a default
  let currentUsername = localStorage.getItem("loggedInUser") || "DefaultUser";
  usernameDisplay.textContent = currentUsername;
  usernameInput.value = currentUsername;

  // Switch to username edit mode on click
  changeUsernameLink.addEventListener("click", function(e) {
    e.preventDefault();
    usernameDisplay.style.display = "none";
    changeUsernameLink.style.display = "none";
    usernameEdit.style.display = "flex";
    usernameInput.focus();
  });

  // Confirm username change and revert back to display mode
  confirmButton.addEventListener("click", function() {
    const newUsername = usernameInput.value.trim();
    if (newUsername !== "") {
      currentUsername = newUsername;
      usernameDisplay.textContent = currentUsername;
      localStorage.setItem("loggedInUser", currentUsername);
    }
    usernameEdit.style.display = "none";
    usernameDisplay.style.display = "inline";
    changeUsernameLink.style.display = "inline";
  });

  // Password Section
  const changePasswordLink = document.getElementById("changePasswordLink");
  const passwordEdit = document.querySelector(".password-edit");
  const confirmPasswordButton = document.getElementById("confirmPasswordButton");
  const passwordInput = document.getElementById("passwordInput");
  const passwordSuccessMessage = document.getElementById("passwordSuccessMessage");
  const togglePassword = document.getElementById("togglePassword");

  // Switch to password edit mode on click
  changePasswordLink.addEventListener("click", function(e) {
    e.preventDefault();
    changePasswordLink.style.display = "none";
    passwordEdit.style.display = "flex";
    passwordInput.focus();
  });

  // Toggle the password field visibility using Font Awesome icons
  togglePassword.addEventListener("click", function() {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = "password";
      togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  // Confirm password change and display success message
  confirmPasswordButton.addEventListener("click", function() {
    // (In a real application, you would validate and update the password here)
    passwordEdit.style.display = "none";
    // Clear the password field for security
    passwordInput.value = "";
    passwordInput.type = "password"; // Reset back to password type
    togglePassword.innerHTML = '<i class="fas fa-eye"></i>'; // Reset icon
    passwordSuccessMessage.style.display = "block";
    // After 5 seconds, hide the success message and revert to clickable option
    setTimeout(function() {
      passwordSuccessMessage.style.display = "none";
      changePasswordLink.style.display = "inline";
    }, 5000);
  });
});