{
    /*------- ajax call loader ------*/
    $(document).bind("ajaxSend", function () {
        $('.loader').show();
    }).bind("ajaxStop", function () {
        $('.loader').hide();
    });

    var $dtTbl = $('#inbox_case'),
        $summary_button = $('#summary_button'),
        $pause_button = $('#pause_button'),
        $summary_modal = $('#summary_modal'),
        $comment_write = $('#new_comment').find('textarea'),
        $pre_comment = $('.comment_side').find('.pre_comment'),
        $query_count_span = $('#query_count'),
        $comment_count_span = $('#comment_count');

    //functions
    function GeneralInfoCall(deleid) {
        $.ajax({
            url: general_info + deleid,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                var $target = $('#general_info');
                var $case_tab = $($target).find('#case_property'),
                    $current_tab = $($target).find('#current_task');
                $case_tab.find('.process_name').text(data.process_name);
                $case_tab.find('.case_number').text(data.number);
                $case_tab.find('.case_status').text(StatusName(data.status, data.additional_status));
                $case_tab.find('.creator').text(data.init_user_name);
                $case_tab.find('.create_date').text(moment(data.created_at).format('MMMM Do YYYY, h:mm a'));
                $case_tab.find('.last_update').text(moment(data.updated_at).format('MMMM Do YYYY, h:mm a'));

                $current_tab.find('.task').text(data.delegation[0].task);
                $current_tab.find('.current_user').text(data.delegation[0].user);
                $current_tab.find('.task_init_date').text(moment(data.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a'));
                $current_tab.find('.task_due_date').text(moment(data.delegation[0].delegation_due_date).format('MMMM Do YYYY, h:mm a'));
                $current_tab.find('.task_finish_date').text(data.delegation[0].delegation_finish_date);
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    //console.log(v);
                    notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                });
            }
        });
    }

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

    function QueryInfo(success_data) {
        var html = '';
        return html = `<tr data-query-id="${success_data.id}">
                <td>${success_data.query}</td>
                <td>${success_data.user_from_name}</td>
                <td>${success_data.date}</td>
                <td>${success_data.user_to_name}</td>
                <td>${success_data.query_answer ? success_data.query_answer : `--`}</td>
                <td>${success_data.answer_date ? success_data.answer_date : `--`}</td>
            </tr>`;
    }

    //Data table
    $dtTbl.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: todo_app + "?item_status=non_claimed",
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        order: [[4, 'desc']],
        columns: [
            {"title": "App ID", "data": "app_number"},
            {"title": "Process", "data": "project_name"},
            {"title": "Task", "data": "task_name"},
            {"title": "Sent by", "data": "sent_by"},
            {"title": "Due Date", "data": "due_date"},
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
                "render": (data, a, b) => {
                    var due_date = new Date(data);
                    var current_date = new Date();
                    if (current_date < due_date) {
                        return "<span>"
                            + moment(data).format('MMMM Do YYYY, h:mm a')
                            + "</span>"
                    } else {
                        return "<span class='c-lightRed'>"
                            + moment(data).format('MMMM Do YYYY, h:mm a')
                            + "</span>"
                    }
                },
            }
        ],
        language: {
            "emptyTable": "You have no Non Claimed Application"
        },
        "fnRowCallback": function (nRow, aData) {
            if (aData.read_status == "false") {
                $(nRow).addClass('unread');
            }
        }
    });


    //Select Row of DataTable
    $dtTbl.find('tbody').on('click', 'tr', function () {
        var table = $dtTbl.DataTable(),
            data = table.row(this).data();
        //console.log(data);
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $summary_button.removeData('case-id').removeClass('c-black').removeData('comment_count');
            $summary_button.removeData('case-id').removeClass('c-black').removeData('query_count');
            $pause_button.removeData('case-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');

            $summary_button.removeData("case-id").data("case-id", data.app_id).addClass('c-black').data("comment_count", data.comment_count);
            $summary_button.data("query_count", data.query_count);
            $pause_button.removeData("case-id").data("case-id", data.app_id).addClass('c-black');
        }
    });


    //DoubleClick
    $dtTbl.find('tbody').on('dblclick', 'tr', function () {
        var table = $dtTbl.DataTable();
        $(this).removeClass('unread');
        var data = table.row(this).data();
        var task_id = data.task;
        var application_id = data.application;
        var project_id = data.project;
        var process_name = data.process;

        // var $form_data = $claim_user_assign_form[0];
        let $formData = {};
        $formData.application = application_id;
        $formData.task = task_id;
        $formData.project = project_id;
        $formData.process = process_name;
        $formData.next_pos = 1;
        $formData.claiming = 'true';
        $formData.claimed_user = cliamable_user;
        $.ajax({
            url: '//' + location.host + '/api/v1/workflow/application/',
            method: 'POST',
            data: $formData,
            success: (data) => {
                console.log("data", data);
                swal({
                    title: "Good Job",
                    text: "<p class='f-500'>Next Task: " + data.target + "</p><p class='f-500'>Next User: " + data.user + "</p>",
                    type: "success",
                    showCancelButton: false,
                    confirmButtonText: "Continue",
                    allowOutsideClick: false
                }).then(function (isConfirm) {
                    if (isConfirm) {
                        location.reload();
                    } else {
                        return false;
                    }
                });
            },
            error: (res) => {
                console.log(res);
                $.each(JSON.parse(res.responseText), (k, v) => {
                    notify('Sorry!! ', v, '', 'danger', 10000);
                });
            }
        });

        /*$.get(`/api/v1/workflow/task_op/?project=${data.project}&process=${data.process}&task=${data.task_element_id}`, (res) => {
         $claimed_user.empty();
         $claimed_user.selectpicker('refresh');
         $claimed_user.append($('<option>', {
         value:"",
         text: "Nothing Selected",
         }));
         $.each(res.all_users, function (i, d) {
         $claimed_user.append($('<option>', {
         value: d.id,
         text: d.first_name + d.last_name,
         }));
         $claimed_user.selectpicker('refresh');
         $user_assign_modal.modal().show();

         $save_user.off('click').on('click', function (e) {
         e.preventDefault();
         let process_form = $claim_user_assign_form.parsley();
         process_form.validate();
         if (process_form.isValid()) {
         var $form_data = $claim_user_assign_form[0];
         var $formData = new FormData($form_data);
         $formData.append("application", application_id);
         $formData.append("task", task_id);
         $formData.append("project", project_id);
         $formData.append("process", process_name);
         $formData.append("next_pos", 1);
         $formData.append("claiming", 'true');
         $.ajax({
         url: 'http://' + location.host + '/api/v1/workflow/application/',
         method: 'POST',
         data: $formData,
         processData: false,
         contentType: false,
         success: (data) => {
         console.log("data", data);
         swal({
         title: "Good Job",
         text: "<p class='f-500'>Next Task: " + data.target + "</p><p class='f-500'>Next User: " + data.user + "</p>",
         type: "success",
         showCancelButton: false,
         confirmButtonText: "Continue",
         allowOutsideClick: false
         }).then(function (isConfirm) {
         if (isConfirm) {
         location.reload();
         } else {
         return false;
         }
         });
         },
         error: (res) => {
         console.log(res);
         $.each(JSON.parse(res.responseText), (k, v) => {
         notify('Sorry!! ', v, '', 'danger', 10000);
         });
         }
         });

         }


         })
         });
         });*/
    });


    //Summary
    $summary_button.off('click').on('click', function () {
        if ($(this).data('case-id')) {
            var id = $(this).data('case-id');
            $('a[data-toggle="tab"]').off('shown.bs.tab').on('shown.bs.tab', function (e) {
                var $target = $(e.target).attr("href");
                //alert(target);
                if (($target === '#general_info')) {
                    GeneralInfoCall(id);
                }else if ($target === '#generated_document') {
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

    //
    // //Paused Button onclick
    // $pause_button.on('click', function () {
    //     if ($(this).data('case-id')) {
    //         $pause_modal.modal().show();
    //     } else {
    //         notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
    //     }
    // });
    // $unpause_time.datetimepicker({
    //     format: 'YYYY-MM-DD hh:mm',
    //     useCurrent: true,
    //     minDate: moment()
    // });
    //
    //
    // //Pause Save Submit
    // $pause_submit.on('click', (e) => {
    //     let pause_case_form = $pause_case_form.parsley();
    //
    //     e.preventDefault();
    //     pause_case_form.validate();
    //     if (pause_case_form.isValid()) {
    //         var $pause_form_data = {
    //             unpause_time: $unpause_time.val(),
    //             reason: $('#reason').val(),
    //             notify_user: $("#notify_user").is(':checked') ? true : false,
    //         };
    //         //console.log($pause_form_data);
    //     }
    // });
    //
    //
    // //Modal hidden clear form
    // $pause_modal.on('hidden.bs.modal', function () {
    //     //alert("ok");
    //     $pause_case_form.trigger('reset');
    //     $(".help-block").empty();
    //     $('.form-group').removeClass('has-error');
    //     $('.fg-line').removeClass('fg-toggled');
    // });

    //For modal second open bug fix
    $summary_modal.on('show.bs.modal', function () {
        var id = $summary_button.data('case-id');
        GeneralInfoCall(id);
    });

    //Unselect row
    $('#inbox_case_paginate').on('click', function () {
        if ($dtTbl.find('.selected').length) {

            $summary_button.removeData('announcement-id').removeClass('c-black');
            $pause_button.removeData('case-id').removeClass('c-black').removeData('comment_count');
            $pause_button.removeData('case-id').removeClass('c-black').removeData('query_count');

            $dtTbl.find('tbody tr').removeClass('selected');
        }
    });


}
