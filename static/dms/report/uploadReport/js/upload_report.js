/**
 * Created by mrityunjoy on 2/14/17.
 */
{
    let uploadReport;
    $dateRangeField = $('input[name="daterange"]');
    uploadReport = $('#upload_report').DataTable({
        processing: true,
        serverSide: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        ajax: $.fn.dataTable.pipeline({
            url: upload_report_url,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Uploader", "data": "uploader"},
            {"title": "Document Name", "data": "filename"},
            {"title": "Doctype", "data": "doctype"},
            {"title": "Metadata", "data": "metadata"},
            {"title": "Upload Time", "data": "uploaded_at"},
        ],
        columnDefs: [
            {
                targets: 0,
                width: "23%",
                render: (data, a, b) => {
                    return b.uploader.first_name + " " + b.uploader.last_name;
                }
            },
            {
                targets: 1,
                width: "18%"
            },
            {
                targets: 2,
                width: "23%",
                orderable: false
            },
            {
                targets: 3,
                width: "20%",
                render: (data, a, b) => {
                    let html = '';
                    if (Object.keys(JSON.parse(data)).length > 0) {
                        $.each(JSON.parse(data), function (k, v) {
                            html += '<li style="list-style: none">' + '<span style="font-weight: 800">'+v.displayname +'</span>'+ "-> " + v.value + '</li>'
                        });
                    }else {
                        html = "N/A"
                    }

                    return html;
                }
            },
            {
                targets: 4,
                width: "15%",
                render: (data, a, b) => {
                    if (b.uploaded_at) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return "--"
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

        uploadReport.iCacheLower = -1;
        uploadReport.clearPipeline();
        uploadReport.columns(1).search(from);
        uploadReport.columns(2).search(to);
        uploadReport.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
    $('.input-mini').addClass("date_form");
    $('.applyBtn').removeClass('btn-success').addClass('btn-info');
    $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');
}