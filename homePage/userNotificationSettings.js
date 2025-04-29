document.addEventListener("DOMContentLoaded", function() {

  const messagesToggle = document.getElementById("messagesToggle");
  messagesToggle && messagesToggle.addEventListener("change", function() {
    console.log("Messages toggled:", messagesToggle.checked);
  });

  const followersToggle = document.getElementById("followersToggle");
  followersToggle && followersToggle.addEventListener("change", function() {
    console.log("Followers toggled:", followersToggle.checked);
  });

  const commentsToggle = document.getElementById("commentsToggle");
  commentsToggle && commentsToggle.addEventListener("change", function() {
    console.log("Comments toggled:", commentsToggle.checked);
  });

  const likesToggle = document.getElementById("likesToggle");
  likesToggle && likesToggle.addEventListener("change", function() {
    console.log("Likes toggled:", likesToggle.checked);
  });
});