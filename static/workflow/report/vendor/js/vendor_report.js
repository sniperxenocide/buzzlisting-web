/**
 * Created by mrityunjoy on 5/16/17.
 */
{
    let vendorReport,
        $add_vendor = $('#add_vendor_button'),
        $add_vendor_modal = $('#vendor_modal'),
        $edit_button = $('#edit_vendor_button'),
        $delete_button = $('#delete_vendor_button');

    // Datatable
    vendorReport = $('#vendor_report').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/workflow/vendor/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Vendor Name", "data": "name"},
            {"title": "Vendor Code", "data": "code"},
        ],
    });
    $(document).on('click', '#add_vendor_button', function () {
        $add_vendor_modal.modal('show');
    });
    // Add Vendor
    $('#submit_vendor').on('click', function (e) {
        e.preventDefault();
        var vendor_form_parsley = $("#vendor_form").parsley();
        vendor_form_parsley.validate();
        if (!vendor_form_parsley.isValid()) {
            return;
        }
        var $form = new FormData($('#vendor_form')[0]);
        $.ajax({
            "method": "POST",
            "processData": false,
            "contentType": false,
            "cache": false,
            "data": $form,
            "url": '/api/v1/workflow/vendor/',
            "success": function (res) {
                $add_vendor_modal.modal('hide');
                notify('', 'Vendor added successfully', '', 'success', 2000);
                vendorReport.clearPipeline().draw();
                // setTimeout(function () {
                //     location.reload();
                // }, 2000);
            },
            "error": function (res) {
                console.log(res);
            }

        })
    });
    // click event
    let table = $('#vendor_report').DataTable();
    table.on('click', 'tr', function () {
        let data = table.row(this).data();
        let id = data.id;
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $edit_button.removeData('id').removeClass('c-black');
            $delete_button.removeData('id').removeClass('c-black');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $edit_button.removeData('id').addClass('c-black');
            $delete_button.removeData('id').addClass('c-black');
        }
        $edit_button.data("id", data.id);
        $delete_button.data("id", data.id);
    });
    // edit click
    $(document).on('click', '#edit_vendor_button', function () {
        let edit_id = $(this).data('id');
        $.ajax({
            url: '/api/v1/workflow/vendor/' + edit_id,
            method: 'GET',
            success: function (res) {
                $('.e_v_n').addClass('fg-toggled');
                $('.e_v_c').addClass('fg-toggled');
                $('#edit_vendor_name').val(res.name);
                $('#edit_vendor_code').val(res.code);
                $('#edit_vendor_modal').modal('show');
            },
            error: function (res) {
                console.log(res);
            }
        });
    });
    // edit submit
    $('#edit_vendor_submit').on('click', function (e) {
        e.preventDefault();
        let edit_id = $edit_button.data('id');
        var edit_vendor_form_parsley = $("#edit_vendor_form").parsley();
        edit_vendor_form_parsley.validate();
        if (!edit_vendor_form_parsley.isValid()) {
            return;
        }
        var $form = new FormData($('#edit_vendor_form')[0]);
        $.ajax({
            "method": "PATCH",
            "processData": false,
            "contentType": false,
            "cache": false,
            "data": $form,
            "url": '/api/v1/workflow/vendor/' + edit_id + '/',
            "success": function (res) {
                $('#edit_vendor_modal').modal('hide');
                notify('', 'Vendor Updated successfully', '', 'success', 2000);
                vendorReport.clearPipeline().draw();
                // setTimeout(function () {
                //     location.reload();
                // }, 2000);
            },
            "error": function (res) {
                console.log(res);
            }

        })
    });
    $(document).on('click', '#delete_vendor_button', function () {
        let url_id = $(this).data('id');
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this information!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        }).then(function () {
            $.ajax({
                type: "DELETE",
                url: '/api/v1/workflow/vendor/' + url_id,
                data: "csrfmiddlewaretoken=" + getCookie("csrftoken"),
                success: function (res) {
                    notify('', 'Vendor Deleted successfully', '', 'success', 2000);
                    vendorReport.clearPipeline().draw();
                    // setTimeout(function () {
                    //     location.reload();
                    // }, 2000);

                    // $('#edit_vendor_button, #delete_vendor_button').prop('disabled', true);
                }
                ,
                error: function (response) {
                    console.log(response);
                }
            });
        });
    });
}
