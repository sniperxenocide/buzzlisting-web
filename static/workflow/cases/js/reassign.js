/**
 * Created by mrityunjoy on 6/19/17.
 */

{
    let $application_list = $('#application_list'),
        reassign_dt = $application_list.find('#reassign'),
        $selectUserReport = $('#select_user_report'),
        reassign_dataTable;

    // Datatable
    reassign_dataTable = reassign_dt.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/workflow/reassign/',
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
            {"title": "User Assigned", "data": "user"},
            {"title": "Sent by", "data": "sent_by"},
            {"title": "Due Date", "data": "due_date"},
            // {"title": "Priority", "data": "priority"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: '15%'
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
                width: '18%',
            },
            {
                targets: 4,
                width: '18%',
            },
            {
                targets: 5,
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
            "emptyTable": "You have no Inbox"
        },
        "fnRowCallback": function (nRow, aData) {
            if (aData.read_status == "false") {
                $(nRow).addClass('unread');
            }
        }
    });
    //Select Row of DataTable
    // reassign_dt.find('tbody').on('click', 'tr', function () {
    //     var table = reassign_dt.DataTable(),
    //         data = table.row(this).data();
    //     if ($(this).hasClass('selected')) {
    //         $(this).removeClass('selected');
    //     }
    //     else {
    //         table.$('tr.selected').removeClass('selected');
    //         $(this).addClass('selected');
    //     }
    // });
    reassign_dt.find('tbody').off('dblclick.reassign').on('dblclick.reassign', 'tr', function () {
        var table = reassign_dt.DataTable();
        var data = table.row(this).data();
        var project = data.project;
        var process = data.process;
        var task_element_id = data.task_element_id;
        console.log(data);
        $('#reassign_user_modal').modal('show');
        $.ajax({
            type: "GET",
            url: '/api/v1/workflow/task_op/?project=' + project + '&process=' + process + '&task=' + task_element_id,
            dataType: "json",
            success: function (res) {
                $selectUserReport.find('optgroup[label="Users"]').empty();
                $.each(res.all_users, function (i, d) {
                    $selectUserReport.find('optgroup[label="Users"]')
                        .append($('<option value="' + d.id + '">' + d.first_name + ' ' + d.last_name + ' (' + d.username + ') ' + '</option>'));
                });
                $selectUserReport.selectpicker('refresh');
                $selectUserReport.selectpicker('val', ['']);
            },
            error: function (response) {
                console.log(response);
            }
        });
        $('#submit_reassign').off('click.sub').on('click.sub', function (e) {
            console.log("data", data);
            e.preventDefault();
            $.ajax({
                type: 'PATCH',
                url: '/api/v1/workflow/reassign/' + data.id + '/',
                data: 'user=' + $selectUserReport.val(),
                success: function (res) {
                    $('#reassign_user_modal').modal('hide');
                    reassign_dataTable.clearPipeline().draw();
                    notify('Congratulations!!! ', 'User has been Reassigned Successfully', '', 'success', 3000);
                }
            });
        })
    });

}