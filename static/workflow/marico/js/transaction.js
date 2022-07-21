(function () {
    let tr_add_form_ = $('#tr_add_form_'),
        tr_add_form_validation_ = tr_add_form_.parsley();

    $('.add_transaction_button_').click((e) => {
        e.preventDefault();
        $('.fg-line.fg-toggled').removeClass('fg-toggled');
        $('#tr_add_form_').trigger("reset");
        $('#transaction_info_modal_').modal();
    });

    $('#tr_save_button_').click(() => {
        tr_add_form_validation_.validate();

        if (tr_add_form_validation_.isValid()) {
            let tr_add_form_data_ = new FormData(tr_add_form_[0]);
            tr_add_form_data_.append("application", $('[name="application"]').val());

            $.ajax({
                url: '/api/v1/workflow/transaction/',
                method: 'POST',
                contentType: false,
                cache: false,
                processData: false,
                data: tr_add_form_data_,
                "success": function (res) {
                    var template = doT.template($('#transactionAttachmentRow').html());
                    $('#transaction_row').empty();
                    $('#transactionTable tbody').append(template(res));
                    $('#transaction_info_modal_').modal('hide');
                    notify('', 'Transaction added successfully', '', 'success', 2000);
                }
            })
        }
    });
    $(document).on('click', '.delete-transaction-attachment', function (e) {
        e.preventDefault();
        var attachment_id = $(this).closest('tr').data('attachment-id');
        console.log(attachment_id);

        $.ajax({
            method: 'DELETE',
            url: '/api/v1/workflow/transaction/' + attachment_id + '/',
            success: function (res) {
                console.log(res);
                $('#transactionTable').find('tr[data-attachment-id="' + attachment_id + '"]').remove();
            },
            error: function (res) {
                console.log(res);
            }
        })
    });
})();
