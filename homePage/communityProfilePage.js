document.addEventListener("DOMContentLoaded", () => {
    const joinButton = document.getElementById("joinButton");
    const discussionTab = document.getElementById("discussionTab");
    const membersList = document.getElementById("membersList");
    const reviewsList = document.getElementById("reviewsList");

    let isMember = localStorage.getItem("isCommunityMember") === "true";
    updateJoinButton();

    joinButton.addEventListener("click", () => {
        isMember = !isMember;
        localStorage.setItem("isCommunityMember", isMember);
        updateJoinButton();
    });

    function updateJoinButton() {
        joinButton.textContent = isMember ? "Leave" : "Join";
        discussionTab.style.display = isMember ? "block" : "none";
    }

    fetchCommunityData();

    async function fetchCommunityData() {
        try {
            const response = await fetch("/api/communityData");
            const data = await response.json();
            displayMembers(data.members);
            displayReviews(data.reviews);
        } catch (error) {
            console.error("Error fetching community data:", error);
        }
    }

    function displayMembers(members) {
        membersList.innerHTML = "";
        members.forEach(member => {
            const memberItem = document.createElement("div");
            memberItem.classList.add("member-item");
            memberItem.textContent = member;
            membersList.appendChild(memberItem);
        });
    }

    function displayReviews(reviews) {
        reviewsList.innerHTML = "";
        reviews.forEach(review => {
            const reviewItem = document.createElement("div");
            reviewItem.classList.add("review-item");
            reviewItem.textContent = review;
            reviewsList.appendChild(reviewItem);
        });
    }
});