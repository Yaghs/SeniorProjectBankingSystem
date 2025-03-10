

let profilepic = document.getElementById('profile-pic');
let inputFile = document.getElementById('fileinput');
const editButton = document.getElementById('Edit');
const Bio=document.getElementById("Bio")

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



