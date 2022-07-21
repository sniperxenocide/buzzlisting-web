{
    let loginReport;
        $dateRangeField = $('input[name="daterange"]');
    loginReport = $('#login_report_list').DataTable({
        processing: true,
        serverSide: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        ajax: $.fn.dataTable.pipeline({
            url: login_report,
            pages: 1 // number of pages to cache
        }),
        scrollY: 600,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "User", "data": "user"},
            {"title": "Ip Address", "data": "ip"},
            {"title": "Login Time", "data": "login"},
            {"title": "Logout Time", "data": "logout"}
        ],
        columnDefs: [
            {
                targets: 0,
                render: (data, a, b) => {
                    if (b.status_info.status == "true") {
                        return "<span style='color: #009688'><i class='zmdi zmdi-circle'></i></span>  " + b.user;
                    } else {
                        return "<span style='color: #F44336'><i class='zmdi zmdi-circle'></i></span>  " + b.user;
                    }
                }
            },
            {
                targets: 2,
                width: "25%",
                orderable: false,
                render: (data, a, b) => {
                    if (b.login) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return ""
                    }
                }
            },
            {
                targets: 3,
                orderable: false,
                render: (data, a, b) => {
                    if (b.logout) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return "N/A"
                    }
                }
            },

        ],
        order: [[2,'desc']],
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
        $(this).val(moment(picker.startDate).format('YYYY-MM-DD') + ' to ' + moment(picker.endDate).format('YYYY-MM-DD'));
        $(this).val(from + ' to ' + to);

        let dateFilter = {};
        dateFilter.from = from;
        dateFilter.to = to;

        loginReport.iCacheLower = -1;
        loginReport.clearPipeline();
        loginReport.columns(1).search(from);
        loginReport.columns(2).search(to);
        loginReport.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
    $('.input-mini').addClass("date_form");
    $('.applyBtn').removeClass('btn-success').addClass('btn-info');
    $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');
}