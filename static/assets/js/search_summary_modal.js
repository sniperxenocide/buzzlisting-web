function StatusName(status, additional_status) {
    var status_name;
    if (status == 1) {
        status_name = "Todo"
    } else if (status == 2) {
        status_name = "Open"
    } else if (status == 0) {
        status_name = "Complete"
    } else if (status == 3) {
        status_name = "Non Claimed"
    }
    if (additional_status != null) {
        if (additional_status == 1) {
            additional_status = 'Recheck';
        } else if (additional_status == 0) {
            additional_status = 'Reject'
        } else {
            additional_status = '';
        }
        status_name = status_name + " (" + additional_status + ")"
    } else if (additional_status == null && status == 0) {
        status_name = status_name + " (Approved)"
    }
    return status_name;
}

function SearchGeneralInfoCall(uid) {
    $.ajax({
        url: "/api/v1/workflow/general_info/" + uid + "/",
        method: 'GET',
        success: function (res) {
            let process_name = res.process_name;
            let app_number = res.number;
            let current_user = res.current_user_name;
            let next_user = res.delegation[0].user;
            let init_date = moment(res.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a');
            let init_user = res.init_user_name;
            let updated = moment(res.updated_at).format('MMMM Do YYYY, h:mm a');
            let description = res.description;
            // (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm:ss a') : $finish_date = "--";
            let finish_date = res.finished_at === null ? "--" : moment(res.finished_at).format('MMMM Do YYYY, h:mm a');
            $("#case_property .process_name").text(process_name);
            $("#case_property .applicaion").text(app_number);
            $("#case_property .current_user_name").text(current_user);
            $("#case_property .next_user").text(next_user);
            $("#case_property .status").text(StatusName(res.status, res.delegation[0].additional_status));
            $("#case_property .init_date").text(init_date);
            $("#case_property .init_user_name").text(init_user);
            $("#case_property .updated_at").text(updated);
            $("#case_property .description").text(description);
            $("#case_property .finished_at").text(finish_date);
            $("#search_summary_modal").modal().show();
            $("#process_tab_li").removeClass('active');
            $("#search_process_map").removeClass('active');
            $("#search_process_tab_li").removeClass('active');
            $("#uploaded_document").removeClass('active');
            $("#uploaded_tab_li").removeClass('active');
            $("#general_tab_li").addClass('active');
            $("#summary").addClass('active');
        },
        error: function (res) {

        }
    });
}

function SearchProcessMapCall(id) {
    $.ajax({
        url: '/api/v1/workflow/process_map/?app_id=' + id,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            $("#search_map_table").empty();
            $.each(data, (k, v) => {
                var $time_taken, $finish_date, $show_eform;
                var application_id = v.application,
                    task_id = v.task_id;
                var url = '//' + location.host + '/workflow/case/e_form_history/'+application_id+'/'+task_id+'/'+v.id;

                (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
                (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
                //target="_blank"
                (v.status == 0) ? $show_eform = '<a target="_blank" href="'+url+'"><i class="zmdi zmdi-eye f-20"></i></a>': $show_eform='';
                $('#search_map_table').append('<tr>' +
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
            // $.each(data, (k, v) => {
            //
            //     // var $time_taken, $finish_date, $status;
            //     // if (v.status == 1 || v.status == 2) {
            //     //     var due_date = new Date(v.due_date);
            //     //     var risk_date = new Date(v.risk_date);
            //     //     var current_date = new Date();
            //     //
            //     //     if (current_date < risk_date) {
            //     //         $status = "<i class='zmdi zmdi-star f-15' title='Todo'></i>"
            //     //     } else if (risk_date < current_date && current_date < due_date) {
            //     //         $status = "<i class='zmdi zmdi-star c-deeporange f-15' title='At Risk'></i>"
            //     //     } else if (due_date < current_date) {
            //     //         $status = "<i class='zmdi zmdi-star c-red f-15' title='Over Due'></i>"
            //     //     }
            //     // } else if (v.status == 0) {
            //     //     $status = "<i class='zmdi zmdi-star c-green f-15' title='Completed'></i>"
            //     //
            //     // } else {
            //     //     $status = "--"
            //     // }
            //     //
            //     // (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
            //     // (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
            //     // $('#search_map_table').append('<tr>' +
            //     //     '<td>' + $status + ' ' + v.task_name + '</td>' +
            //     //     '<td>' + v.user_name + '</td>' +
            //     //     '<td>' + moment(v.init_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
            //     //     '<td>' + moment(v.due_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
            //     //     '<td>' + $finish_date + '</td>' +
            //     //     '<td>' + $time_taken + '</td>' +
            //     //     '</tr>')
            // });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                // console.log(v);
                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
            });
        }
    });
}

function SearchUploadedDocCall(id) {
    $.ajax({
        url: '//' + location.host + '/api/v1/workflow/upload_document/?app_id=' + id,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            $('#search_upload_doc_body').empty();
            $.each(data, (k, v) => {
                (v.uploaded_at != null) ? uploaded_at = moment(v.uploaded_at).format('MMMM Do YYYY, h:mm a') : uploaded_at = "--";
                // console.log(v);
                $('#search_upload_doc_body').append('<tr>' +
                    '<td><a href=' + v.file + '>' + v.name + '</a></td>' +
                    '<td>' + v.extension + '</td>' +
                    '<td>' + v.origin_task + '</td>' +
                    '<td>' + uploaded_at + '</td>' +
                    '</tr>')
            });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                console.log(v);
                notify('Sorry!!! ', v, '', 'danger', 5000)
            });
        }
    });
}

function SearchGeneratedDocCall(id) {
    $.ajax({
        url: '//' + location.host + '/api/v1/workflow/generated_document/?app_id=' + id,
        method: "GET",
        dataType: "JSON",
        success: function (data) {
            $('#search_generated_doc_body').empty();
            $.each(data, (k, v) => {
                var $created_at;
                (v.created_at != null) ? $created_at = moment(v.created_at).format('MMMM Do YYYY, h:mm a') : $uploaded_date = "--";
                // console.log(v);
                $('#search_generated_doc_body').append('<tr>' +
                    '<td><a href=' + v.location + ' target="_blank">' + v.file_name + '</a></td>' +
                    '<td>' + $created_at + '</td>' +
                    '</tr>')
            });
        },
        error: function (response) {
            $.each(JSON.parse(response.responseText), (k, v) => {
                console.log(v);
                notify('Sorry!!! ', v, '', 'danger', 5000)
            });
        }
    });
}