/**
 * Created by mrityunjoy on 3/23/17.
 */
//-----------------Send Test Mail----------
let test_mail_form = $("#mail_settings_form");
$("#test_mail_btn").on('click', function () {
    let test_mail_parsley = test_mail_form.parsley();
    test_mail_parsley.validate();
    if (test_mail_parsley.isValid()) {
        let data = {};
        data.to = $("#to").val();
        console.log(data.to);
        data.subject = $("#sub").val();
        data.message = $("#mail_message").val();
        $.ajax({
            url: '/admin/mail/test_mail/',
            method: "POST",
            data: data,
            success: function (res) {
                $('#mail_settings_form').trigger('reset');
                $('#mail_modal').modal('hide');
                notify('Congratulation', 'Mail sent successfully', '', 'success', 5000)
            },
            error: function (res) {
                let errors = res.responseText;
                $.each(JSON.parse(errors), function (key, value) {
                    let nMessage = value;
                    notify('', nMessage, '', 'danger', 5000);
                });
            }
        });
    }

});