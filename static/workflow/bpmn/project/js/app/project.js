{

    let project_api = location.origin + '/api/v1/workflow/project/';
    let category_api = location.origin + '/api/v1/workflow/category/';

    let $table = $('#project_list').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: process_api,
            pages: 1
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        order: [[0, "asce"]],
        columns: [
            {"title": "Process Title", "data": "title"},
            {"title": "Category", "data": "category_name"},
            {"title": "Assigned User", "data": "assigned_user_name"},
            {"title": "Created At", "data": "created_at"},
            {"title": "Updated At", "data": "updated_at"},
        ],
        columnDefs: [
            {
                "targets": 0,
                "width": "20%",
                "render":(data, a, b) => {
                    var $status;
                    if(b.published == true){
                        $status = "<i class='zmdi zmdi-circle c-lightgreen f-15' title='Published'></i>";
                    }else{
                        $status = "<i class='zmdi zmdi-circle c-lightRed f-15' title='Not Published'></i>";
                    }
                    return $status +" "+ data;
                }
            },
            {
                "targets": 1,
                "width": "20%",
                "render": (data) => {

                    if (data == null) {
                        return 'No category assigned';
                    } else {
                        return data;
                    }
                }
            },
            {
                "targets": 2,
                "width": "20%",
            },
            {
                "targets": 3,
                "render": (data) => {
                    return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                }
            },
            {
                "targets": 4,
                "render": (data) => {
                    return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                }
            },
        ]
    });

    $('#create_project_button').on('click', () => {
        $('#create_project_modal').modal();
    });

    let process_form = $('#create_project_form').parsley();

    $('#save_project').on('click', (e) => {
        e.preventDefault();

        process_form.validate();

        if (process_form.isValid()) {
            $.ajax({
                url: process_api,
                method: 'POST',
                data: $('#create_project_form').serialize(),
                success: (data) => {
                    $('#create_project_form').trigger('reset');
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

    var single_selected_tr;
    //single click selected
    $table.on('click', 'tr', function () {
        var $edit_project_button_delete_project_button = $('#edit_project_button, #delete_project_button');

        if ($(this).hasClass('selected-single')) {
            $(this).removeClass('selected-single');
            $edit_project_button_delete_project_button.removeData('id').find('i').removeClass('c-black');
        }
        else {
            $table.$('tr.selected-single').removeClass('selected-single');
            $(this).addClass('selected-single');

            single_selected_tr = $table.row($('.selected-single')).data();

            console.log(single_selected_tr.id);

            $edit_project_button_delete_project_button.data('id',single_selected_tr.id).find('i').addClass('c-black');
        }
    });
    //edit project button click
    let $edit_modal = $('#edit_project');
    let $category_select = $edit_modal.find('#process_category');
    let $publication = $edit_modal.find('#process_publication');
    let $process_title = $edit_modal.find('#process_title');
    let $process_recheck = $edit_modal.find('#process_recheck');

    $('#edit_project_button').off('click.fang').on('click.fang', function () {
        var $this = $(this);
        var $id = $this.data('id');

        if($id != undefined){
            console.log('edit ok, data-id is:',$id);

            $category_select.empty();
            $publication.empty();
            $process_recheck.empty();
            $.ajax({
                method: 'GET',
                url: project_api + $id + '/',
                success: function (res) {
                    console.log(res);
                    let title = res.title;
                    let currentCat = res.category;
                    let published = res.published;
                    let recheck = res.recheck;

                    $process_title.val(title);

                    $publication.append(`
                    <option value='true'>Publish</option>
                    <option value='false'>Unpublish</option>
                    `);

                    $process_recheck.append(`
                    <option value='1'>Flow forward</option>
                    <option value='2'>Resume forward</option>
                    `);

                    $publication.selectpicker();
                    $publication.data('selectpicker').val(published.toString());

                    $process_recheck.selectpicker();
                    $process_recheck.data('selectpicker').val(recheck.toString());

                    //get all categories
                    $.ajax({
                        method: 'GET',
                        url: category_api,
                        success: function (res) {
                            console.log(res);
                            $category_select.append(`<option value='null'>Choose a category</option>`);

                            $.each(res, function (k, v) {
                                $category_select.append(`<option value="${v.id}">${v.name}</option>`);
                            });

                            $category_select.selectpicker();
                            $category_select.data('selectpicker').val(String(currentCat));

                            $edit_modal.modal('show');
                        },
                        error: function (res) {
                            console.log(res);
                        }
                    });
                },
                error: function (res) {
                    console.log(res);
                }
            });

            $edit_modal.modal('show');
        }
    });
    //delete project button click
    let $delete_project_modal = $('#delete_project_modal');
    $('#delete_project_button').off('click.fang').on('click.fang', function () {
        var $this = $(this);
        let $id = $this.data('id');

        if($id != undefined){
            console.log('delete ok, data-id is:',$id);

            $delete_project_modal.modal('show');
        }
    });

    //save edit modal click
    $edit_modal.find('.save_edit_changes').off('click.feng').on('click.feng', function () {
        let param = {};
        let id = single_selected_tr.id;

        param['title'] = $process_title.val();
        param['published'] = $publication.data('selectpicker').val() == 'true';
        param['recheck'] = $process_recheck.data('selectpicker').val();
        param['category'] = ($category_select.data('selectpicker').val() != 'null') ? parseInt($category_select.data('selectpicker').val()) : null;

        if($process_title.val() == ''){
            notify('Process title cannot be empty!', '','','danger',2000);
            return;
        }

        $.ajax({
            method: "PATCH",
            url: project_api + id + '/',
            data: param,
            success: function (res) {
                console.log('single_selected_tr',single_selected_tr);
                console.log('res',res);
                notify('Successfully updated!', '','','success',2000);
                $edit_modal.modal('hide');
                //console.log($table.row($('.selected-single')).index());
                $table.row($table.row($('.selected-single')).index()).data(res);
            },
            error: function (res) {
                console.log(res);
                notify('Cannot save changes!', '','','danger',2000);
            }
        })
    });
    //save delete modal click
    $delete_project_modal.find('.delete_project_btn').off('click.peng').on('click.peng', function () {
        let $id = single_selected_tr.id;

        $.ajax({
            method: "DELETE",
            url: project_api + $id + '/',
            success: function (res) {
                console.log(res);
                $delete_project_modal.modal('hide');
                $table.row($table.row($('.selected-single')).index()).remove();
            },
            error: function (res) {
                console.log(res);
            }
        })
    });

    $table.on('dblclick', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            $table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            window.location = `${draw_diagram}${$table.row( this ).data().id}`
        }
    });

}