/**
 * Created by mdimrulhasan on 18/01/2017.
 */

{
    let $table= $('#pendingMeta_list').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: pendingMeta_api,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "File Name", "data": "name"},
            {"title": "Type", "data": "extension"},
            {"title": "Uploader", "data": "assigned_user_name"},
            {"title": "Uploaded At", "data": "uploaded_at"},
        ],
        columnDefs: [
            {
                "targets": 0,
                "width": "40%",
            },
            {
                "targets": 1,
                "width": "20%",

            },
            {
                "targets": 2,
                "width": "20%",
            },
            {
                "targets": 3,
                "width": "20%",
                "render": (data) => {
                    moment(data).format('MMMM Do YYYY, h:mm:ss a')
                }
            },

        ]
    });

    $('#pendingMeta_list tbody').on( 'click', 'tr', function () {
        $(this).toggleClass('selected');
    } );

    $('#delete_file_button').click( function () {
        var ddata=$table.rows('.selected').data();
        var arrdata=[];
        $.each (ddata,function(key,val){
            console.log(val);
            arrdata.push(val);
        });
        console.log(arrdata);
       // console.log($table.rows('.selected').data());
        //var ddata = '';
       // console.log(ddata);
         $.ajax({
            url: delete_pending_Meta,
            method: 'POST',
            data: JSON.stringify(arrdata),
            dataType: 'json',
            success: function (data) {
                //$table.fnDraw();
                console.log($table);
                $table.clearPipeline().draw();

            },
            error: function (response, jqXHR, textStatus, errorThrown) {
                //console.log(response);
            },
        });

    } );


    $('#add_meta_button').on('click', () => {
        console.log($('#pendingMeta_list').DataTable().rows('.selected').data());
       // $('#meta_data_insert').modal();
    });


    let meta_form = $('#meta_insert_form').parsley();


    $('#save_meta').on('click', (e) => {
        e.preventDefault();

        meta_form.validate();

        if (meta_form.isValid()) {
            $.ajax({
                url: meta_api,
                method: 'POST',
                data: $('#create_process_form').serialize(),
                success: (data) => {
                    $('#create_process_form').trigger('reset');
                    window.location.href = draw_diagram + data.id
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger');
                    });
                }
            });
        }
    });
}