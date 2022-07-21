/**
 * Created by mrityunjoy on 1/24/17.
 */
{
    let dmsReport;
    $dateRangeField = $('input[name="daterange"]');
    dmsReport = $('#dms_activity').DataTable({
        processing: true,
        serverSide: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        ajax: $.fn.dataTable.pipeline({
            url: dms_activity,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "User", "data": "user"},
            {"title": "Operation", "data": "operation"},
            {"title": "Description", "data": "description"},
            {"title": "Source Ip", "data": "ip"},
            {"title": "Date Time", "data": "activity_time"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: "10%"
            },
            {
                targets: 1,
                width: "15%"
            },
            {
                targets: 2,
                width: "45%",
                render: (data, a, b) => {
                    let html = "";
                    if (b.metadata == null) {
                        html = data
                    } else {
                        let html1 = "";
                        let html2 = b.description;
                        if (Object.keys(JSON.parse(b.metadata)).length > 0) {
                            $.each(JSON.parse(b.metadata), function (k, v) {
                                html1 += k.split('_').join(' ').toUpperCase() + ": " + v + " "
                            });
                        } else {
                            html1 = "no metadata."
                        }

                        html = html2 + html1;
                    }
                    return html
                }
            },
            {
                targets: 3,
                width: "15%"
            },
            {
                targets: 4,
                width: "15%",
                orderable: false,
                render: (data, a, b) => {
                    if (b.activity_time) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return "N/A"
                    }
                }
            },
        ],
        order: [[4, 'desc']],

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

        dmsReport.iCacheLower = -1;
        dmsReport.clearPipeline();
        dmsReport.columns(1).search(from);
        dmsReport.columns(2).search(to);
        dmsReport.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
    $('.input-mini').addClass("date_form");
    $('.applyBtn').removeClass('btn-success').addClass('btn-info');
    $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');
}