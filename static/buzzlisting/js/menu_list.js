/**
 * Created by adnan0944 on 18/3/18.
 */

{
    let menu,
        $edit_button = $('#edit_button'),
    $dateRangeField = $('input[name="daterange"]');

    // Datatable
    $('.zmdi-search').attr('title', 'search');
    menu = $('#menu').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/menulist/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 500,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Name", "data": "name"},
            // {"title": "Email", "data": "emailPhone"},
            // {"title": "Registered At", "data": "registered_at"},
            // {"title": "Source", "data": "source"},
            // {"title": "Current Status", "data": "registration"},
            // {"title": "Unregistered At", "data": "unregistered_at"},

        ],

    });

    // click event
    let table = $('#menu').DataTable();
    table.on('click', 'tr', function () {
        let data = table.row(this).data();
        let id = data.id;
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $edit_button.removeData('id').removeClass('c-black');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $edit_button.removeData('id').addClass('c-black');
        }
        $edit_button.data("id", data.id);
    });
    // edit click
    $(document).on('click', '#edit_button', function () {
        let edit_id = $(this).data('id');
        $.ajax({
            url: '/api/v1/menulist/' + edit_id,
            method: 'GET',
            success: function (res) {
                $('.e_v_n').addClass('fg-toggled');
                $('.e_v_c').addClass('fg-toggled');
                $('#edit_geo_name').val(res.name);
                $('#edit_modal').modal('show');
            },
            error: function (res) {
                var errors = res.responseText;
                $.each(JSON.parse(errors), function (key, value) {
                    var nMessage = value;
                    notify('', nMessage, '', 'danger');
                });
            }
        });
    });
    // edit submit
    $('#edit_submit').on('click', function (e) {
        e.preventDefault();
        let edit_id = $edit_button.data('id');
        var edit_form_parsley = $("#edit_form").parsley();
        edit_form_parsley.validate();
        if (!edit_form_parsley.isValid()) {
            return;
        }
        var $form = new FormData($('#edit_form')[0]);
        $.ajax({
            "method": "PATCH",
            "processData": false,
            "contentType": false,
            "cache": false,
            "data": $form,
            "url": '/api/v1/menulist/' + edit_id + '/',
            "success": function (res) {
                $('#edit_modal').modal('hide');
                notify('', 'Menu Item Updated successfully', '', 'success', 2000);
                menu.clearPipeline().draw();
                // setTimeout(function () {
                //     location.reload();
                // }, 2000);
            },
            "error": function (res) {
                var errors = res.responseText;
                $.each(JSON.parse(errors), function (key, value) {
                    var nMessage = value;
                    notify('', nMessage, '', 'danger');
                });
            }

        })
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

        appuser.iCacheLower = -1;
        appuser.clearPipeline();
        appuser.columns(1).search(from);
        appuser.columns(2).search(to);
        appuser.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });

}