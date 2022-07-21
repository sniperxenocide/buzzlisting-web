{
    let docReport, $dateRangeField = $('input[name="daterange"]');
    function load_class(url) {
        docReport = $('#classification').DataTable({
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
            {"title": "File Name", "data": "filename"},
            {"title": "Uploder", "data": "user"},
            {"title": "Classification", "data": "classification"},
            {"title": "Created at", "data": "creation_date"}
        ],
        columnDefs: [
            {
                targets: 3,
                width: "25%",
                orderable: false,
                render: (data, a, b) => {
                    if (b.creation_date) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return ""
                    }
                }
            },
        ],
        order: [[3,'desc']],
    });
    }
    load_class(classification_report);
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

        docReport.iCacheLower = -1;
        docReport.clearPipeline();
        docReport.columns(1).search(from);
        docReport.columns(2).search(to);
        docReport.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
    $('.input-mini').addClass("date_form");
    $('.applyBtn').removeClass('btn-success').addClass('btn-info');
    $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');
    $(document).on('change', '#select_class', function (e) {
        let val = $(this).val();
        let url = classification_report + '?classification=' + val;
        docReport.ajax.url($.fn.dataTable.pipeline({
            url: url,
        }));
        docReport.ajax.reload(null, false);
    })
}