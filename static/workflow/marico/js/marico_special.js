{
    //doT Template settings
    doT.templateSettings = {
        evaluate: /\{\{([\s\S]+?)\}\}/g,
        interpolate: /\{\{=([\s\S]+?)\}\}/g,
        encode: /\{\{!([\s\S]+?)\}\}/g,
        use: /\{\{#([\s\S]+?)\}\}/g,
        define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
        conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
        varname: 'd',
        strip: true,
        append: true,
        selfcontained: false
    };
    let application_id_ = $('input[name=application]').val(),

        non_po_modal_ = $('#non_po_modal_'),
        po_modal_ = $('#po_modal_'),
        n_po_add_form_ = $('#non_po_add_form_'),
        po_add_form_ = $('#po_add_form_'),
        po_information_area_ = $('#po_information_area_'),
        po_clean_info_modal_ = $('#po_clean_info_modal_'),
        delete_non_po_ = $('#delete_non_po_'),
        n_po_document_date_ = $('#n_po_document_date_'),
        n_po_posting_date_ = $('#n_po_posting_date_'),
        po_document_date_ = $('#po_document_date_'),
        po_posting_date_temp_ = $('#po_posting_date_temp_'),
        po_save_button_ = $('#po_save_button_'),
        marico_capture_form = $('#marico_capture_form'),
        marico_capture_form_submit = $('#marico_capture_form_submit'),
        department_saved_id = $('#department_saved_id'),
        contact_person_saved_id = $('#contact_person_saved_id'),
        gr_modal_ = $('#gr_modal_'),
        gr_modal_view = $('#gr_modal_view'),
        gr_save_button_ = $('#gr_save_button_'),
        gr_add_form_ = $('#gr_add_form_'),
        last_checked_val_ = null;

    var gr_api = '/api/v1/workflow/gr/';

    //remove from Array
    jQuery.removeFromArray = function (value, arr) {
        return jQuery.grep(arr, function (elem, index) {
            return elem !== value;
        });
    };
    // apply parsley after load
    let n_po_add_form_parsley_ = n_po_add_form_.parsley(),
        po_add_form_parsley_ = po_add_form_.parsley();

    /*---- Department -----*/
    let $department = $('#id_department'),
        $contact_person = $('#id_contact_person'),
        $mobile = $('#id_mobile'),
        $depthId;

    function ClearContactperson_Mobile() {
        $contact_person.find('option').remove().end().append('<option value="">Select Please</option>').val('');
        $contact_person.selectpicker('refresh');
        $mobile.val('');
    }

    //on load remove options
    $contact_person.each(function () {
        $(this).find('option').remove();
    });

    $department.each(function () {
        $(this).find('option').remove().end().append('<option value="">Select Please</option>').val('');
        $.ajax({
            url: '//' + location.host + '/api/v1/dms/departments/maricodepartments/',
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                $.each(data, function (i, d) {
                    $department.append($('<option>', {
                        value: d.id,
                        text: d.name,
                    }));
                });
                $department.selectpicker('refresh');
                var department = department_saved_id.data('department-saved-id');

                //old data retrieve for department, contactperson, and mobole number
                if (department != "None") {
                    $department.selectpicker('val', [department]);
                    ClearContactperson_Mobile();
                    $.ajax({
                        url: '//' + location.host + '/api/v1/dms/departments/departmentstaff/?deptid=' + department,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            if (data.length > 0) {
                                $.each(data, function (i, d) {
                                    $contact_person.append($('<option>', {
                                        value: d.id,
                                        text: d.first_name + ' ' + d.last_name,
                                    }));
                                    $contact_person.find('option:last').attr('data-mobile', d.phone_number);
                                    //$('#id_contact_person option:last').attr('data-mobile', d.phone_number);
                                });
                                $contact_person.selectpicker('refresh');
                                $contact_person.selectpicker('val', [contact_person_saved_id.data('contact-person-saved-id')]);
                                var $phn_no = $contact_person.find(':selected').data('mobile');
                                $mobile.val($phn_no);
                            } else {
                                ClearContactperson_Mobile();
                                notify('Sorry!!! ', 'No Contact Person found in this department', '', 'danger', 3000)
                            }

                        },
                        error: function (response) {
                            console.log(response);
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                            });
                        }
                    });
                }

            },
            error: function (response) {
                console.log(response);
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                });
            }
        });
    });

    $department.on('change', function () {
        ClearContactperson_Mobile();
        if ($(this).val()) {
            $depthId = $(this).val();
            $.ajax({
                url: '//' + location.host + '/api/v1/dms/departments/departmentstaff/?deptid=' + $depthId,
                method: "GET",
                dataType: "JSON",
                success: function (data) {
                    if (data.length > 0) {
                        $.each(data, function (i, d) {
                            $contact_person.append($('<option>', {
                                value: d.id,
                                text: d.first_name + ' ' + d.last_name,
                            }));
                            $contact_person.find('option:last').attr('data-mobile', d.phone_number);
                            $contact_person.selectpicker('refresh');
                        });
                    } else {
                        ClearContactperson_Mobile();
                        notify('Sorry!!! ', 'No Contact Person found in this department', '', 'danger', 3000)
                    }

                },
                error: function (response) {
                    console.log(response);
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                    });
                }
            });
        }
    });

    $contact_person.on('change', function () {
        var $phn_no = $contact_person.find(':selected').data('mobile');
        $mobile.val($phn_no);
    });
    /*---- End Department ----*/


    // PO/Non PO button actions
    $("input[name='category']").click(() => {
        let category_val_ = last_checked_val_ = parseInt($("input[name='category']:checked").val()),
            po_count_ = parseInt(po_information_area_.data('po-count')),
            po_last_type = parseInt(po_information_area_.data('last-po-type'));


        if (po_count_ && po_last_type !== category_val_) {
            $("input[name='category'][value='" + po_last_type + "']").prop('checked', true);
            po_clean_info_modal_.modal();
        }
        if (!category_val_ && !po_count_) {
            $('#non_po_modal_').modal();
            NonPoMOdalSet();
            $('#add_more_po').hide();
        }

        if (category_val_ && !po_count_) {
            $('#po_modal_').modal();

            PoModalSet();
            $('#add_more_po').show();
        }
    });

    // Save Non-PO item
    $("#non_po_save_button_").click((event) => {
        event.preventDefault();
        n_po_add_form_parsley_.validate();

        if (n_po_add_form_parsley_.isValid()) {
            let $_n_po_form_data = new FormData(n_po_add_form_[0]);
            $_n_po_form_data.append('application', $('input[name=application]').val());

            $.ajax({
                url: '/api/v1/workflow/po/',
                method: 'POST',
                data: $_n_po_form_data,
                contentType: false,
                cache: false,
                processData: false,
                success: (data) => {
                    //po_information_area_.empty();
                    var delete_id = data.id;
                    po_information_area_.data('delete_id', delete_id);

                    var $table = $('#po_nonpo_info_table');
                    var $no_po_row = $table.find('.no_po_info_tr');
                    if ($no_po_row.length > 0) {
                        $no_po_row.remove();
                    }
                    var template = doT.template($('#po_info_table_row').html());

                    data.document_date = moment(data.document_date).format('MMM Do YY, h:mm a');
                    data.posting_date = moment(data.posting_date).format('MMM Do YY, h:mm a');

                    $table.find('tbody').append(template(data));


                    /*po_information_area_.append("<div class='list-group-item media'>" +
                     "<div class='pull-right'> " +
                     "<div class='actions dropdown'> " +
                     "<a href='#'> " +
                     "<i class='zmdi zmdi-delete c-red delete_po' data-id='" + data.id + "'></i> " +
                     "</a> " +
                     "<a href='#'> " +
                     "<i class='zmdi zmdi-plus c-green add_gr' data-id='" + data.id + "'></i> " +
                     "</a> " +
                     "</div> " +
                     "</div> " +
                     "<div class='media-body'> " +
                     "<ul class='lgi-attrs'> " +
                     "<li>Vendor Name: " + data.vendor_name + "</li> " +
                     "<li>Vendor Code: " + data.vendor_code + "</li> " +
                     "<li>Reference: " + data.reference + "</li> " +
                     "<li>Document Date:" + moment(data.document_date).format('MMM Do YY, h:mm a') + "</li> " +
                     "<li>Posting Date: " + moment(data.posting_date).format('MMM Do YY, h:mm a') + "</li> " +
                     "<li>Amount: " + data.amount + "</li> " +
                     "<li>Tax Amount:" + data.tax_amount + "</li> " +
                     "<li>Remark: " + data.remarks + "</li> " +
                     "</ul> " +
                     "<ul class='gr_info'></ul>" +
                     "</div> " +
                     "</div>");*/

                    non_po_modal_.modal('hide');
                    notify('Congratulations!!! ', 'Non-PO Info has been added ', ' ', 'success', 5000);
                    po_information_area_.data('po-count', parseInt(po_information_area_.data('po-count')) + 1);
                    po_information_area_.data('po-last-type', last_checked_val_);


                    /*----- delete Po -----*/
                    /*$('.delete_po').on('click', function (e) {
                     e.preventDefault();
                     console.log($(this).data('id'));
                     var parent = $(this).closest(".list-group-item");
                     $.ajax({
                     type: "DELETE",
                     url: "/api/v1/workflow/po/" + $(this).data('id') + "/",
                     processData: false,
                     contentType: false,
                     success: function (data) {
                     console.log("deleted");
                     parent.remove();
                     notify('Congratulations!!! ', 'Info has been Deleted Successfully', '', 'success');
                     if ($('#po_information_area_').has('div').length < 1) {
                     $('#po_information_area_').append("<h3>No Po added yet.</h3>")
                     }
                     po_information_area_.data('po-count', parseInt(po_information_area_.data('po-count')) - 1);
                     $('input[name=category]').attr("checked", false);
                     },
                     error: function (response) {
                     console.log(response);
                     }
                     });
                     });*/

                    /*----- Add GR-----*/
                    /*$('.add_gr').off('click').on('click', function (e) {
                     e.preventDefault();
                     var gr_parent = $(this).closest(".list-group-item").find('.gr_info');
                     // gr_add_form_.trigger('reset');
                     // $(".help-block").empty();
                     // $('.form-group').removeClass('has-error');
                     // $('.fg-line').removeClass('fg-toggled');
                     gr_add_form_.find($("input[name=po]")).val($(this).data('id'));
                     gr_modal_.modal();

                     // Saving Action
                     gr_save_button_.off('click').on('click', function (e) {
                     e.preventDefault();

                     var form = gr_add_form_.parsley();
                     form.validate();

                     if (form.isValid()) {
                     let gr_add_form_data = new FormData(gr_add_form_[0]);
                     $.ajax({
                     url: '/api/v1/workflow/gr/',
                     method: 'POST',
                     data: gr_add_form_data,
                     processData: false,
                     contentType: false,
                     success: (data) => {
                     gr_modal_.modal('hide');
                     gr_parent.append("<li>" + data.number + "</li>")


                     },
                     error: (res) => {
                     $.each(JSON.parse(res.responseText), (k, v) => {
                     notify('Sorry!! ', v.detail, '', 'danger', 5000)
                     });
                     },
                     });

                     }
                     })
                     });*/
                },
                error: (response) => {
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify('Sorry!! ', v, '', 'danger', 5000)
                    });
                }
            })
        }
    });

    var po_delete_list = [];
    // Save PO item
    po_save_button_.off('click').on('click', (event) => {
        event.preventDefault();
        po_add_form_parsley_.validate();
        if (po_add_form_parsley_.isValid()) {
            let $po_form_data = new FormData(po_add_form_[0]);
            $po_form_data.append('application', $('input[name=application]').val());

            $.ajax({
                url: '/api/v1/workflow/po/',
                method: 'POST',
                data: $po_form_data,
                contentType: false,
                cache: false,
                processData: false,
                success: (data) => {
                    po_delete_list.push(data.id);
                    po_information_area_.data('delete_id', po_delete_list);
                    $.ajax({
                        type: "GET",
                        url: '/api/v1/workflow/po/?application=' + $('input[name=application]').val(),
                        success: function (data) {

                            var $table = $('#po_nonpo_info_table');
                            $table.find('tbody').empty();
                            var $no_po_row = $table.find('.no_po_info_tr');
                            if ($no_po_row.length > 0) {
                                $no_po_row.remove();
                            }
                            var template = doT.template($('#po_info_table_row').html());

                            $.each(data, (k, v) => {

                                v.document_date = moment(v.document_date).format('MMM Do YY, h:mm a');
                                v.posting_date = moment(v.posting_date).format('MMM Do YY, h:mm a');

                                $table.find('tbody').append(template(v));

                                $("#po_modal_").modal('hide');

                                /*po_information_area_.append("<div class='list-group-item media'>" +
                                 "<div class='pull-right'> " +
                                 "<div class='actions dropdown'> " +
                                 "<a href='#'> " +
                                 "<i class='zmdi zmdi-delete c-red delete_po' data-id='" + v.id + "'></i> " +
                                 "</a> " +
                                 "<a href='#'> " +
                                 "<i class='zmdi zmdi-plus c-green add_gr' data-id='" + v.id + "'></i> " +
                                 "</a> " +
                                 "</div> " +
                                 "</div> " +
                                 "<div class='media-body'> " +
                                 "<ul class='lgi-attrs'> " +
                                 "<li>Vendor Name: " + v.vendor_name + "</li> " +
                                 "<li>Vendor Code: " + v.vendor_code + "</li> " +
                                 "<li>Reference: " + v.reference + "</li> " +
                                 "<li>Document Date:" + moment(v.document_date).format('MMM Do YY, h:mm a') + "</li> " +
                                 "<li>Posting Date: " + moment(v.posting_date).format('MMM Do YY, h:mm a') + "</li> " +
                                 "<li>Amount: " + v.amount + "</li> " +
                                 "<li>Tax Amount:" + v.tax_amount + "</li> " +
                                 "<li>Remark: " + v.remarks + "</li> " +
                                 "</ul>" +
                                 "<ul class='gr_info'></ul>" +
                                 "</div> " +
                                 "</div>");*/
                            });

                            if (parseInt(po_information_area_.data('po-last-type')) == 1) {
                                // po_information_area_.css('color', 'red');
                                //po_information_area_.append($("<a href='#' id='add_more_po'>Add more PO</a>"))
                            }
                        },
                        error: function (response) {
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                            });
                        }
                    });
                    non_po_modal_.modal('hide');
                    notify('Congratulations!!! ', 'Non-PO Info has been added ', ' ', 'success', 5000);
                    po_information_area_.data('po-count', parseInt(po_information_area_.data('po-count')) + 1);
                    po_information_area_.data('po-last-type', last_checked_val_);
                },
                error: (response) => {
                    $.each(JSON.parse(response.responseText), (k, v) => {
                        notify('Sorry!! ', v, '', 'danger', 5000)
                    });
                }
            })
        }
        else {
        }
    });

    function NonPoMOdalSet() {
        if (n_po_document_date_.data('DateTimePicker') != undefined) n_po_document_date_.data('DateTimePicker').destroy();
        if (n_po_posting_date_.data('DateTimePicker') != undefined)  n_po_posting_date_.data('DateTimePicker').destroy();
        n_po_document_date_.datetimepicker({
            maxDate: moment().add(1, 'seconds').toDate(),
            defaultDate: moment().toDate(),
            format: 'YYYY-MM-DD hh:mm',
        });
        n_po_document_date_.closest('.fg-line').addClass('fg-toggled');

        n_po_posting_date_.datetimepicker({
            defaultDate: moment(),
            format: 'YYYY-MM-DD'
        });
        n_po_posting_date_.closest('.fg-line').addClass('fg-toggled');
    }


    function PoModalSet() {
        if (po_document_date_.data('DateTimePicker') != undefined) po_document_date_.data('DateTimePicker').destroy();
        if (po_posting_date_temp_.data('DateTimePicker') != undefined)  po_posting_date_temp_.data('DateTimePicker').destroy();

        po_document_date_.datetimepicker({
            maxDate: moment().add(1, 'seconds').toDate(),
            defaultDate: moment().toDate(),
            format: 'YYYY-MM-DD hh:mm'
        });
        po_document_date_.closest('.fg-line').addClass('fg-toggled');

        po_posting_date_temp_.datetimepicker({
            defaultDate: moment(),
            format: 'YYYY-MM-DD'
        });
        po_posting_date_temp_.closest('.fg-line').addClass('fg-toggled');
    }

    //Non-po modal hide reset
    non_po_modal_.on('hidden.bs.modal', function () {
        n_po_add_form_.trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
    });

    //PO modal hide reset
    po_modal_.on('hidden.bs.modal', function () {
        po_add_form_.trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
    });

    //show gr modal
    gr_modal_view.on('hidden.bs.modal', function () {
        $('#gr_show_table').find('tbody').empty();
    });

    //Add GR modal hide reset
    gr_modal_.on('hidden.bs.modal', function () {
        gr_add_form_.trigger('reset');
        $(".help-block").empty();
        $('.form-group').removeClass('has-error');
        $('.fg-line').removeClass('fg-toggled');
    });

    delete_non_po_.on('click', function (e) {
        e.preventDefault();
        var id_list = po_information_area_.data('delete_id');
        if (typeof (id_list) == 'object') {
            var count = 1;
            $.each(id_list, function (k, v) {
                $.ajax({
                    type: "DELETE",
                    url: "/api/v1/workflow/po/" + v + "/",
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        count++;
                    },
                    error: function (response) {
                        console.log(response);
                    }
                });
            });
            po_clean_info_modal_.modal('hide');
            notify('Congratulations!!! ', 'Info has been Deleted Successfully', '', 'success');
            $('#po_nonpo_info_table tbody').empty();
            $('#add_more_po').hide();
            po_information_area_.data('po-count', 0);
            $("input[name='category']").attr("checked", false);
        } else {
            $.ajax({
                type: "DELETE",
                url: "/api/v1/workflow/po/" + id_list + "/",
                processData: false,
                contentType: false,
                success: function (data) {
                    po_clean_info_modal_.modal('hide');
                    notify('Congratulations!!! ', 'Info has been Deleted Successfully', '', 'success');
                    $('#po_nonpo_info_table tbody').empty();
                    $('#add_more_po').hide();
                    po_information_area_.data('po-count', 0);
                    $("input[name='category']").attr("checked", false);
                },
                error: function (response) {
                    console.log(response);
                }
            });
        }

    });

    /*----- Marico Form Submit -----*/
    marico_capture_form_submit.on('click', function (e) {
        e.preventDefault();
        let process_form = marico_capture_form.parsley();
        process_form.validate();
        if (process_form.isValid()) {
            var $form = marico_capture_form[0];
            var $formData = new FormData($form);

            $.ajax({
                url: '//' + location.host + '/api/v1/workflow/application/',
                method: 'POST',
                data: $formData,
                processData: false,
                contentType: false,
                success: (data) => {
                    FormSetUP(data);
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify('Sorry!! ', v, '', 'danger', 5000)
                    });
                },
            });
        }
    });

    /*--- Add More PO ----*/
    $('#add_more_po').on('click', function (e) {
        e.preventDefault();
        $('#po_modal_').modal('show');
        PoModalSet();

    });

    /*----- delete Po -----*/
    $(document).off('click.po_remove').on('click.po_remove', '.delete_po', function (e) {
        e.preventDefault();
        var parent = $(this).closest('tr');
        $.ajax({
            type: "DELETE",
            url: "/api/v1/workflow/po/" + parent.data('po-id') + "/",
            processData: false,
            contentType: false,
            success: function (data) {
                jQuery.removeFromArray(parent.data('po-id'), po_delete_list);
                parent.remove();
                notify('Congratulations!!! ', 'Info has been Deleted Successfully', '', 'success');
                if (!$('#po_nonpo_info_table tbody').find('tr').length > 0) {

                    $('#po_nonpo_info_table tbody').append($('#empty_tr').html())
                }
                po_information_area_.data('po-count', parseInt(po_information_area_.data('po-count')) - 1);
            },
            error: function (response) {
                console.log(response);
            }
        });
    });

    var po_id = null;
    //show all gr of current po
    $(document).off('click.show_gr').on('click.show_gr', '.show_gr', function (e) {
        e.preventDefault();
        po_id = $(this).closest("tr").data('po-id');
        gr_add_form_.find($("input[name=po]")).val(po_id);
        gr_modal_view.modal();

        $.ajax({
            method: 'GET',
            url: '/api/v1/workflow/gr/?po=' + po_id,
            success: function (res) {
                var template = doT.template($('#gr_table_row').html());

                $.each(res, function (k, v) {
                    $('#gr_show_table tbody').append(template(v));
                })
            },
            error: function (res) {
                console.log(res);
            }
        })

    });

    //show gr add modal
    $('#add_gr').off('click.fun').on('click.fun', function () {
        gr_modal_.modal();
    });

    function getGrCount(po_id) {
        $.ajax({
            method: 'GET',
            url: '/api/v1/workflow/gr/?po=' + po_id,
            success: function (res) {
                var totalGr = res.length;

                $('#po_nonpo_info_table').find('[data-po-id="' + po_id + '"] .show_gr').text(totalGr);
            },
            error: function (res) {
                console.log(res);
                var totalGr = res.length;

            }
        });
    }

    // Saving Action
    gr_save_button_.off('click').on('click', function (e) {
        e.preventDefault();

        var form = gr_add_form_.parsley();
        form.validate();

        if (form.isValid()) {
            let gr_add_form_data = new FormData(gr_add_form_[0]);
            $.ajax({
                url: gr_api,
                method: 'POST',
                data: gr_add_form_data,
                processData: false,
                contentType: false,
                "cache": false,
                success: (data) => {
                    console.log(data);
                    getGrCount(po_id);
                    gr_modal_.modal('hide');
                    var template = doT.template($('#gr_table_row').html());
                    $('#gr_show_table tbody').append(template(data));
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify('Sorry!! ', v.detail, '', 'danger', 5000)
                    });
                }
            });

        }
    });

    //remove a GR
    $(document).off('click.lang').on('click.lang', '.delete-gr-row', function () {
        var $tr = $(this).closest('tr');
        var gr_id = $tr.data('gr-id');

        $.ajax({
            method: 'delete',
            url: gr_api + gr_id + '/',
            success: function (res) {
                getGrCount(po_id);
                $tr.remove();
            },
            error: function (res) {
                console.log(res);
            }
        })
    });

    //Gr model open
    gr_modal_.on('show.bs.modal', function () {
        gr_modal_view.css('z-index', 0);
    });
    gr_modal_.on('hide.bs.modal', function () {
        gr_modal_view.css('z-index', 9999);
    })
}