import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";


let profilepic = document.getElementById('profile-pic');
let inputFile = document.getElementById('fileinput');
const editButton = document.getElementById('Edit');
const Bio=document.getElementById("Bio")

const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", updateProfilePage);

async function updateProfilePage() {
    const username = localStorage.getItem("loggedInUser");
    if (username) {
        try {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                document.getElementById("username").textContent = userData.username; // update header
                document.getElementById("username_Id").textContent = userData.firstName; // update profile username
            } else {
                console.error("user not found in firebase.");
            }
        } catch (error) {
            console.error("error fetching user data:", error);
        }
    } else {
        console.error("no logged-in user found.");
    }
}

profilepic.addEventListener("click",function (){
    inputFile.click()
})

inputFile.onchange = function (){

        profilepic.src = URL.createObjectURL(inputFile.files[0]);

}

editButton.addEventListener("click",()=>{
  if(Bio.disabled){
      Bio.removeAttribute("disabled"); //enable text
      editButton.textContent="Save";
  }else{
      Bio.setAttribute("disabled",true);
      editButton.textContent="Edit";
  }

})



