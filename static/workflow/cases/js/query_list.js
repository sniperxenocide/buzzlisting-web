/**
 * Created by rawnak on 11/21/17.
 */
{
    /*------- ajax call loader ------*/
    $(document).bind("ajaxSend", function () {
        $('.loader').show();
    }).bind("ajaxStop", function () {
        $('.loader').hide();
    });

    var $application_list = $('#application_list'),
        $dtTbl = $application_list.find('#Query_case'),
        $summary_button = $application_list.find('#summary_button'),
        $pause_button = $application_list.find('#pause_button'),
        $common_case_form = $('#common_case_form'),
        $open_button = $('#open_button');

    //Data table
    $dtTbl.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: query_url + "?user_id="+userId+"&status=todo",
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        // order: [[1, 'desc']],
        ordering: false,
        columns: [
            {"title": "Query", "data": "query"},
            {"title": "Project", "data": "project_name"},
            {"title": "Send By", "data": "user_from_name"},
            {"title": "Query Date", "data": "date"},
            {"title": "Due Date", "data": "expiry_date"},
            {"title": "App ID", "data": "app_number"},
            // {"title": "Process", "data": "project_name"},
            // {"title": "Task", "data": "task_name"},
            // {"title": "Sent by", "data": "sent_by"},
            // {"title": "Due Date", "data": "due_date"},
            // {"title": "Init Date", "data": "init_date"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: '25%'
            },
            {
                targets: 1,
                width: '15%',
            },
            {
                targets: 2,
                width: '15%',
            },
            {
                targets: 3,
                width: '15%',
            },
            {
                targets: 4,
                width: '15%',
                // "render": (data, a, b) => {
                //     var due_date = new Date(data);
                //     var current_date = new Date();
                //     if (current_date < due_date) {
                //         return "<span>"
                //             + moment(data).format('MMMM Do YYYY, h:mm a')
                //             + "</span>"
                //     } else {
                //         return "<span class='c-lightRed'>"
                //             + moment(data).format('MMMM Do YYYY, h:mm a')
                //             + "</span>"
                //     }
                // },
            },
            {
                targets: 5,
                width: '15%',
                // visible: false,
                // "render": (data, a, b) => {
                //     var due_date = new Date(data);
                //     var current_date = new Date();
                //     return "<span>"
                //         + moment(data).format('MMMM Do YYYY, h:mm a')
                //         + "</span>"
                // },
            },
        ],
        language: {
            "emptyTable": "You have no Inbox"
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
        var $open_button = $('#open_button');
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $summary_button.removeData('case-id').removeClass('c-black').removeData('comment_count');
            $pause_button.removeData('case-id').removeClass('c-black');
            $open_button.removeData('case-id').removeClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');

            $summary_button.removeData("case-id").data("case-id", data.application).addClass('c-black').data("comment_count", data.comment_count);
            $pause_button.removeData("case-id").data("case-id", data.application).addClass('c-black');
            $open_button.removeData("case-id").data("case-id", data.application).addClass('c-black');
        }
    });

    //open
    $('#open_button').off('click').on('click', function () {
        if ($(this).data('case-id')) {
            $('#application_list tr.selected').dblclick();

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });

    //DoubleClick
    $dtTbl.find('tbody').on('dblclick', 'tr', function () {
        var table = $dtTbl.DataTable();
        $(this).removeClass('unread');
        var data = table.row(this).data();
        var task_id = data.task;
        var application_id = data.application;
        var query_id = data.id;
        CommonFormSet(task_id, application_id, query_id);
        //window.location = '/workflow/case/form/' + task_id + '/' + application_id;
    });


    //Unselect row
    $('#inbox_case_paginate').on('click', function () {
        if ($dtTbl.find('.selected').length) {

            $summary_button.removeData('announcement-id').removeClass('c-black');
            $pause_button.removeData('case-id').removeClass('c-black').removeData('comment_count');

            $dtTbl.find('tbody tr').removeClass('selected');
        }
    });

}
