{
    //Data table
    $('#pause_case').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: "/static/workflow/cases/cases_content_dummy.json",
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Case UID", "data": "id"},
            {"title": "Process", "data": "process"},
            {"title": "Task", "data": "task"},
            {"title": "Sent by", "data": "sent_by"},
            {"title": "Last Modified", "data": "last_modify"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: '15%'
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
                    return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                },
            },
        ],
        "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
            if (aData.read_status == "false") {
                $(nRow).addClass('unread');
            }
        }
    });

    var table = $('#pause_case').DataTable();
    $('#pause_case tbody').on('click', 'tr', function () {
        var data = table.row(this).data();
        var $zdmiSummary = $('#summary_button');
        var $zdmiUnpause = $('#unpause_button');
        var $zdmiReassign = $('#reassign_button');


        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiSummary.removeData('case-id').removeClass('c-black');
            $zdmiUnpause.removeData('case-id').removeClass('c-black');
            $zdmiReassign.removeData('case-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');

            $zdmiSummary.removeData("case-id").data("case-id", data.id).addClass('c-black');
            $zdmiUnpause.removeData("case-id").data("case-id", data.id).addClass('c-black');
            $zdmiReassign.removeData("case-id").data("case-id", data.id).addClass('c-black');
            $zdmiSummary.attr({
                "data-toggle": "modal",
                "data-target": ""
            });

        }
    });

    //DoubleClick
    $('#pause_case tbody').on('dblclick', 'tr', function () {
        $(this).removeClass('unread');
        var data = table.row(this).data();
        var case_id = data.id;
        alert(case_id);

    });
    //Summary
    $('#summary_button').on('click', function () {
        if ($(this).data('case-id')) {
            var case_id = $(this).data('case-id');
            var single_case_api_url = "/static/workflow/cases/cases_summary1.json/";
            $.ajax({
                type: "GET",
                url: single_case_api_url,
                success: function (data) {
                    console.log(data);
                    $('#case_property .process_name').text(data.process);
                    $('#case_property .case_title').text(data.case_title);
                    $('#case_property .case_number').text(data.case_number);
                    $('#case_property .case_status').text(data.case_status);
                    $('#case_property .case_uid').text(data.case_uid);
                    $('#case_property .creator').text(data.creator);
                    $('#case_property .create_date').text(moment(data.create_date).format('MMMM Do YYYY, h:mm:ss a'));
                    $('#case_property .last_update').text(moment(data.last_update).format('MMMM Do YYYY, h:mm:ss a'));


                    $('#current_task .last_update').text(data.task);
                    $('#current_task .current_user').text(data.current_user);
                    $('#current_task .task_delegate_date').text(moment(data.task_delegate_date).format('MMMM Do YYYY, h:mm:ss a'));
                    $('#current_task .task_init_date').text(moment(data.task_init_date).format('MMMM Do YYYY, h:mm:ss a'));
                    $('#current_task .task_due_date').text(moment(data.task_due_date).format('MMMM Do YYYY, h:mm:ss a'));
                    $('#current_task .task_finish_date').text(data.finish_date);

                    $('#summary_modal').modal().show();
                },
                error: function (response) {
                    console.log(response);
                }
            });

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });

    //UnPaused Button onclick
    $('#unpause_button').on('click', function () {
        //alert($(this).data('case-id'));
        if ($(this).data('case-id')) {
            console.log($(this).data('case-id'));
            //datatable refresh need
        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });


    //Modal hidden clear form
    $('#pause_modal').on('hidden.bs.modal', function () {
        //alert("ok");
        $('#pause_case_form').trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
    });

    //Reassign Button onclick
    $('#reassign_button').on('click', function () {
        //alert($(this).data('case-id'));
        if ($(this).data('case-id')) {

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });

    //Unselect row
    $('#pause_case_paginate').on('click', function () {
        if ($('#pause_case').find('.selected').length) {

            $('#summary_button').removeData('case-id').removeClass('c-black');
            $('#unpause_button').removeData('case-id').removeClass('c-black');

            $('#pause_case tbody tr').removeClass('selected');
        }
    });
}
