



const Follow = document.getElementById('Follow');
const Follow_button = document.getElementById('Follow_button');

Follow_button.addEventListener('click', function () {

    let current_Follower = parseInt(Follow.textContent.split(": ")[1]);

    // Increment the follower count
    if(current_Follower>=0){
        current_Follower =(current_Follower===0)?current_Follower+1 :current_Follower-1;
    }


    // Update the text content
    Follow.textContent = `Followers: ${current_Follower}`;
});

