var password = document.getElementById("password"),
    confirm_password = document.getElementById("confirm_password");
var uid = GetURLParameter("uidb64");
var token = GetURLParameter("token");
console.log("uid: ", uid);
console.log("token: ", token);

// function validatePassword(){
//   if(password.value != confirm_password.value) {
//     confirm_password.setCustomValidity("Passwords Don't Match");
//   } else {
//     confirm_password.setCustomValidity('');
//   }
// }
//
// password.onchange = validatePassword;
// confirm_password.onkeyup = validatePassword;

$(document).on('keyup', '#confirm_password', function () {
    console.log("key up check");
    var pass = $("#password").val();
    var confirm_pass = $("#confirm_password").val();
    if(pass!=confirm_pass){
        $("#match").css('display','block');
        $("#submitBtn").prop('disabled', true);
    }else{
        $("#match").css('display','none');
        $("#submitBtn").prop('disabled', false);
    }
})

function GetURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
}
$(document).on('submit', '#msform', function (e) {
    var pass = $("#password").val();
    var confirm_pass = $("#confirm_password").val();
    console.log("Password: ", pass);
    console.log("Confirm Pass: ", confirm_pass);
    console.log("Testing");
    $.ajax({
        method: "GET",
        url: '/api/v1/checkmail/?uid='+ uid + '&token=' + token + '&pass=' + pass,
        success: function(result) {
            console.log(result);
            if(result == "Password reset done"){
                $("#msform").hide();
                swal({
                    position: 'top-end',
                    type: 'success',
                    title: 'Password changed successfully',
                    showConfirmButton: false,
                    timer: 5000
                })
            }else{
                swal({
                    position: 'top-end',
                    type: 'warning',
                    title: 'This token is not valid',
                    showConfirmButton: false,
                    timer: 5000
                })
            }

        },
        error: function(error) {
            console.log(error);
        }
    })
    e.preventDefault();
})
