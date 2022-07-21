var $delegate_modal = $('#delegate_modal'),
    $add_delegate_modal = $('#add_delegate_modal'),
    $edit_delegate_modal = $('#edit_delegate_modal');

function DelegateInfo(success_data) {
    var html = '';
    return html = `<tr data-delegate-id="${success_data.id}">
                <td>${success_data.user_in_action_name}</td>
                <td>${success_data.start_date}</td>
                <td>${success_data.end_date}</td>
                <td>
                    <button type="button" class="edit_delegate btn bgm-amber waves-effect"><i
                                class="zmdi zmdi-edit"></i>
                        </button>
                    <button type="button" class="delete_delegate btn btn-danger waves-effect">
                                        <i class="zmdi zmdi-delete c-white"></i>
                                        </button>
                </td>
            </tr>`;
}


$(document).on('click', '#delegate', function (e) {
    e.preventDefault();
    $('#delegate_show_table tbody').find('tr').not('.empty_delegation_row').remove();
    $('#delegate_show_table tbody').find('.empty_delegation_row').show();
    $delegate_modal.modal().show();
    // Assigned Delegate
    $.ajax({
        type: "GET",
        url: delegate_url + '?user_id=' + userId,
        dataType: "json",
        success: function (data) {
            if (data.length > 0) {
                $('#delegate_show_table').find('.empty_delegation_row').hide();
                $.each(data, function (i, d) {
                    $('#delegate_show_table tbody').append(DelegateInfo(d));
                });

                $('#add_delegate_button').prop('disabled', true);
            } else {
                $('#delegate_show_table').find('.empty_delegation_row').show();
                $('#add_delegate_button').removeAttr('disabled');
            }
        },
        error: function (response) {
            $('#delegate_show_table').find('.empty_delegation_row').show();
            $('#add_delegate_button').removeProp('disabled');
            $.each(JSON.parse(response.responseText), (k, v) => {
                console.log(k, v)
            });
        }
    });
});

$(document).on('click', '#add_delegate_button', function (e) {
    e.preventDefault();
    //Form Reset
    $('#add_delegate_form').trigger('reset');
    $("#add_delegate_form .help-block").empty();
    $('#add_delegate_form .form-group').removeClass('has-error');
    $("#to_duty option[value]").remove();

    $add_delegate_modal.modal().show();

    //Users List
    $.ajax({
        type: "GET",
        url: available_delegate_list + '?user_id=' + userId,
        dataType: "json",
        success: function (data) {
            $.each(data, function (i, d) {
                $("#to_duty").append($('<option>', {
                    value: d.id,
                    text: d.name,
                }));
            });
            $("#to_duty").selectpicker('refresh');
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
            });
        }
    });

    // Date range picker
    var $duration = $('input[name="duration"]');
    $duration.daterangepicker({
        autoUpdateInput: true,
        locale: {
            cancelLabel: 'Clear'
        },
        minDate: new Date(),
    });

    $duration.on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
        //     $('#duration_').data('daterangepicker').startDate._d;
    });

    $duration.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
});

$(document).on('click', '#delegate_save_button_', function (e) {
    e.preventDefault();
    //validation
    let process_form = $('#add_delegate_form').parsley();
    process_form.validate();
    if (process_form.isValid()) {
        // Make Data
        var $data = {
            activation_date: moment($('#duration_').data('daterangepicker').startDate._d).format('YYYY/MM/DD'),
            expiry_date: moment($('#duration_').data('daterangepicker').endDate._d).format('YYYY/MM/DD'),
            from_duty: userId,
            to_duty: $('#to_duty').val(),
            is_edit: '0',
        };


        // post data
        $.ajax({
            url: delegate_url + '?user_id=' + userId,
            method: 'POST',
            data: JSON.stringify($data),
            "processData": false,
            "headers": {
                "content-type": "application/json",
            },
            success: (data) => {
                notify('Congratulations!!! ', 'Delegate Added Successfully', '', 'success');
                $('#delegate_show_table').find('.empty_delegation_row').hide();
                $('#delegate_show_table tbody').append(DelegateInfo(data[0]));
                $('#add_delegate_button').prop('disabled', true);
                $add_delegate_modal.modal('hide');
            },
            error: (res) => {
                $.each(JSON.parse(res.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });
    }


});

$(document).on('click', '.delete_delegate', function (e) {
    e.preventDefault();
    var this_row = $(this).closest('tr');
    var this_id = this_row.attr('data-delegate-id');

    $.ajax({
        type: "Delete",
        url: delegate_url + this_id,
        dataType: "json",
        success: function (data) {
            notify('', data.detail, '', 'success', 5000);
            this_row.remove();
            if ($('#delegate_show_table tbody').find('tr').length = 1) {
                $('#delegate_show_table tbody').find('.empty_delegation_row').show();
                $('#add_delegate_button').removeAttr('disabled');
            }
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                console.log(k, v)
            });
        }
    });
});

$(document).on('click', '.edit_delegate', function (e) {
    e.preventDefault();
    var this_row = $(this).closest('tr');
    var this_id = this_row.attr('data-delegate-id');
    //Form Reset
    $('#edit_delegate_form').trigger('reset');
    $("#edit_delegate_form .help-block").empty();
    $('#edit_delegate_form .form-group').removeClass('has-error');
    $("#_to_duty_ option[value]").remove();

    $edit_delegate_modal.modal().show();
    // $('#edit_delegate_form').append("<input id='_delegation_id_' hidden value='" + this_id + "'>");
    $('#edit_delegate_form').find('#_delegation_id_').val(this_id);

    //Users List
    $.ajax({
        type: "GET",
        url: available_delegate_list + '?user_id=' + userId,
        dataType: "json",
        success: function (data) {
            $.each(data, function (i, d) {
                $("#_to_duty_").append($('<option>', {
                    value: d.id,
                    text: d.name,
                }));
            });
            $("#_to_duty_").selectpicker('refresh');
            // $('#_to_duty_').selectpicker('val', data);
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
            });
        }
    });

    //Get saved delegate info
    $.ajax({
        type: "GET",
        url: delegate_url + this_id,
        dataType: "json",
        success: function (data) {
            $('#_to_duty_').selectpicker('val', data.user_in_action_id);
            // Date range picker
            var $duration = $('input[name="duration"]');
            $duration.daterangepicker({
                autoUpdateInput: true,
                locale: {
                    cancelLabel: 'Clear',
                    format: 'YYYY-MM-DD'
                },
                startDate: data.start_date,
                endDate: data.end_date,
                // minDate: new Date(),
            });

            $duration.on('apply.daterangepicker', function (ev, picker) {
                $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
                //     $('#duration_').data('daterangepicker').startDate._d;
            });

            $duration.on('cancel.daterangepicker', function (ev, picker) {
                $(this).val('');
            });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
            });
        }
    });


});

$(document).on('click', '#delegate_edit_button_', function (e) {
    e.preventDefault();
    //validation
    let process_form = $('#edit_delegate_form').parsley();
    process_form.validate();
    if (process_form.isValid()) {
        var delegation_id = $('#_delegation_id_').val();
        // Make Data
        // var $data = {
        //     activation_date: moment($('#_duration_').data('daterangepicker').startDate._d).format('YYYY/MM/DD'),
        //     expiry_date: moment($('#_duration_').data('daterangepicker').endDate._d).format('YYYY/MM/DD'),
        //     from_duty: userId,
        //     to_duty: $('#_to_duty_').find("option:selected").val(),
        //     is_edit: '1',
        //     delegation_id: delegation_id,
        // };

        //post data
        $.ajax({
            url: delegate_url + '?user_id=' + userId,
            method: 'POST',
            data: JSON.stringify({
                activation_date: moment($('#_duration_').data('daterangepicker').startDate._d).format('YYYY/MM/DD'),
                expiry_date: moment($('#_duration_').data('daterangepicker').endDate._d).format('YYYY/MM/DD'),
                from_duty: userId,
                to_duty: $('#_to_duty_').find("option:selected").val(),
                is_edit: '1',
                delegation_id: delegation_id,
            }),
            "processData": false,
            "headers": {
                "content-type": "application/json",
            },
            success: (data) => {
                notify('Congratulations!!! ', 'Information Updated Successfully', '', 'success');
                $("#delegate_show_table tbody tr[data-delegate-id='" + delegation_id + "']").remove();
                $('#delegate_show_table tbody').append(DelegateInfo(data[0]));
                $edit_delegate_modal.modal('hide');
            },
            error: (res) => {
                $.each(JSON.parse(res.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });
    }


});