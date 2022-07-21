function GeneralInfoCall(deleid) {
    $.ajax({
        url: general_info + deleid,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            var $target = $('#general_info');
            var $case_tab = $($target).find('#case_property'),
                $current_tab = $($target).find('#current_task');
            var $task_finish_date;
            (data.delegation[0].delegation_finish_date != null)
                ? $task_finish_date = moment(data.delegation[0].delegation_finish_date).format('MMMM Do YYYY, h:mm a')
                : $task_finish_date = "";

            $case_tab.find('.process_name').text(data.process_name);
            $case_tab.find('.case_number').text(data.number);
            $case_tab.find('.case_status').text(StatusName(data.status, data.delegation[0].additional_status));
            $case_tab.find('.creator').text(data.init_user_name);
            $case_tab.find('.create_date').text(moment(data.created_at).format('MMMM Do YYYY, h:mm a'));
            $case_tab.find('.last_update').text(moment(data.updated_at).format('MMMM Do YYYY, h:mm a'));

            $current_tab.find('.task').text(data.delegation[0].task);
            $current_tab.find('.current_user').text(data.delegation[0].user);
            $current_tab.find('.task_init_date').text(moment(data.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a'));
            $current_tab.find('.task_due_date').text(moment(data.delegation[0].delegation_due_date).format('MMMM Do YYYY, h:mm a'));
            $current_tab.find('.task_finish_date').text($task_finish_date);
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
            });
        }
    });
}

function ProcessMapCall(delid) {
    $.ajax({
        url: '//' + location.host + '/api/v1/workflow/process_map/?app_id=' + delid,
        method: "GET",
        dataType: "JSON",
        success: function (data) {

            $('#map_table').empty();
            $.each(data, (k, v) => {
                var $time_taken, $finish_date, $show_eform;
                var application_id = v.application,
                    task_id = v.task_id;
                var url = '//' + location.host + '/workflow/case/e_form_history/'+application_id+'/'+task_id+'/'+v.id;
                (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
                (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
                //target="_blank"
                (v.status == 0) ? $show_eform = '<a target="_blank" href="'+url+'"><i class="zmdi zmdi-eye f-20"></i></a>': $show_eform='';
                $('#map_table').append('<tr>' +
                    '<td>' + v.task_name + '</td>' +
                    '<td>' + v.user_name + '</td>' +
                    '<td>' + moment(v.init_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
                    '<td>' + moment(v.due_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
                    '<td>' + $finish_date + '</td>' +
                    '<td>' + $time_taken + '</td>' +
                    '<td>' + StatusName(v.status, v.additional_status) + '</td>' +
                    '<td class="text-center">' + $show_eform + '</td>'+
                    '</tr>')
            });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
            });
        }
    });
}

function UploadDocumentCall(delid) {
    $('#upload_doc_table').empty();
    $.ajax({
        url: '//' + location.host + '/api/v1/workflow/upload_document/?app_id=' + delid,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            $('#upload_doc_table').empty();
            $.each(data, (k, v) => {
                var $uploaded_date;
                (v.uploaded_at != null) ? $uploaded_date = moment(v.uploaded_at).format('MMMM Do YYYY, h:mm a') : $uploaded_date = "--";

                $('#upload_doc_table').append('<tr>' +
                    '<td><a href=' + v.file + ' target="_blank">' + v.name + '</a></td>' +
                    '<td>' + v.extension + '</td>' +
                    '<td>' + v.origin_task + '</td>' +
                    '<td>' + $uploaded_date + '</td>' +
                    '</tr>')
            });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify('Sorry!!! ', v, '', 'danger', 5000)
            });
        }
    });
}

function GeneratedDocumentCall(delid) {
        $('#generated_doc_body').empty();
        $.ajax({
            url: '//' + location.host + '/api/v1/workflow/generated_document/?app_id=' + delid,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                $('#generated_doc_body').empty();
                $.each(data, (k, v) => {
                    var $created_at;
                    (v.created_at != null) ? $created_at = moment(v.created_at).format('MMMM Do YYYY, h:mm a') : $uploaded_date = "--";

                    $('#generated_doc_body').append('<tr>' +
                        '<td><a href=' + v.location + ' target="_blank">' + v.file_name + '</a></td>' +
                        '<td>' + $created_at + '</td>' +
                        '</tr>')
                });
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify('Sorry!!! ', v, '', 'danger', 5000)
                });
            }
        });
    }

function CommentCall(delid) {
    $pre_comment.empty();
    $.ajax({
        url: app_comment_url + "?app_id=" + delid,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            if (data.length > 0) {
                $.each(data, function (k, v) {
                    $pre_comment.prepend("<div class='list-group-item'>" +
                        "<div class='media-body'> " +
                        "<div class='lgi-heading'>" + v.user_name + "</div> " +
                        "<small> " + v.comment + '</small> ' +
                        "<ul class='lgi-attrs'>" +
                        "<li>Task: " + v.task_name + "</li>" +
                        "<li>" + moment(v.date).format('MMM Do YY, h:mm a') + "</li>" +
                        "</ul>" +
                        "</div>" +
                        "</div>");
                })
            }
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
            });
        }
    });

}

function QueryCall(delid) {
    $('#query_tab_show_table tbody').find('tr').not('.tab_empty_query_row').remove();
    $('#query_tab_show_table tbody').find('.tab_empty_query_row').show();
    /*----Old comment ----*/
    $.ajax({
        url: query_url + "?user_id=" + userId + "&application=" + delid + "&status=overall_query",
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            if (data.length > 0) {
                $('#query_tab_show_table').find('.tab_empty_query_row').hide();
                $.each(data, function (k, v) {
                    $('#query_tab_show_table tbody').append(QueryInfo(v));
                })
            }
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
            });
        }
    });
}

// function StatusName(status, additional_status) {
//     var status_name;
//     var additional_status_name;
//     if (status == 1) {
//         status_name = "Todo"
//     } else if (status == 2) {
//         status_name = "Open"
//     } else if (status == 0) {
//         status_name = "Complete"
//     } else if (status == 3) {
//         status_name = "Non Claimed"
//     }
//     if (additional_status != null) {
//         console.log(additional_status);
//         if (additional_status == 1) {
//             additional_status_name = 'Recheck';
//         } else if (additional_status == 0) {
//             additional_status_name = 'Reject'
//         } else {
//             additional_status_name = '';
//         }
//         status_name = status_name + " (" + additional_status_name + ")"
//     } else if (additional_status == null && status == 0) {
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
