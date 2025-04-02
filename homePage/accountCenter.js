


document.addEventListener("DOMContentLoaded", function() {
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameLink = document.getElementById("changeUsernameLink");
  const usernameEdit = document.querySelector(".username-edit");
  const usernameInput = document.getElementById("usernameInput");
  const confirmButton = document.getElementById("confirmButton");

  let currentUsername = localStorage.getItem("loggedInUser") || "DefaultUser";
  usernameDisplay.textContent = currentUsername;
  usernameInput.value = currentUsername;

  changeUsernameLink.addEventListener("click", function(e) {
    e.preventDefault();
    usernameDisplay.style.display = "none";
    changeUsernameLink.style.display = "none";
    usernameEdit.style.display = "flex";
    usernameInput.focus();
  });

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

  const changePasswordLink = document.getElementById("changePasswordLink");
  const passwordEdit = document.querySelector(".password-edit");
  const confirmPasswordButton = document.getElementById("confirmPasswordButton");
  const passwordInput = document.getElementById("passwordInput");
  const passwordSuccessMessage = document.getElementById("passwordSuccessMessage");
  const togglePassword = document.getElementById("togglePassword");

  changePasswordLink.addEventListener("click", function(e) {
    e.preventDefault();
    changePasswordLink.style.display = "none";
    passwordEdit.style.display = "flex";
    passwordInput.focus();
  });

  togglePassword.addEventListener("click", function() {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = "password";
      togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  confirmPasswordButton.addEventListener("click", function() {
    passwordEdit.style.display = "none";
    passwordInput.value = "";
    passwordInput.type = "password";
    togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    passwordSuccessMessage.style.display = "block";
    // After 5 seconds, hide the success message and revert to clickable option
    setTimeout(function() {
      passwordSuccessMessage.style.display = "none";
      changePasswordLink.style.display = "inline";
    }, 5000);
  });
});
