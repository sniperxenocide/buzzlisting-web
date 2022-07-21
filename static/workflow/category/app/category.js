{
    let $table = $('#process_category');
    $table.DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/workflow/category/',
            pages: 1
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        order: [[0, "desc"]],
        columns: [
            {"title": "Process Category Name", "data": "name"}
        ],
        columnDefs: [
            {
                "targets": 0,
                "width": "100%",
                "render": (data) => {
                    if (data == null) {
                        return 'No process category';
                    } else {
                        return data;
                    }
                }
            }
        ]
    });


    let table = $('#process_category').DataTable();

    $table.find('tbody').on('click', 'tr', function () {
        let data = table.row(this).data();
        let $zdmiDelete = $('#delete_button');
        let $zdmiEdit = $('#edit_button');
        //var $zdmiadd = $('#add_user_button');


        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $zdmiDelete.removeData('process-cat-id').removeClass('c-black');
            $zdmiEdit.removeData('process-cat-id').removeClass('c-black');
            //$zdmiadd.addClass('c-black');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            //$zdmiadd.removeClass('c-black');
            $zdmiDelete.removeData("process-cat-id").data("process-cat-id", data.id).addClass('c-black');
            //if ($zdmiDelete.data("process-cat-id") == 1) {
            //    $zdmiDelete.removeClass("c-black");
            //} else {
            //    $zdmiDelete.addClass("c-black");
            //}
            $zdmiDelete.attr({
                "data-toggle": "modal",
                "data-target": ""
            });
            $zdmiEdit.removeData("process-cat-id").data("process-cat-id", data.id).addClass('c-black');
            $zdmiEdit.attr({
                "data-toggle": "modal",
                "data-target": ""
            });
        }
    });


    let $model = $('#process_category_modal');
    let $if_create = $('#if_create');
    let apiURL = '/api/v1/workflow/category/';
    let $processCatInput = $model.find('input[name="process_category"]');
    //console.log(process_cat_id);

    $('#create_process_category').on('click', () => {
        $model.addClass('create').removeClass('edit').modal();
        $if_create.show();
        $processCatInput.val('')
            .closest('.fg-line').removeClass('fg-toggled');
    });
    $('#edit_button').on('click', () => {

        $if_create.hide();

        if ($('#edit_button').hasClass('c-black')) {
            apiURL = '/api/v1/workflow/category/' + $('#edit_button').data('process-cat-id');
            $model.addClass('edit').removeClass('create').modal();
            $.ajax({
                method: "GET",
                url: apiURL,
                success: (res) => {
                    console.log(res);
                    $processCatInput.val(res.name)
                        .closest('.fg-line').addClass('fg-toggled');
                },
                error: (err) => {
                    console.log(err);
                }
            })
        }

    });

    //edit or create process category
    $('#save_process_category').on('click', (e) => {
        e.preventDefault();
        let method = undefined;
        if ($model.hasClass('edit')) {
            method = 'PUT';
            apiURL = '/api/v1/workflow/category/' + $('#edit_button').data('process-cat-id') + '/';
            function notifycate() {
                notify('Congrats!', 'Successfully Edited!', '', 'success');
            }
        } else {
            method = 'POST';
            apiURL = '/api/v1/workflow/category/';
            function notifycate() {
                notify('Congrats!', 'Successfully Added!', '', 'success');
            }
        }
        $.ajax({
            method: method,
            url: location.origin + apiURL,
            data: {"name": $processCatInput.val()},
            success: (res) => {
                console.log(res);
                $model.modal('hide');
                location.reload();
                notifycate();
            },
            error: (err) => {
                console.log(err);
                console.log('apiURL', apiURL);
                notify('Opps, something bad happened!', err, '', 'warning');
            }
        });
        console.log(apiURL);
    });

    $('#delete_button').on('click', () => {
        $('#process_category_delete_modal').modal();
    });

    $('#confirm_delete_process_category').on('click', () => {
        $.ajax({
            method: 'DELETE',
            url: location.origin + '/api/v1/workflow/category/' + $('#delete_button').data('process-cat-id') + '/',
            success: (res) => {
                console.log(res);
                notify('Congrats!', 'Successfully Deleted!', '', 'success');
                location.reload();
            },
            error: (err) => {
                console.log(err);
                notify('Opps, something bad happened!', err, '', 'warning');
            }
        })
    });
}