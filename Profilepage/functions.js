

let profilepic = document.getElementById('profile-pic');
let inputFile = document.getElementById('fileinput');

profilepic.addEventListener("click",function (){
    inputFile.click()
})

inputFile.onchange = function (){

        profilepic.src = URL.createObjectURL(inputFile.files[0]);

}

