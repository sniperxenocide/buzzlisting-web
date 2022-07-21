/**
 * Created by rawnak on 12/3/17.
 */

$('#checkedOutTaskTable').DataTable({
    processing: true,
    serverSide: true,
    dom: 'Bfrtip',
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    ajax: $.fn.dataTable.pipeline({
        url: expire_url,
        pages: 1 // number of pages to cache
    }),
    scrollY: 300,
    deferRender: true,
    scroller: true,
    columns: [
        {"title": "File Name", "data": "filename"},
        {"title": "Version", "data": "version"},
        {"title": "Doc Type", "data": "doctype"},
        {"title": "Expiry Date", "data": "expiry_date"},
        {"title": "Action", "data": "id"},

    ],
    columnDefs: [
        {
            targets: 0,
            orderable: false
        },
        {
            targets: 1,
            orderable: false
        },
        {
            targets: 3,
            "render": (data, a, b) => {
                if (data == null) {
                    return '--';
                } else {
                    return moment(data).format('DD/MM/YYYY');
                }
            },
            orderable: false
        },
        {
            targets: 4,
            "render": (data) => {
                return "<a target='_blank' href='/dms/document/view/" + data + "'>" +
                    "<i class='f-20 zmdi zmdi-eye'></i>" +
                    "</a>"
            },
            orderable: false
        }
    ],
});
