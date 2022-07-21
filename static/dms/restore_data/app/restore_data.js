/**
 * Created by asif on 2/25/17.
 */
let $table = $('#restore_data');
$table.DataTable({
    processing: true,
    serverSide: true,
    ajax: $.fn.dataTable.pipeline({
        url: location.origin + '/api/v1/dms/documents/restoreFileList/',
        pages: 1
    }),
    scrollY: 300,
    deferRender: true,
    scroller: true,
    order: [[2, "desc"]],
    columns: [
        {"title": "File Name", "data": "filename"},
        {"title": "Uploaded By", "data": "uploader"},
        {"title": "Created At", "data": "creation_date"},
        {"title": "File Type", "data": "extension"},
        {"title": "Version", "data": "version"},
        {'title': 'restore'}
    ],
    columnDefs: [
        {
            "targets": 0,
            "width": "20%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        },
        {
            "targets": 1,
            "width": "25%",
            "render": (data, a, b) => {
                if (data == null) {
                    return '-';
                } else {
                    return b.username;
                }
            }
        },
        {
            "targets": 2,
            "width": "30%",
            render: (data, a, b) => {
                if (b.creation_date) {
                    return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                } else {
                    return "N/A"
                }
            }
        },
        {
            "targets": 3,
            "width": "15%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        },
        {
            "targets": 4,
            "width": "10%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        },
        {
            "targets": 5,
            "width": "20%",
            "render": (data, a, b) => {
                if (data == null) {
                    return '<a class="btn btn-primary btn-sm waves-effect restore_data" data-id="' + b.id + '">Restore</a>';
                } else {
                    return data;
                }
            }
        }
    ]
});

$(document).on('click', '.restore_data', function () {
    // let url = location.origin+'/api/v1/dms/documents/restoreFileList/'+ $(this).data('id')+'/';
    let url = location.origin + '/api/v1/dms/documents/restoreFile/' + $(this).data('id') + '/';
    console.log(url);

    setTimeout(function () {
        $.ajax({
            method: 'PATCH',
            url: url,
            success: function (res) {
                notify('restored!', '', 'danger', 500);
                location.reload();
            },
            error: function (err) {
                console.log(err);
            }
        });
    }, 1500)
    // var docid = $(this).data('id');
    // var params = {};
    // params.doc_id = docid;
    // HttpClient.url = api.document.restoreFile + docid + '/';
    // HttpClient.method = 'PATCH';
    // window.close();
    // return HttpClient.call();
});