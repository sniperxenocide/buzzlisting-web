{
    var
        $targetAudience = $('#targetAudience'),
        $groupUser = $("#groupUser"),
        $select_list = $('.select_list'),
        $announcement_submit = $('#announcement_submit'),
        $message = $('#message'),
        $dtTbl = $('#announcemet_list'),
        $zdmiSummary = $('#summary_button'),
        $zdmiDelete = $('#delete_announcement_button'),
        $summary_modal = $('#summary_modal'),
        $reset_button = $('#reset_button'),
        $write = $('#write');

    $(document).bind("ajaxSend", function () {
        $('.loader').show();
    }).bind("ajaxStop", function () {
        $('.loader').hide();
    });

    if(userRole == 1){
        $write.show();
    }


    $('.note-editable').css("height", "100px")
    $targetAudience.on('change', function () {
        if ($(this).val() == "1") {
            $.ajax({
                type: "GET",
                url: all_user_api,
                dataType: "json",
                success: function (data) {
                    $select_list.css("display", "block");
                    $('.empty_label').css("display", "none");
                    $groupUser.find("option[value]").remove();
                    $.each(data, function (i, d) {
                        $groupUser.append($('<option>', {
                            value: d.id,
                            text: d.first_name + ' ' + d.last_name + ' (' + d.username + ')',
                        }));
                    });
                    $groupUser.selectpicker('refresh');
                },
                error: function (response) {
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
        else if ($(this).val() == "2") {
            $.ajax({
                type: "GET",
                url: all_group_api,
                dataType: "json",
                success: function (data) {
                    $select_list.css("display", "block");
                    $('.empty_label').css("display", "none");
                    $groupUser.find("option[value]").remove();
                    $.each(data, function (i, d) {
                        $groupUser.append($('<option>', {
                            value: d.id,
                            text: d.name,
                        }));
                    });
                    $groupUser.selectpicker('refresh');
                },
                error: function (response) {
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
        else if ($(this).val() == "3" || $(this).val() == "") {
            $('.empty_label').css("display", "block").text('All users has been selected');
            $select_list.css("display", "none");
        }


    });

    //Announcement Submition
    $announcement_submit.on('click', function (e) {
        e.preventDefault();
        var form_data = {},
            str = String($($message.val()).html());
        if ($($message.val()).text() == "" && str.search("img") < 1) {
            notify('Sorry!! ', 'Please fill the announcement message', '', 'danger', '5000');
            return
        } else {
            form_data.message = $message.val();
        }
        if ($targetAudience.val() == "" || null) {
            notify('Sorry!! ', 'Select Target Audience', '', 'danger', '5000');
            return
        } else {
            form_data.type = $targetAudience.val();
        }
        if ($select_list.css("display") == "block") {
            if (($groupUser.val() == null)) {
                notify('Sorry!! ', 'Select Groups/ Users', '', 'danger', '5000');
                return
            } else {
                if ($targetAudience.val() == 1) {
                    form_data.user = $groupUser.val();
                }
                else if ($targetAudience.val() == 2) {
                    form_data.group = $groupUser.val();
                }
            }
        }

        $.ajax({
            url: "/api/v1/announcement/",
            method: 'POST',
            data: JSON.stringify(form_data),
            "processData": false,
            "headers": {
                "content-type": "application/json",
            },
            success: (data) => {
                //console.log(data);
                notify('Congratulations!!! ', 'Announcement send Successfully', '', 'success');
                setTimeout(function () {
                    location.reload();
                }, 1500);
                /*Reset form*/
                /*$('#announcement_form').trigger('reset');
                 $('#targetAudience, #groupUser').val('').selectpicker('refresh');
                 $select_list.css("display", "none");
                 $message.code('').val('<p></p>');
                 $select_list.css("display", "none");*/
            },
            error: (res) => {
                // console.log(res);
                $.each(JSON.parse(res.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });
    });

    /*----------- Reset Button ------------*/
    /*$reset_button.on('click', function (e) {
     e.preventDefault();
     $('#announcement_form').trigger('reset');
     $('#targetAudience, #groupUser').val('').selectpicker('refresh');
     $select_list.css("display", "none");
     $message.code('').val('<p></p>');
     $select_list.css("display", "none");
     });*/

    /*-------------Data Table------------*/
    $dtTbl.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: all_announcement_api,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Target Audience", "data": "type"},
            {"title": "Message", "data": "message"},
            {"title": "Date", "data": "date"}
        ],
        order: [[2, 'desc']],
        columnDefs: [
            {
                targets: 0,
                width: "25%",
                render: (data, a, b) => {
                    var number, return_data;
                    if (data == 1 || data == 3) {
                        number = b.user.length
                        return_data = data == 1 ? "User" + " (" + number + ")" : "All User" + " (" + number + ")";
                        return_data = "<span title='" + b.audience + "'>" + return_data + "<span>"
                        return return_data
                    } else if (data == 2) {
                        number = b.groups_name.length
                        return_data = "Group" + " (" + number + ")";
                        return_data = "<span title='" + b.groups_name + "'>" + return_data + "<span>"
                        return return_data
                    }
                }
            },
            {
                targets: 1,
                width: "55%",
                render: (data) => {
                    var message = "<div class='custom'>" + $('<div/>').html(data).text() + ""
                    return message
                }
            },
            {
                targets: 2,
                width: "20%",
                "render": (data) => {
                    return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                }
            }
        ],
    });

    var table = $dtTbl.DataTable();
    $dtTbl.find('tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        // console.log(data.id);
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiSummary.removeData('announcement-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $zdmiSummary.removeData("announcement-id").data("announcement-id", data.id).addClass("c-black");
        }
    });

    function GetSummaryModalData(announcement_id) {
        $.ajax({
            type: "GET",
            url: all_announcement_api + announcement_id,
            success: function (data) {

                if (data.type == 1) {
                    $summary_modal.find('.modal-title').text("Users");
                } else if (data.type == 2) {
                    $summary_modal.find('.modal-title').text("Groups");
                } else if (data.type == 3) {
                    $summary_modal.find('.modal-title').text("All Users");
                } else {
                    $summary_modal.find('.modal-title').text("No Audience found");
                }

                $summary_modal.find('.message').html($('<div/>').html(data.message).text());
                $summary_modal.find('.modal-header small').text(moment(data.date).format('MMMM Do YYYY, h:mm:ss a'));
                if (data.groups_name.length > 0) {
                    $summary_modal.find('.recipients small').css('display', 'block').text(data.groups_name);
                } else {
                    $summary_modal.find('.recipients small').css('display', 'none');
                }

                $.each(data.audience, function (key, value) {
                    $summary_modal.find('.recipients ul').append("<li>" +
                        value + "</li>")
                });
                $('#summary_modal').modal().show();
            },
            error: function (response) {
                // console.log(response);
            }
        });
        $summary_modal.modal().show();
    }

    /*-------------Data table Double Click ------------*/
    $dtTbl.find('tbody').on('dblclick', 'tr', function () {
        var announcement_id = table.row(this).data().id;
        GetSummaryModalData(announcement_id);
    });

    /*-------------Summary------------*/
    $zdmiSummary.on('click', function () {
        var table_selected_row = $dtTbl.find(".selected");
        if ($(this).data('announcement-id')) {
            var announcement_id = $(this).data('announcement-id');
            GetSummaryModalData(announcement_id)
        } else {
            notify('No Row selected!!! ', 'Please select a row first', '', 'danger', '5000');
        }
    });

    /*-------------Summary Modal Hide------------*/
    $summary_modal.on('hidden.bs.modal', function () {
        $summary_modal.find('.modal-title').text("");
        $summary_modal.find('.message').html("");
        $summary_modal.find('small').text("");
        $summary_modal.find('.recipients ul').empty()
    });

    /*-------------Delete------------*/
    $zdmiDelete.on('click', function () {
        var table_selected_row = $dtTbl.find(".selected");
        if ($(this).data('announcement-id')) {
            var delete_announcement_url = "";
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this Announcement information!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
            }).then(function (isConfirm) {

            });
        } else {
            notify('No Row selected!!! ', 'Please select a row first', '', 'danger', '5000');
        }
    });

    /*------------Unselect row-------------*/
    $('#announcemet_list_paginate').on('click', function () {
        if ($dtTbl.find('.selected').length) {

            $zdmiSummary.removeData('announcement-id').removeClass('c-black');

            $dtTbl.find('tbody tr').removeClass('selected');
        }
    });
}
