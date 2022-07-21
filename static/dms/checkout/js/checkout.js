/**
 * Created by rawnak on 12/3/17.
 */
// var apiUrl = location.origin;
// var checkedOut_list = apiUrl + '/api/v1/dms/documents/checkoutdoc/';

$('#checkedOutTaskTable').DataTable({
    processing: true,
    serverSide: true,
    dom: 'Bfrtip',
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    ajax: $.fn.dataTable.pipeline({
        url: checkOut_url,
        pages: 1 // number of pages to cache
    }),
    scrollY: 300,
    deferRender: true,
    scroller: true,
    columns: [
        {"title": "File Name", "data": "filename"},
        {"title": "Doc Type", "data": "doctype"},
        {"title": "Expiry Date", "data": "expiry_date"},
        {"title": "Locked By", "data": "locker_name"},
        {"title": "Locked At", "data": "locked_at"},
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
            targets: 2,
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
            targets: 3,
            "render": (data, a, b) => {
                if (userId == 1) {
                    return data;
                }
                else {
                    return 'not allowed';
                }
            },
            "visible": (userId != 1) ? false : true,
            orderable: false
        },
        {
            targets: 4,
            "render": (data, a, b) => {
                if (data == null) {
                    return '--';
                } else {
                    return moment(data).format('DD/MM/YYYY hh:mm A');
                }
            },
            orderable: false
        },
        {
            targets: 5,
            "render": (data) => {
                return "<a target='_blank' href='/dms/document/view/" + data + "'>" +
                    "<i class='f-20 zmdi zmdi-eye'></i>" +
                    "</a>"
            },
            orderable: false
        }
    ],
});
