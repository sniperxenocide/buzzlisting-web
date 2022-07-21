/**
 * Created by mrityunjoy on 5/7/17.
 */
{
    let wf_activity,
        user_api = '/api/v1/user',
        $dateRangeField = $('input[name="daterange"]'),
        $wf_activity_process_map_tab = $("#wf_activity_search_process_map_tab"),
        $wf_activity_uploaded_document_tab = $("#wf_activity_uploaded_document_tab"),
        $selectUserReport = $("#select_user");
    //-------Get User Name for dropdown------------
    if (user_role === '1') {
        $.ajax({
            type: "GET",
            url: user_api,
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                    $selectUserReport.append($('<option value="' + d.id + '">' + d.first_name + ' ' + d.last_name + ' (' + d.username + ') ' + '</option>'));
                });
                $selectUserReport.selectpicker('refresh');
                $selectUserReport.selectpicker('val', ['all']);
                // let url = "/static/workflow/report/kpiReport/js/kpi_dummy" + user_id + ".json";
                let url = '/api/v1/workflow/delegation_report/';
                getWfActivity(url);
            },
            error: function (response) {
                console.log(response);
            }
        });
        $selectUserReport.on('change', function () {
            let url = '/api/v1/workflow/delegation_report/?operation=activity&user=' + this.value;
            if (this.value == "all") {
                url = '/api/v1/workflow/delegation_report/';
            } else {
                url = '/api/v1/workflow/delegation_report/?operation=activity&user=' + this.value;
            }
            // console.log(url);
            // if(this.value = "all"){
            //     url = '/api/v1/workflow/delegation_report/';
            // }
            wf_activity.destroy();
            getWfActivity(url);
        });
    } else {
        $selectUserReport.empty().append($('<option value=' + user_id + '>' + user + '</option>'));
        let url = '/api/v1/workflow/delegation_report/?operation=activity&user=' + user_id;
        getWfActivity(url);
    }

    function getWfActivity(url) {
        console.log(url);
        wf_activity = $('#wf_activity').DataTable({
            processing: true,
            serverSide: true,
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            ajax: $.fn.dataTable.pipeline({
                url: url,
                pages: 1 // number of pages to cache
            }),
            scrollY: 300,
            deferRender: true,
            scroller: true,
            columns: [
                {"title": "Project", "data": "project_name"},
                {"title": "App Number", "data": "app_number"},
                {"title": "User", "data": "user"},
                {"title": "Status", "data": "status"},
                {"title": "Init Date", "data": "init_date"},
                {"title": "Update Date", "data": "update_date"},
                {"title": "Finish Date", "data": "finish_date"},
            ],
            columnDefs: [
                {
                    targets: 0,
                    width: "12%",
                    render: (data, a, b) => {
                        let html = b.project_name + "(" + b.task_name + ")";

                        return html;
                    }
                },
                {
                    targets: 1,
                    width: "8%",
                    render: (data, a, b) => {
                        let html = '<a href="#" id="wf_app_number" data-info=' + b.app_id + '>' + b.app_number + '</a>';
                        return html;
                    }
                },
                {
                    targets: 2,
                    width: "10%",
                    render: (data, a, b) => {
                        let html = "";
                        var actual_user_task = ""
                        if(b.is_delegated == true){
                            actual_user_task = " <font color=\"red\"> in absence of </font> "+b.actual_task_user
                        }
                        html = b.user+actual_user_task;
                        return html;
                    }
                },
                {
                    targets: 3,
                    width: "8%",
                    render: (data, a, b) => {
                        let html = "";
                        var is_delegated = ""
                        if(b.is_delegated == true){
                            is_delegated = "(Delegated Task)"
                        }
                        if (b.status == "0") {
                            html = "Completed "+is_delegated;

                        } else if (b.status == "1") {
                            html = "To-do "+is_delegated;
                        } else if (b.status == "2") {
                            html = "Open "+is_delegated;
                        }
                        return html;
                    }
                },
                {
                    targets: 4,
                    width: "12%",
                    render: (data, a, b) => {
                        if (b.init_date) {
                            return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                        } else {
                            return "N/A"
                        }
                    }
                },
                {
                    targets: 5,
                    width: "12%",
                    orderable: false,
                    render: (data, a, b) => {
                        if (b.update_date) {
                            return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                        } else {
                            return "N/A"
                        }
                    }
                },
                {
                    targets: 6,
                    width: "12%",
                    render: (data, a, b) => {
                        if (b.finish_date) {
                            return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                        } else {
                            return "N/A"
                        }
                    }
                },
                // {
                //     targets: 6,
                //     width: "12%",
                //     orderable: false,
                //     render: (data, a, b) => {
                //         if (b.update_date) {
                //             return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                //         } else {
                //             return "N/A"
                //         }
                //     }
                // },
                // {
                //     targets: 7,
                //     width: "12%",
                //     orderable: false,
                //     render: (data, a, b) => {
                //         if (b.finish_date) {
                //             return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                //         } else {
                //             return "N/A"
                //         }
                //     }
                // },
            ],
            order: [[5, 'desc']],
        });

        //---------------DateRangePicker Search--------------------

        $dateRangeField.daterangepicker({
            "opens": "left",
            autoUpdateInput: false,
            locale: {
                "cancelLabel": "Clear",
            }
        });
        $dateRangeField.on('apply.daterangepicker', function (ev, picker) {

            let from = moment(picker.startDate, 'YYYY-MM-DD hh:mm A').format();
            let to = moment(picker.endDate, 'YYYY-MM-DD hh:mm A').format();
            // let from = picker.startDate.format('YYYY-MM-DD HH:mm:ss.sss');
            // let to = picker.endDate.format('YYYY-MM-DD HH:mm:ss.sss');
            $(this).val(from + ' to ' + to);

            let dateFilter = {};
            dateFilter.from = from;
            dateFilter.to = to;

            wf_activity.iCacheLower = -1;
            wf_activity.clearPipeline();
            wf_activity.columns(1).search(from);
            wf_activity.columns(2).search(to);
            wf_activity.draw(false);
        });
        $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('');
        });
        $('.input-mini').addClass("date_form");
        $('.applyBtn').removeClass('btn-success').addClass('btn-info');
        $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');
    }

    // $(document).on('click', '#wf_app_number', function () {
    //     let uid = $(this).data('id');
    //     $("#wf_activity_search_process_map_tab").data('info', uid);
    //     $("#wf_activity_uploaded_document_tab").data('info', uid);
    //     $.ajax({
    //         url: "/api/v1/workflow/general_info/" + uid + "/",
    //         method: 'GET',
    //         success: function (res) {
    //             let process_name = res.process_name;
    //             let app_number = res.number;
    //             let current_user = res.current_user_name;
    //             let next_user = res.delegation[0].user;
    //             let status = '';
    //             if (res.status == "0") {
    //                 status = "Completed";
    //             } else if (res.status == '1') {
    //                 status = "ToDo";
    //             } else if (res.status == '2') {
    //                 status = "Open";
    //             }
    //             let init_date = moment(res.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a');
    //             let init_user = res.init_user_name;
    //             let updated = moment(res.updated_at).format('MMMM Do YYYY, h:mm a');
    //             let description = res.description;
    //             // (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm:ss a') : $finish_date = "--";
    //             let finish_date = res.finished_at === null ? "--" : moment(res.finished_at).format('MMMM Do YYYY, h:mm a');
    //             $("#wf_activity_case_property .process_name").text(process_name);
    //             $("#wf_activity_case_property .applicaion").text(app_number);
    //             $("#wf_activity_case_property .current_user_name").text(current_user);
    //             $("#wf_activity_case_property .next_user").text(next_user);
    //             $("#wf_activity_case_property .status").text(status);
    //             $("#wf_activity_case_property .init_date").text(init_date);
    //             $("#wf_activity_case_property .init_user_name").text(init_user);
    //             $("#wf_activity_case_property .updated_at").text(updated);
    //             $("#wf_activity_case_property .description").text(description);
    //             $("#wf_activity_case_property .finished_at").text(finish_date);
    //             $("#wf_activity_summary_modal").modal().show();
    //             $("#wf_activity_search_process_tab_li").removeClass('active');
    //             $("#wf_activity_search_process_map").removeClass('active');
    //             $("#wf_activity_search_process_tab_li").removeClass('active');
    //             $("#wf_activity_uploaded_document").removeClass('active');
    //             $("#wf_activity_uploaded_tab_li").removeClass('active');
    //             $("#wf_activity_general_tab_li").addClass('active');
    //             $("#wf_activity_summary").addClass('active');
    //         },
    //         error: function (res) {
    //
    //         }
    //     });
    // });
    // //----------------Process map tab on click------------------
    // $wf_activity_process_map_tab.on('click', function (i, v) {
    //     let id = $(this).data('info');
    //     $.ajax({
    //         url: '/api/v1/workflow/process_map/?app_id=' + id,
    //         method: "GET",
    //         dataType: "JSON",
    //         success: function (data) {
    //             $("#wf_activity_search_map_table").empty();
    //             $.each(data, (k, v) => {
    //                 var $time_taken, $finish_date, $status;
    //                 if (v.status == 1 || v.status == 2) {
    //                     var due_date = new Date(v.due_date);
    //                     var risk_date = new Date(v.risk_date);
    //                     var current_date = new Date();
    //
    //                     if (current_date < risk_date) {
    //                         $status = "<i class='zmdi zmdi-star f-15' title='Todo'></i>"
    //                     } else if (risk_date < current_date && current_date < due_date) {
    //                         $status = "<i class='zmdi zmdi-star c-deeporange f-15' title='At Risk'></i>"
    //                     } else if (due_date < current_date) {
    //                         $status = "<i class='zmdi zmdi-star c-red f-15' title='Over Due'></i>"
    //                     }
    //                 } else if (v.status == 0) {
    //                     $status = "<i class='zmdi zmdi-star c-green f-15' title='Completed'></i>"
    //
    //                 } else {
    //                     $status = "--"
    //                 }
    //
    //                 (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
    //                 (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
    //                 $('#wf_activity_search_map_table').append('<tr>' +
    //                     '<td>' + $status + ' ' + v.task_name + '</td>' +
    //                     '<td>' + v.user_name + '</td>' +
    //                     '<td>' + moment(v.init_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
    //                     '<td>' + moment(v.due_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
    //                     '<td>' + $finish_date + '</td>' +
    //                     '<td>' + $time_taken + '</td>' +
    //                     '</tr>')
    //             });
    //         },
    //         error: function (response) {
    //             $.each(JSON.parse(response.responseText), (k, v) => {
    //                 // console.log(v);
    //                 notify('Sorry!!! ', v.detail, '', 'danger', 5000)
    //             });
    //         }
    //     });
    // });
    // $wf_activity_uploaded_document_tab.on('click', function (i, v) {
    //     let id = $(this).data('info');
    //     $.ajax({
    //         url: '//' + location.host + '/api/v1/workflow/upload_document/?app_id=' + id,
    //         method: "GET",
    //         dataType: "JSON",
    //         success: function (data) {
    //             $('#wf_activity_upload_doc_body').empty();
    //             $.each(data, (k, v) => {
    //                 (v.uploaded_at != null) ? uploaded_at = moment(v.uploaded_at).format('MMMM Do YYYY, h:mm a') : uploaded_at = "--";
    //                 // console.log(v);
    //                 $('#wf_activity_upload_doc_body').append('<tr>' +
    //                     '<td><a href=' + v.file + '>' + v.name + '</a></td>' +
    //                     '<td>' + v.extension + '</td>' +
    //                     '<td>' + v.origin_task + '</td>' +
    //                     '<td>' + uploaded_at + '</td>' +
    //                     '</tr>')
    //             });
    //         },
    //         error: function (response) {
    //             $.each(JSON.parse(response.responseText), (k, v) => {
    //                 console.log(v);
    //                 notify('Sorry!!! ', v, '', 'danger', 5000)
    //             });
    //         }
    //     });
    // });
}