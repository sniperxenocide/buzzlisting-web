{
    /*------- ajax call loader ------*/
    $(document).bind("ajaxSend", function () {
        $('.loader').show();
    }).bind("ajaxStop", function () {
        $('.loader').hide();
    });

    var $application_list = $('#application_list'),
        $dtTbl = $('#draft_case'),
        $summary_modal = $('#summary_modal'),
        $summary_button = $('#summary_button'),
        $open_button = $('#open_button'),
        $comment_write = $('#new_comment').find('textarea'),
        $pre_comment = $('.comment_side').find('.pre_comment'),
        $comment_count_span = $('#comment_count'),
        $query_count_span = $application_list.find('#query_count'),
        $common_case_form = $('#common_case_form');

    //functions
    // function GeneralInfoCall(deleid) {
    //     $.ajax({
    //         url: general_info + deleid,
    //         method: "GET",
    //         dataType: "JSON",
    //         success: function (data) {
    //             var $target = $('#general_info');
    //             var $case_tab = $($target).find('#case_property'),
    //                 $current_tab = $($target).find('#current_task');
    //             $case_tab.find('.process_name').text(data.process_name);
    //             $case_tab.find('.case_number').text(data.number);
    //             $case_tab.find('.case_status').text(StatusName(data.status, data.additional_status));
    //             $case_tab.find('.creator').text(data.init_user_name);
    //             $case_tab.find('.create_date').text(moment(data.created_at).format('MMMM Do YYYY, h:mm a'));
    //             $case_tab.find('.last_update').text(moment(data.updated_at).format('MMMM Do YYYY, h:mm a'));
    //
    //             $current_tab.find('.task').text(data.delegation[0].task);
    //             $current_tab.find('.current_user').text(data.delegation[0].user);
    //             $current_tab.find('.task_init_date').text(moment(data.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a'));
    //             $current_tab.find('.task_due_date').text(moment(data.delegation[0].delegation_due_date).format('MMMM Do YYYY, h:mm a'));
    //             $current_tab.find('.task_finish_date').text(data.delegation[0].delegation_finish_date);
    //         },
    //         error: function (response) {
    //             $.each(JSON.parse(response.responseText), (k, v) => {
    //                 notify('Sorry!!! ', v.detail, '', 'danger', 5000)
    //             });
    //         }
    //     });
    // }

    // function StatusName(status, additional_status) {
    //     var status_name;
    //     if (status == 1) {
    //         status_name = "Todo"
    //     } else if (status == 2) {
    //         status_name = "Open"
    //     } else if (status == 0) {
    //         status_name = "Complete"
    //     } else if (status == 3) {
    //         status_name = "Non Claimed"
    //     }
    //     if(additional_status != null){
    //         if(additional_status == 1){
    //             additional_status = 'Recheck';
    //         }else if(additional_status == 0){
    //             additional_status = 'Reject'
    //         }else{
    //             additional_status = '';
    //         }
    //         status_name = status_name + " (" + additional_status + ")"
    //     }else if(additional_status == null && status == 0){
    //         status_name = status_name + " (Approved)"
    //     }
    //     return status_name;
    // }

    /* Sidebar application Count Update*/
    function SidebarCount() {
        $.ajax({
            url: $app_count,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                $('#sidebar').find('#zmdi-inbox').html("<i class='zmdi zmdi-inbox'></i> Inbox (" + data.todo + ")");
                $('#sidebar').find('#zmdi-edit').html("<i class='zmdi zmdi-edit'></i> Draft (" + data.open + ")");
                $('#sidebar').find('#zmdi-forward').html("<i class='zmdi zmdi-forward'></i> Non Claimed (" + data.non_claimed + ")");
                $('#sidebar').find('#zmdi-check-square').html("<i class='zmdi zmdi-check-square'></i> Completed (" + data.completed + ")");
            },
            error: function (response) {
                console.log(response)
            }
        });
    }

    //Data table
    var draftdt = $dtTbl.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: draft_app + "?item_status=open",
            pages: 1
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        order: [[5, 'desc']],
        columns: [
            {"title": "App ID", "data": "app_number"},
            {"title": "Project", "data": "project_name"},
            {"title": "Task", "data": "task_name"},
            {"title": "Sent by", "data": "sent_by"},
            {"title": "Due Date", "data": "due_date"},
            {"title": "Init Date", "data": "init_date"},
            // {"title": "Priority", "data": "priority"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: '20%'
            },
            {
                targets: 1,
                width: '20%',
            },
            {
                targets: 2,
                width: '20%',
            },
            {
                targets: 3,
                width: '20%',
            },
            {
                targets: 4,
                width: '20%',
                "render": (data) => {
                    var due_date = new Date(data);
                    var current_date = new Date();
                    if (current_date < due_date) {
                        return "<span>" +
                            moment(data).format('MMMM Do YYYY, h:mm a')
                            + "</span>"
                    } else {
                        return "<span class='c-lightRed'>" +
                            moment(data).format('MMMM Do YYYY, h:mm a')
                            + "</span>"
                    }
                },
            },
            {
                targets: 5,
                width: '20%',
                visible: false,
                "render": (data, a, b) => {
                    var due_date = new Date(data);
                    var current_date = new Date();
                    return "<span>"
                        + moment(data).format('MMMM Do YYYY, h:mm a')
                        + "</span>"
                },
            },
            // {
            //     targets: 5,
            //     width: '20%',
            //     "render": (data) => {
            //         if (data == 1) {
            //             return "<i class='zmdi zmdi-star f-15' title='Prioroty'></i>" +
            //                 " <i class='zmdi zmdi-star-outline f-15'></i> " +
            //                 "<i class='zmdi zmdi-star-outline f-15'></i>"
            //         } else if (data == 2) {
            //             return "<i class='zmdi zmdi-star f-15' title='Prioroty'></i> " +
            //                 "<i class='zmdi zmdi-star f-15'></i>" +
            //                 " <i class='zmdi zmdi-star-outline f-15'></i>"
            //
            //         } else if (data == 3) {
            //             return "<i class='zmdi zmdi-star f-15' title='Prioroty'></i>" +
            //                 "<i class='zmdi zmdi-star f-15'></i> " +
            //                 "<i class='zmdi zmdi-star f-15'></i>"
            //
            //         } else {
            //             return "--"
            //         }
            //
            //     },
            // }
        ],
        language: {
            "emptyTable": "You have no draft"
        },
    });

    //Row Single click
    var table = $dtTbl.DataTable();
    $dtTbl.find('tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        var $summary_button = $('#summary_button');
        var $open_button = $('#open_button');
        var $pause_button = $('#pause_button');
        var $zdmiReassign = $('#reassign_button');
        var $delete_button = $('#delete_button');

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $summary_button.removeData('case-id').removeClass('c-black').removeData("comment_count");
            $open_button.removeData('case-id').removeClass('c-black');
            $pause_button.removeData('case-id').removeClass('c-black');
            $zdmiReassign.removeData('case-id').removeClass('c-black');
            $delete_button.removeData('case-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');

            $summary_button.removeData("case-id").data("case-id", data.app_id).addClass('c-black');
            $summary_button.removeData("comment_count").data("comment_count", data.comment_count);
            $summary_button.data("query_count", data.query_count);
            $delete_button.removeData("case-id").data("case-id", data.id).addClass('c-black');
            $pause_button.removeData("case-id").data("case-id", data.app_id).addClass('c-black');
            $open_button.removeData("case-id").data("case-id", data.app_id).addClass('c-black');
        }
    });

    //DoubleClick
    $dtTbl.find('tbody').on('dblclick', 'tr', function () {
        $(this).removeClass('unread');
        var data = table.row(this).data();
        var task_id = data.task;
        var application_id = data.application;
        CommonFormSet(task_id, application_id);
    });

    //Summary
    $('#summary_button').off('click').on('click', function () {
        if ($(this).data('case-id')) {
            var id = $(this).data('case-id');
            $('a[data-toggle="tab"]').off('shown.bs.tab').on('shown.bs.tab', function (e) {
                var $target = $(e.target).attr("href");
                //alert(target);
                if (($target === '#general_info')) {
                    GeneralInfoCall(id);
                }
                else if ($target === '#generated_document') {
                    GeneratedDocumentCall(id)
                }
                else if ($target === '#process_map') {
                    ProcessMapCall(id)
                }
                else if ($target === '#upload_doc') {
                    UploadDocumentCall(id);
                }
                else if ($target === '#comment_tab') {
                    CommentCall(id);
                }
                else if ($target === '#query_tab') {
                    QueryCall(id)
                }
            });
            $('.tab-nav a[href="#general_info"]').tab('show');
            $summary_modal.find('.printing_button').off('click.fang').on('click.fang', function () {
                window.open("/printer/app_view/" + id, "PrintWindow");
            });
            $summary_modal.find($comment_count_span).text($(this).data('comment_count'));
            $summary_modal.find($query_count_span).text($(this).data('query_count'));
            $summary_modal.modal().show();

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });

     //open
    $('#open_button').off('click').on('click', function () {
        if ($(this).data('case-id')) {
            $('#draft_case tr.selected').dblclick();

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });

    //Delete Case
    $(document).on('click', '#delete_button', function () {
        var delete_app_id = $(this).data('case-id');
        //alert(delete_app_id);
        var table_selected_row = $dtTbl.find(".selected");
        if ($(this).data('case-id')) {

            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this Application Information!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
            }).then(function (isConfirm) {
                if (isConfirm) {
                    $.ajax({
                        type: "DELETE",
                        url: delegation + delete_app_id,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            notify('Congratulations!!! ', 'Application has been Deleted Successfully', '', 'success', 5000);
                            draftdt.clearPipeline().draw();
                            SidebarCount()
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
            notify('No Case selected!!! ', 'Please select a Case first', '', 'danger');
        }
    });

    //For modal second open bug fix
    $summary_modal.on('show.bs.modal', function () {
        var id = $summary_button.data('case-id');
        GeneralInfoCall(id);
    });

    //Unselect row
    $(document).ready(function () {
        $('#draft_case_paginate').on('click', function () {
            if ($dtTbl.find('.selected').length) {

                $('#summary_button').removeData('case-id').removeData("comment_count").removeClass('c-black');
                $('#pause_button').removeData('case-id').removeClass('c-black');
                $('#delete_button').removeData('case-id').removeClass('c-black');

                $('#draft_case tbody tr').removeClass('selected');
            }
        });
    });
}
