{
    //Data table
    $('#group_list').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: all_group_api,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Name", "data": 'name'},
            {"title": "Status", "data": "status"},
            {"title": "Assigned User Number", "data": "user"}
        ],
        columnDefs: [
            {
                targets: 0,
                width: "30%",
            },
            {
                targets: 1,
                width: "30%",
                render: (data) => {
                    if (data == true) {
                        return 'Active';
                    } else {
                        return 'Inactive'
                    }
                }
            },
            {
                targets: 2,
                width: "30%",
                render: (data, a, b) => {
                    return b.user.length;
                }
            }
        ],
        language: {
            "emptyTable": "No Group found"
        }
    });

    var table = $('#group_list').DataTable();
    $('#group_list tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        var $zdmiEdit = $('#edit_group_button');
        var $zdmiDelete = $('#delete_group_button');

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiDelete.removeData('group-id').removeClass('c-black');
            $zdmiEdit.removeData('group-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $zdmiDelete.removeData("group-id").data("group-id", data.id);

            $zdmiDelete.addClass("c-black")

            $zdmiDelete.attr({
                "data-toggle": "modal",
                "data-target": ""
            });
            $zdmiEdit.removeData("group-id").data("group-id", data.id).addClass('c-black');
            $zdmiEdit.attr({
                "data-toggle": "modal",
                "data-target": ""
            });

        }
    });


    //Add Group Modal
    $(document).on('click', '#add_group_button', function () {
        //  User boostrape selece
        $.ajax({
            type: "GET",
            url: all_user_api,
            dataType: "json",
            success: function (data) {
                //alert("ok");
                $.each(data, function (i, d) {
                    $("#user_select").append($('<option>', {
                        value: d.id,
                        text: d.first_name + ' ' + d.last_name + ' (' + d.username + ')',
                    }));
                });
                $("#user_select").selectpicker('refresh');
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });

        $('#add_group_modal').modal().show();
    });
    //End Add Group Modal

    // Add Group Form submit
    $('#save_group').on('click', (e) => {
        e.preventDefault();
        let process_form = $('#add_group_form').parsley();
        process_form.validate();
        if (process_form.isValid()) {
            var datatable = $('#group_list').DataTable();
            $.ajax({
                url: add_group_api,
                method: 'POST',
                data: $('#add_group_form').serialize(),
                success: (data) => {
                    notify('Congratulations!!! ', 'Group Added Successfully ', ' ', 'success');
                    setTimeout(function () {
                        location.reload();
                    }, 1500);
                    /*$('#add_group_form').trigger('reset');
                     $('#add_group_modal').modal('toggle');*/
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
    });
    // End Add Group

    //Delete Group
    $(document).on('click', '#delete_group_button', function () {
        var delete_group_id = $(this).data('group-id');
        //alert(delete_group_id);
        var table_selected_row = $('#group_list').find(".selected");
        if ($(this).data('group-id')) {
            var delete_group_url = "/api/v1/group/" + delete_group_id;
            delete_group_id = "";
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this Group Information!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
            }).then(function (isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        type: "DELETE",
                        url: delete_group_url,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            table_selected_row.remove().draw();
                            notify('Congratulations!!! ', 'Group has been Deleted Successfully', '', 'success');
                        },
                        error: function (response) {
                            var errors = response.responseText;
                            $.each(JSON.parse(errors), function (key, value) {
                                var nMessage = key.toUpperCase() + ": " + value;
                                notify('', nMessage, '', 'danger', 5000);
                            });
                        }
                    });
                } else {
                    return false;
                }
            });
        } else {
            notify('No Group selected!!! ', 'Please select a Group first', '', 'danger');
        }
    });
    //End Delete Group

    //Edit Group button Click
    $(document).on('click', '#edit_group_button', function () {
        //alert("ok");
        if ($(this).data('group-id')) {
            var group_id = $(this).data('group-id');
            var edit_group_api = "/api/v1/group/" + group_id;
            var assigned_users;
            $.ajax({
                type: "GET",
                url: edit_group_api,
                success: function (data) {
                    assigned_users = data.user;
                    $('#name').val(data.name);

                    //  Status
                    $("#status").selectpicker('refresh');
                    $('#status').selectpicker('val', [data.status]);


                    //  Permission boostrape selece
                    $.ajax({
                        type: "GET",
                        url: all_user_api,
                        dataType: "json",
                        success: function (data) {
                            $.each(data, function (i, d) {
                                $("#user_edit_select").append($('<option>', {
                                    value: d.id,
                                    text: d.first_name + ' ' + d.last_name + ' (' + d.username + ')',
                                }));
                            });
                            $("#user_edit_select").selectpicker('refresh');
                            $('#user_edit_select').selectpicker('val', assigned_users);
                        },
                        error: function (response) {
                            $.each(JSON.parse(errors), function (key, value) {
                                var nMessage = key + ": " + value;
                                notify('', nMessage, '', 'danger');
                            });
                        }
                    });
                    //   End Permission boostrape selece

                },
                error: function (response) {
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
            $('#edit_group_modal').modal().show();
        } else {
            notify('No Group selected!!! ', 'Please select a Group first', '', 'danger', 5000);
        }
    });

    //Edit Role Form Submit
    let update_group = $('#update_group_form').parsley();
    $('#update_group').on('click', (e) => {
        e.preventDefault();
        update_group.validate();
        if (update_group.isValid()) {
            var group_id = $('#edit_group_button').data('group-id');
            var edit_group_patch = "/api/v1/group/" + group_id + "/";

            var group_form_data = {
                name: $('#name').val(),
                status: $('#status').val(),
                user: $('#user_edit_select').val() != null ? $('#user_edit_select').val() : [],
            };
            $.ajax({
                url: edit_group_patch,
                method: 'PATCH',
                data: JSON.stringify(group_form_data),
                "processData": false,
                "headers": {
                    "content-type": "application/json",
                },
                success: (data) => {
                    notify('Congratulations!!! ', 'Information has been Updated Successfully', '', 'success');
                    setTimeout(function () {
                        location.reload();
                    }, 1500);
                    /*$('#update_group_form').trigger('reset');
                    $('#edit_group_modal').modal('toggle');*/
                    /*var table = $('#group_list').DataTable();
                     table.row.add({
                     "name": data.name,
                     "code": data.code,
                     "active": data.active,
                     }).draw();*/
                    //console.log(data);
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
    });

    //modal close reset form
    $('#add_group_modal').on('hidden.bs.modal', function () {
        $('#add_group_form').trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
        $("#user_select option[value]").remove();
        $("#add_status").selectpicker('refresh');
        $('#add_status').selectpicker('val', ["true"]);
    });
    $('#edit_group_modal').on('hidden.bs.modal', function () {
        $('#update_group_form').trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
        $("#user_edit_select option[value]").remove();
    });
    $('#user_list_modal').on('hidden.bs.modal', function () {
        $('#user_list').empty();
    });

    //pagination button on click remove data-group-id from actions
    $(document).on('click', '.paginate_button', function () {

        if ($('#group_list').find('.selected').length > 0) {
            $('#edit_group_button').removeData('group-id').removeClass('c-black');
            $('#delete_group_button').removeData('group-id').removeClass('c-black');

            $('#group_list tbody tr').removeClass('selected');
        } else {

        }
    });

    //DoubleClick Summery
    $('#group_list tbody').on('dblclick', 'tr', function () {
        var data = table.row(this).data();
        var group_id = data.id;
        //alert(data.id);
        var group_list = "/api/v1/group/" + group_id;
        $.ajax({
            type: "GET",
            url: group_list,
            success: function (data) {
                if (data.user_detail.length > 0) {
                    $.each(data.user_detail, function (i, d) {
                        $("#user_list").append(
                            '<li>' + d +
                            '</li>');
                    });
                } else {
                    $("#user_list").append(
                        '<p>' + "Sorry!!! No User Assigned yet" +
                        '</p>');
                }


                $('#user_list_modal').modal().show();
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });
    });
    //End summary User

}
