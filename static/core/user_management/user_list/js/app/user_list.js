{
    //Data table
    $('#users_list').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: all_user,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Name", "data": "first_name"},
            {"title": "User Name", "data": "username"},
            {"title": "Email", "data": "email"},
            {"title": "Role", "data": "role_name"},
            {"title": "Status", "data": "status"}
        ],
        columnDefs: [
            {
                targets: 0,
                width: "35%",
                "render": (data, a, b) => {
                    return b.first_name + ' ' + b.last_name ;
                }
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
                width: "20%"
            },
            {
                targets: 4,
                width: "20%",
                render: (data) => {
                    if (data == 0) {
                        return 'Inactive';
                    } else if (data == 1) {
                        return 'Active';
                    } else if (data == 2) {
                        return 'Vacation';
                    } else if (data == 3) {
                        return 'Expired';
                    } else {
                        return 'Status not set yet'
                    }
                }
            }
        ],
    });

    var table = $('#users_list').DataTable();
    $('#users_list tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        var $zdmiDelete = $('#sa-params');
        var $zdmiEdit = $('#edit_button');
        var $zdmiSummary = $('#summary_button');
        //var $zdmiadd = $('#add_user_button');


        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiDelete.removeData('user-id').removeClass('c-black');
            $zdmiEdit.removeData('user-id').removeClass('c-black');
            $zdmiSummary.removeData('user-id').removeClass('c-black');
            //$zdmiadd.addClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            //$zdmiadd.removeClass('c-black');
            $zdmiDelete.removeData("user-id").data("user-id", data.id);
            if ($zdmiDelete.data("user-id") == 1) {
                $zdmiDelete.removeClass("c-black");
            } else {
                $zdmiDelete.addClass("c-black")
            }
            $zdmiDelete.attr({
                "data-toggle": "modal",
                "data-target": ""
            });
            $zdmiEdit.removeData("user-id").data("user-id", data.id).addClass('c-black');
            $zdmiEdit.attr({
                "data-toggle": "modal",
                "data-target": ""
            });
            $zdmiSummary.removeData("user-id").data("user-id", data.id).addClass('c-black');
            $zdmiSummary.attr({
                "data-toggle": "modal",
                "data-target": ""
            });

        }
    });

    $('#button').click(function () {
        table.row('.selected').remove().draw(false);
    });

    //  Add User
    $(document).on('click', '#add_user_button', function () {
        window.location = add_user;
        /*if($(this).hasClass('c-black')){
         window.location = add_user;
         }else {

         }*/

    });
    //End Add User

    //Delete User
    $(document).on('click', '#sa-params', function () {
        var delete_user_id = $(this).data('user-id');
        var table_selected_row = $('#users_list').find(".selected");
        if ($(this).data('user-id')) {
            if (delete_user_id === 1) {
                notify('Sorry!!! ', 'System can not delete Admin!!!', '', 'danger');
            } else {
                var delete_user_url = "/api/v1/user/" + delete_user_id;
                delete_user_id = "";
                swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this User information!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Delete",
                    cancelButtonText: "Cancel",
                }).then(function (isConfirm) {
                    if (isConfirm) {
                        $.ajax({
                            type: "DELETE",
                            url: delete_user_url,
                            processData: false,
                            contentType: false,
                            success: function (data) {
                                table_selected_row.remove();
                                notify('Congratulations!!! ', 'User has been Deleted Successfully', '', 'success');

                            },
                            error: function (response) {
                                $.each(JSON.parse(errors), function (key, value) {
                                    var nMessage = key + ": " + value;
                                    notify('', nMessage, '', 'danger');
                                });
                            }
                        });
                    } else {
                        return false;
                    }
                });
            }
        } else {
            notify('No user selected!!! ', 'Please select a user first', '', 'danger');
        }
    });
    //End Delete User

    // Summary User
    $(document).on('click', '#summary_button', function () {
        var summary_user_id = $(this).data('user-id');
        var table_selected_row = $('#users_list').find(".selected");
        if ($(this).data('user-id')) {
            var summary_user_url = "/api/v1/user/" + summary_user_id;
            $.ajax({
                type: "GET",
                url: summary_user_url,
                success: function (data) {
                    //alert(data);
                    var join = moment(data.date_joined).format('MMMM Do YYYY, h:mm:ss a');
                    var join1 = moment(data.date_joined).fromNow();
                    var ex_date = moment(data.expiry_date).format('MMMM Do YYYY, h:mm:ss a');
                    var ex_date1 = moment(data.expiry_date).fromNow();
                    var status;
                    var replaced_by_name;
                    if (data.status == 0) {
                        status = 'Inactive';
                    } else if (data.status == 1) {
                        status = 'Active';
                    } else if (data.status == 2) {
                        status = 'Vacation';
                    } else if (data.status == 3) {
                        status = 'Expired';
                    } else {
                        status = '';
                    }
                    /*if(data.replaced_by){
                     var single_user = "/api/v1/user/" + data.replaced_by;
                     $.ajax({
                     type: "GET",
                     url: single_user,
                     dataType: "json",
                     success: function (data) {
                     replaced_by_name = data.first_name + " " + data.last_name;
                     $('#summary_modal .replaced_by').text(replaced_by_name);
                     replaced_by_name = "";
                     }
                     });
                     }else{
                     $('#summary_modal .replaced_by').text("");
                     }*/
                    $('#summary_modal .full_name').text(data.first_name + ' ' + data.last_name);
                    $('#summary_modal .username').text(data.username);
                    $('#summary_modal .email').text(data.email);
                    $('#summary_modal .address').text(data.address);
                    $('#summary_modal .role_name').text(data.role_name);
                    $('#summary_modal .position').text(data.position);
                    $('#summary_modal .status').text(status);
                    if (data.avatar) {
                        $('#summary_modal .avatar').attr("src", data.avatar);
                    } else {
                        $('#summary_modal .avatar').attr("src", "/static/img/user_img.jpg");
                    }

                    $('#summary_modal .phone_number').text(data.phone_number);
                    $('#summary_modal .date_joined ').text(join + ' ( ' + join1 + ' )');
                    $('#summary_modal .expiry_date').text(ex_date + ' ( ' + ex_date1 + ' )');
                    //groups
                    var groups_name = '';
                    $.each(data.group, function (key, value) {
                        //alert(value);
                        groups_name = groups_name + ' ' + value + ',';
                    });
                    $('#summary_modal .groups').text(groups_name);

                    $('#summary_modal').modal().show();
                },
                error: function (response) {
                    //console.log(response);
                }
            });
        } else {
            notify('No user selected!!! ', 'Please select a user first', '', 'danger');
        }
    });

    //DoubleClick Summery
    $('#users_list tbody').on('dblclick', 'tr', function () {
        var data = table.row(this).data();
        var summary_user_id = data.id;
        var summary_user_url = "/api/v1/user/" + summary_user_id;
        $.ajax({
            type: "GET",
            url: summary_user_url,
            success: function (data) {
                //console.log(data);
                var join = moment(data.date_joined).format('YYYY-MM-DD hh:mm');
                var join1 = moment(data.date_joined).fromNow();
                var ex_date = moment(data.expiry_date).format('YYYY-MM-DD hh:mm');
                var ex_date1 = moment(data.expiry_date).fromNow();
                var status;
                var replaced_by_name;
                if (data.status == 0) {
                    status = 'Inactive';
                } else if (data.status == 1) {
                    status = 'Active';
                } else if (data.status == 2) {
                    status = 'Vacation';
                } else if (data.status == 3) {
                    status = 'Expired';
                } else {
                    status = '';
                }
                $('#summary_modal .full_name').text(data.first_name + ' ' + data.last_name);
                $('#summary_modal .username').text(data.username);
                $('#summary_modal .email').text(data.email);
                $('#summary_modal .address').text(data.address);
                $('#summary_modal .role_name').text(data.role_name);
                $('#summary_modal .position').text(data.position);
                $('#summary_modal .status').text(status);
                if (data.avatar) {
                    $('#summary_modal .avatar').attr("src", data.avatar);
                } else {
                    $('#summary_modal .avatar').attr("src", "/static/img/user_img.jpg");
                }
                //$('#summary_modal .avatar').attr("src",data.avatar);
                $('#summary_modal .phone_number').text(data.phone_number);
                $('#summary_modal .date_joined ').text(join + ' ( ' + join1 + ' )');
                $('#summary_modal .expiry_date').text(ex_date + ' ( ' + ex_date1 + ' )');

                //groups
                var groups_name = '';
                $.each(data.group, function (key, value) {
                    //alert(value);
                    groups_name = groups_name + ' ' + value + ',';
                });
                $('#summary_modal .groups').text(groups_name);

                $('#summary_modal').modal().show();
            },
            error: function (response) {
                //console.log(response);
            }
        });
    });
    //End summary User


    //Edit User
    $(document).on('click', '#edit_button', function () {
        if ($(this).data('user-id')) {
            var user_id = $(this).data('user-id');
            var edit_location = "/admin/user/edit_user/" + user_id;
            window.location = edit_location;
        } else {
            notify('No user selected!!! ', 'Please select a user first', '', 'danger');
        }
    });
    //End Edit User


    //pagination button on click remove data-user-id from actions
    $(document).on('click', '.paginate_button', function () {
        if ($('#users_list').find('.selected').length > 0) {

            $('#sa-params').removeData('user-id').removeClass('c-black');
            $('#edit_button').removeData('user-id').removeClass('c-black');
            $('#summary_button').removeData('user-id').removeClass('c-black');
            //$('#add_user_button').addClass('c-black');

            $('#users_list tbody tr').removeClass('selected');
        } else {

        }
    });
    //Container and Main on click remove data-user-id from actions
    //DONE BY MAMUN VAI
    /*$(document).click(function (event) {
     var context = $(event.target).parent().get('context');
     console.log(event.target.id);
     /!*console.log(event.target.className);*!/
     if(event.target.id == 'main' || event.target.className == 'container'){

     $('#sa-params').removeData('user-id').removeClass('c-black');
     $('#edit_button').removeData('user-id').removeClass('c-black');
     $('#summary_button').removeData('user-id').removeClass('c-black');
     //$('#add_user_button').addClass('c-black');

     $('#users_list tbody tr').removeClass('selected');
     }
     });*/
}
