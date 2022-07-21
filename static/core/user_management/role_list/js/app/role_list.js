{
    //Data table
    $('#role_list').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: all_role,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Name", "data": 'name'},
            {"title": "Code", "data": "code"},
            {"title": "Assigned User", "data": "user_count"},
            {"title": "Status", "data": "active"}
        ],
        columnDefs: [
            {
                targets: 0,
                width: "25%",
            },
            {
                targets: 1,
                width: "25%"
            },
            {
                targets: 2,
                width: "25%"
            },
            {
                targets: 3,
                width: "25%",
                render: (data) => {
                    if (data == true) {
                        return 'Active';
                    } else {
                        return 'Inactive'
                    }
                }
            }
        ]
    });

    var table = $('#role_list').DataTable();
    $('#role_list tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        var $zdmiEdit = $('#edit_role_button');
        var $zdmiDelete = $('#delete_role_button');

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiDelete.removeData('role-id').removeClass('c-black');
            $zdmiEdit.removeData('role-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $zdmiDelete.removeData("role-id").data("role-id", data.id);
            $zdmiEdit.removeData("role-id").data("role-id", data.id);
            if ($zdmiDelete.data("role-id") == 1) {
                $zdmiDelete.removeClass("c-black");
            } else {
                $zdmiDelete.addClass("c-black")
            }
            if ($zdmiEdit.data("role-id") == 1) {
                $zdmiEdit.removeClass("c-black");
            } else {
                $zdmiEdit.addClass("c-black")
            }
            $zdmiDelete.attr({
                "data-toggle": "modal",
                "data-target": ""
            });

            $zdmiEdit.attr({
                "data-toggle": "modal",
                "data-target": ""
            });

        }
    });


    //Add Role Modal
    $(document).on('click', '#add_role_button', function () {
        //  Permission boostrape selece
        $.ajax({
            type: "GET",
            url: all_permissions_api,
            dataType: "json",
            success: function (data) {
                //alert("ok");
                //console.log(data);
                $.each(data, function (i, d) {
                    $("#permission_select").append($('<option>', {
                        value: d.id,
                        text: d.name,
                    }));
                });
                $("#permission_select").selectpicker('refresh');
            },
            error: function (response) {
                console.log(response);
            }
        });

        $('#add_role_modal').modal().show();
    });
    //End Add Role Modal

    // Add Role Form submit
    $('#save_role').on('click', (e) => {
        e.preventDefault();
        let process_form = $('#add_role_form').parsley();
        process_form.validate();
        if (process_form.isValid()) {
            var datatable = $('#role_list').DataTable();
            $.ajax({
                url: add_role_api,
                method: 'POST',
                data: $('#add_role_form').serialize(),
                success: (data) => {
                    notify('Congratulations!!! ', 'Role added Successfully', '', 'success');
                    setTimeout(function () {
                        location.reload();
                    }, 1500);

                    /*$('#add_role_form').trigger('reset');
                    $('#add_role_modal').modal('toggle');*/
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
    });
    // End Add Role

    //Delete Role
    $(document).on('click', '#delete_role_button', function () {
        var delete_role_id = $(this).data('role-id');
        //alert(delete_role_id);
        var table_selected_row = $('#role_list').find(".selected");
        if ($(this).data('role-id')) {
            if (delete_role_id === 1) {
                notify('Sorry!!! ', 'System can not delete Workflow Admin!!!', '', 'danger');
            } else {
                var delete_role_url = "/api/v1/role/" + delete_role_id;
                delete_role_id = "";
                swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this Role Information!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Delete",
                    cancelButtonText: "Cancel",
                }).then(function (isConfirm) {
                    if (isConfirm) {
                        $.ajax({
                            type: "DELETE",
                            url: delete_role_url,
                            processData: false,
                            contentType: false,
                            success: function (data) {
                                //var data_table = $('#role_list').DataTable();
                                //table.rows( '.selected' ).remove().draw();
                                table_selected_row.remove().draw();
                                notify('Congratulations!!! ', 'Role has been Deleted Successfully', '', 'success');
                            },
                            error: function (response) {
                                var errors = response.responseText;
                                $.each(JSON.parse(errors), function (key, value) {
                                    var nMessage = key.toUpperCase() + ": " + value;
                                    notify('', nMessage, '', 'danger', 5000);
                                });
                                /*$.each(JSON.parse(response), function (key, value) {
                                 var nMessage = key + ": " + value;
                                 notify('', nMessage, '', 'danger');
                                 });*/
                            }
                        });
                    } else {
                        return false;
                    }
                });
            }
        } else {
            notify('No Role selected!!! ', 'Please select a Role first', '', 'danger');
        }
    });
    //End Delete role

    //Edit Role button Click
    $(document).on('click', '#edit_role_button', function () {
        //alert("ok");
        if ($(this).data('role-id')) {
            var role_id = $(this).data('role-id');
            if (role_id == 1) {
                notify('Sorry!!! ', 'You can not edit this role!!!', '', 'danger', 5000);
            } else {
                var edit_role_api = "/api/v1/role/" + role_id;
                var assigned_permissions;
                $.ajax({
                    type: "GET",
                    url: edit_role_api,
                    success: function (data) {
                        assigned_permissions = (data.permission);
                        $('#name').val(data.name);
                        $('#code').val(data.code);

                        //  Status
                        $("#active").selectpicker('refresh');
                        $('#active').selectpicker('val', [data.active]);

                        //  Permission boostrape selece
                        $.ajax({
                            type: "GET",
                            url: all_permissions_api,
                            dataType: "json",
                            success: function (data) {
                                $.each(data, function (i, d) {
                                    $("#permission_edit_select").append($('<option>', {
                                        value: d.id,
                                        text: d.name,
                                    }));
                                });
                                $("#permission_edit_select").selectpicker('refresh');
                                $('#permission_edit_select').selectpicker('val', assigned_permissions);
                            },
                            error: function (response) {
                                console.log(response);
                            }
                        });
                        //   End Permission boostrape selece

                    },
                    error: function (response) {
                    }
                });
                $('#edit_role_modal').modal().show();
            }
        } else {
            notify('No Role selected!!! ', 'Please select a Role first', '', 'danger', 5000);
        }
    });

    //Edit Role Form Submit
    let update_role = $('#update_role_form').parsley();
    $('#update_role').on('click', (e) => {

        e.preventDefault();
        //alert("ok");
        update_role.validate();
        if (update_role.isValid()) {
            var role_id = $('#edit_role_button').data('role-id');
            var edit_role_patch = "/api/v1/role/" + role_id + "/";
            $.ajax({
                url: edit_role_patch,
                method: 'PATCH',
                data: $('#update_role_form').serialize(),
                success: (data) => {
                    notify('Congratulations!!! ', 'Information has been Updated Successfully', '', 'success');
                    setTimeout(function () {
                        location.reload();
                    }, 1500);
                    /*$('#update_role_form').trigger('reset');
                    $('#edit_role_modal').modal('toggle');*/
                    //console.log(data);
                    /*var table = $('#role_list').DataTable();
                     table.row.add({
                     "name": data.name,
                     "code": data.code,
                     "active": data.active,
                     }).draw();*/

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
    $('#add_role_modal').on('hidden.bs.modal', function () {
        $('#add_role_form').trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
        $("#permission_select option[value]").remove();
    });
    $('#edit_role_modal').on('hidden.bs.modal', function () {
        //alert("ok");
        $('#update_role_form').trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');

        $("#permission_edit_select option[value]").remove();
        //$("#permission_edit_select").selectpicker('refresh');


    });
    $('#permissions_list_modal').on('hidden.bs.modal', function () {
        $('#permission_list').empty();
    });

    //pagination button on click remove data-role-id from actions
    $(document).on('click', '.paginate_button', function () {

        if ($('#role_list').find('.selected').length > 0) {
            $('#edit_role_button').removeData('role-id').removeClass('c-black');
            $('#delete_role_button').removeData('role-id').removeClass('c-black');

            $('#role_list tbody tr').removeClass('selected');
        } else {

        }
    });

    //DoubleClick Summery
    $('#role_list tbody').on('dblclick', 'tr', function () {
        var data = table.row(this).data();
        var role_id = data.id;
        //alert(data.id);
        var permissions_list = "/api/v1/role/" + role_id;
        $.ajax({
            type: "GET",
            url: permissions_list,
            success: function (data) {
                $.each(data.permission_name, function (i, d) {
                    $("#permission_list").append(
                        '<li class="c-black">' + d +
                        '</li>');
                });

                $('#permissions_list_modal').modal().show();
            },
            error: function (response) {
                console.log(response);
            }
        });
    });
    //End summary User

}
