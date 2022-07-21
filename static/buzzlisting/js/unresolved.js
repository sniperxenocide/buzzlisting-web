/**
 * Created by adnan0944 on 18/3/18.
 */

{
    let unresolved,
        $edit_button = $('#edit_button'),
        $mail_button = $('#email_button'),
    $dateRangeField = $('input[name="daterange"]');

    // Datatable
    $('.zmdi-search').attr('title', 'search');
    unresolved = $('#unresolved').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/unresolved/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 200,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Email", "data": "email"},
            {"title": "House Address", "data": ""},
            {"title": "Requested At", "data": "created_date"},
            {"title": "List Price", "data": ""},
            {"title": "Brokerage House", "data": ""},
            {"title": "Status", "data": "status"},
            {"title": "Comments", "data": "comment"},

        ],
        columnDefs: [
            {
                targets: 0,
                "render": (data, a, b) => {
                    if (b.email_obj !== null) {
                        return b.email_obj;
                    }
                    else if(b.email !==null){
                        return b.email;
                    }
                    else {
                        return "";
                    }

                }
            },
            {
                targets: 1,
                "render": (data, a, b) => {
                    if (b.type_obj =='1') {
                        return b.freehold_address_obj;
                    }
                    else if(b.type_obj == '2'){
                        return b.condo_address_obj;
                    }
                    else if(b.type_obj =='3'){
                        return b.commercial_address_obj;
                    }
                    else{
                        return "";
                    }

                }
            },
            {
                targets: 2,
                "render": (data, a, b) => {
                    if (b.created_date) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a');
                    } else {
                        return "";
                    }
                }
            },
            {
                targets: 3,
                "render": (data, a, b) => {
                    if (b.type_obj =='1') {
                        return b.freehold_price_obj;
                    }
                    else if(b.type_obj == '2'){
                        return b.condo_price_obj;
                    }
                    else if(b.type_obj =='3'){
                        return b.commercial_price_obj + ' '+b.commercial_pricecode_obj;
                    }
                    else{
                        return "";
                    }

                }
            },
            {
                targets: 4,
                "render": (data, a, b) => {
                    if (b.type_obj =='1') {
                        return b.freehold_brokerage_obj;
                    }
                    else if(b.type_obj == '2'){
                        return b.condo_brokerage_obj;
                    }
                    else if(b.type_obj =='3'){
                        return b.commercial_brokerage_obj;
                    }
                    else{
                        return "";
                    }

                }
            },
            {
                targets: 5,
                class:'text-center',
                "render": (data, a, b) => {
                    if (b.status == 1) {
                        return `<div class="toggle-switch" data-ts-color="cyan">
                        <input id="lock${b.id}" class ="lock" type="checkbox" checked hidden="hidden" data-uid=${b.id}>
                        <label for="lock${b.id}" class="ts-helper"></label>
                    </div>`
                    }
                    else {
                        return `<div class="toggle-switch" data-ts-color="cyan">
                        <input id="lock${b.id}" class ="lock" type="checkbox" hidden="hidden" data-uid=${b.id}>
                        <label for="lock${b.id}" class="ts-helper"></label>
                    </div>`
                    }

                }
            },
            // {
            //     targets: 3,
            //     "render": (data, a, b) => {
            //           if(b.source=='1') {
            //               return "Facebook"
            //           }else{
            //               return "Email"
            //           }
            //     }
            //
            // },
            // {
            //     targets: 4,
            //     "render": (data, a, b) => {
            //           if(b.registration=='1') {
            //               return "Registered"
            //           }else{
            //               return "Unregistered"
            //           }
            //     }
            //
            // },
        { orderable: false, targets: '_all' }
        ]
    });


    // click event
    let table = $('#unresolved').DataTable();
    table.on('click', 'tr', function () {
        let data = table.row(this).data();
        console.log("Data ID: ",data);
        let id = data.id;
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $edit_button.removeData('id').removeClass('c-black');
            $mail_button.removeData('id').removeClass('c-black');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            $edit_button.removeData('id').addClass('c-black');
            $mail_button.removeData('id').addClass('c-black');
        }
        $edit_button.data("id", data.id);
        $mail_button.data("id", data.id);
    });
    // edit click
    $(document).on('click', '#edit_button', function () {
        let edit_id = $(this).data('id');
        $.ajax({
            url: '/api/v1/unresolved/' + edit_id,
            method: 'GET',
            success: function (res) {
                $('.e_v_n').addClass('fg-toggled');
                $('.e_v_c').addClass('fg-toggled');
                $('#edit_comment').val(res.comment);
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

    // mail click
    $(document).on('click', '#email_button', function () {
        let mail_id = $(this).data('id');
        $.ajax({
            url: '/api/v1/unresolved/' + mail_id,
            method: 'GET',
            success: function (res) {
                $('.e_v_n').addClass('fg-toggled');
                $('.e_v_c').addClass('fg-toggled');
                if (res.email_obj !== null) {
                    $('#to').val(res.email_obj);
                }
                else if(res.email !==null){
                    $('#to').val(res.email);
                }
                $('#mail_modal').modal('show');
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
            "url": '/api/v1/unresolved/' + edit_id + '/',
            "success": function (res) {
                $('#edit_modal').modal('hide');
                notify('', 'Contact Request Updated successfully', '', 'success', 2000);
                unresolved.clearPipeline().draw();
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

        unresolved.iCacheLower = -1;
        unresolved.clearPipeline();
        unresolved.columns(1).search(from);
        unresolved.columns(2).search(to);
        unresolved.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });

    /**
     * Check if the switch is on or off
     */
    $(document).on('change', '.lock', function () {
        let switched = $(this).prop('checked');
        console.log('ID:', $(this).data('uid'), switched);
        let uid =  $(this).data('uid');
        let notification = 'Resolved successfully';
        let data = {};
        if (switched === true) {
            data.status = 1;
            // notification = notification + '</br> User has been locked';
        } else {
            data.status = 2;
            // notification = notification + '</br> User has been unlocked';
        }
        let parsedData = JSON.stringify(data);
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this information!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, resolve it!",
        }).then(function () {
            $.ajax({
            url: '/api/v1/unresolved/' + uid +"/",
            method: 'PATCH',
            "processData": false,
            "contentType": 'application/json',
            "cache": false,
            data: parsedData,
            success: function (res) {
                notify('',notification , '', 'success', 3000);
                // location.reload();
                unresolved.ajax.url($.fn.dataTable.pipeline({
                    url: '/api/v1/unresolved/',
                }));
                unresolved.ajax.reload(null, false);
            },

            error: function (res) {
                $.each(JSON.parse(res.responseText), function (key, value) {
                    var nMessage = value;
                    notify('', '' + nMessage, '', 'danger', '5000');
                });
            }
        });
        });

    });
}