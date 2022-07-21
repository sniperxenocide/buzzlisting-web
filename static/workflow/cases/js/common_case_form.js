{
    /*------- ajax call loader ------*/
    $(document).bind("ajaxSend", function () {
        $('.loader').show();
    }).bind("ajaxStop", function () {
        $('.loader').hide();
    });

    // function StatusName(status) {
    //     var status_name;
    //     if (status == 1) {
    //         status_name = "Todo"
    //     } else if (status == 2) {
    //         status_name = "Open"
    //     } else if (status == 0) {
    //         status_name = "Complete"
    //     }
    //     return status_name;
    // }

    if (task_id) {
        var new_case_page = '//' + location.host + '/workflow/case/new_case';

        var $new_form = $('#new_form'),
            $new_comment = $('#new_comment'),
            $frm_name = $('#form_name'),
            $form_summary_button = $('#form_summary_button'),
            $form_summary_modal = $('#form_summary_modal'),
            $app_id = $('#application_id'),
            $pre_comment = $('.comment_side').find('.pre_comment'),
            $form_comment_count = $('#form_comment_count'),
            $comment_write = $('#new_comment').find('textarea'),
            $url = case_form + task_id + '/?application=' + app_id,
            $del_status,
            $submit_info = {};
        $.ajax({
            url: $url,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                FormSetUP(data);
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify('Sorry!!! ', v, '', 'danger', 5000);
                });
            }
        });

        /*---------- Form submit-----------*/
        $new_form.on('submit', (e) => {
            e.preventDefault();
            let process_form = $new_form.parsley();
            process_form.validate();
            if (process_form.isValid()) {
                if ($new_form.find('#invoice_number').length > 0 && $del_status == 'OPEN') {

                    let data = {};
                    data.keyword = $('#invoice_number').val();
                    data.start = 0;
                    data.length = 30;
                    data.draw = 1;
                    data.search_type = "standard";
                    $.ajax({
                        url: "/api/v1/workflow/search/",
                        method: 'POST',
                        data: JSON.stringify(data),
                        processData: false,
                        headers: {
                            "content-type": "application/json",
                        },
                        success: function (res) {
                            if (res.recordsTotal == 0) {
                                SubmitForm();
                            } else {
                                notify('Sorry!! ', 'Invoice number should be unique', '', 'danger', 5000)
                            }
                        }
                    });
                } else {
                    SubmitForm();
                }
            }
        });


        /*--------- New Comment Submit ------*/
        $new_comment.on('submit', (e) => {
            e.preventDefault();
            if ($('#new_comment').parsley().validate()) {
                var data = {
                    application: $submit_info.application_id,
                    task: task_id,
                    user: parseInt(user),
                    comment: $new_comment.find("[name='comment']").val()
                };
                $.ajax({
                    url: app_comment_url,
                    method: 'POST',
                    data: JSON.stringify(data),
                    "processData": false,
                    "headers": {
                        "content-type": "application/json",
                    },
                    success: (data) => {
                        $('#new_comment').trigger("reset");
                        if (data) {
                            $.ajax({
                                url: app_comment_url + "?app_id=" + $submit_info.application_id,
                                method: "GET",
                                dataType: "JSON",
                                success: function (data) {
                                    $form_comment_count.empty().append("(" + data.length + ")");
                                    if (data.length > 0) {
                                        $pre_comment.empty();
                                        $.each(data, function (k, v) {
                                            console.log(v);
                                            $pre_comment.prepend("<div class='list-group-item'>" +
                                                "<div class='media-body'> " +
                                                "<div class='lgi-heading'>" + v.user_name + "</div> " +
                                                "<small> " + v.comment + '</small> ' +
                                                "<ul class='lgi-attrs'>" +
                                                "<li>Task: " + v.task_name + "</li>" +
                                                "<li>" + moment(v.date).format('MMM Do YY, h:mm a') + "</li>" +
                                                "</ul>" +
                                                "</div>" +
                                                "</div>");
                                        });
                                    }
                                },
                                error: function (response) {
                                    $.each(JSON.parse(response.responseText), (k, v) => {
                                        notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                                    });
                                }
                            });
                        }
                        $('#collapseOne').addClass('in').prev().addClass('active');
                        $('#collapseOne').attr('style','');
                    },
                    error: (res) => {
                        $.each(JSON.parse(res.responseText), (k, v) => {
                            notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                        });
                    }
                });
            }
        });


        /*-------Summary ---------*/
        $form_summary_button.off('click').on('click', function () {
            var id = $(this).data('id');
            //alert(id);
            /*----- Tab Data -------*/
            $('a[data-toggle="tab"]').off('shown.bs.tab').on('shown.bs.tab', function (e) {
                var $target = $(e.target).attr("href");
                //alert(target);
                if (($target == '#form_general_info')) {
                    var $url = general_info + id;
                    $.ajax({
                        url: $url,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            var $process_info = $($target).find('#process_info'),
                                $form_task_info = $($target).find('#form_current_task'),
                                $finish_date = null;

                            (data.delegation[0].delegation_finish_date == null) ? $finish_date = '' : $finish_date = moment(data.delegation[0].delegation_finish_date).format('MMMM Do YYYY, h:mm a')

                            $process_info.find('.title').text(data.process_name);
                            $process_info.find('.description').text(data.description);
                            $process_info.find('.category').text(data.category);
                            $process_info.find('.author').text('');
                            $process_info.find('.create_date').text(moment(data.process_created_date).format('MMMM Do YYYY, h:mm a'));

                            $form_task_info.find('.title').text(data.delegation[0].task);
                            $form_task_info.find('.init_date').text(moment(data.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a'));
                            $form_task_info.find('.finish_date').text($finish_date)
                            $form_task_info.find('.due_date').text(moment(data.delegation[0].delegation_due_date).format('MMMM Do YYYY, h:mm a'))
                            $form_task_info.find('.task_duration').text(data.delegation[0].duration)
                        },
                        error: function (response) {
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                            });
                        }
                    });
                }
                else if ($target == '#form_process_map') {
                    $.ajax({
                        url: '//' + location.host + '/api/v1/workflow/process_map/?app_id=' + id,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            $('#form_map_table').empty();
                            $.each(data, (k, v) => {

                                var $time_taken, $finish_date;

                                (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
                                (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
                                $('#form_map_table').append('<tr>' +
                                    '<td>' + v.task_name + '</td>' +
                                    '<td>' + v.user_name + '</td>' +
                                    '<td>' + moment(v.init_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
                                    '<td>' + moment(v.due_date).format('MMMM Do YYYY, h:mm a') + '</td>' +
                                    '<td>' + $finish_date + '</td>' +
                                    '<td>' + $time_taken + '</td>' +
                                    '<td>' + StatusName(v.status) + '</td>' +
                                    '</tr>')
                            });
                        },
                        error: function (response) {
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                            });
                        }
                    });
                }
            });
            $('.tab-nav a[href="#form_general_info"]').tab('show');

            $form_summary_modal.modal().show();
        });


        /*--- Set Form */
        function FormSetUP(data) {
            if (data.type == 'eform') {
                //eform Load
                FormClear();
                $('#application_id').append('Application ID: ' + data.application.number);
                customer != 'xcb59hj' ? $new_form.append(data.eform.html) : '';

                /*---- marico ----*/
                if (customer == 'xcb59hj') {
                    var eform = $('#marico_capture_form');
                    eform.find("input[name=project]").val(data.application.project);
                    eform.find("input[name=task]").val(data.id);
                    eform.find("input[name=application]").val(data.application.id);
                    eform.find("input[name=process]").val(data.process);
                    eform.find("input[name=next_pos]").val(data.next_pos);
                }

                $new_form.append("<input type='hidden' value='" + data.application.project + "' name='project'>" +
                    "<input type='hidden' value='" + data.id + "' name='task'>" +
                    "<input type='hidden' value='" + data.application.id + "' name='application'>" +
                    "<input type='hidden' value='" + data.process + "' name='process'>" +
                    "<input type='hidden' value='" + data.next_pos + "' name='next_pos'>");

                $submit_info.application_id = data.application.id;

                $del_status = data.application.status;
                $form_summary_button.data("id", data.application.id);

                /*--- Select Picker ----*/
                if ($new_form.find($('.selectpicker').length > 0)) {
                    $new_form.find($('.selectpicker')).each(function () {
                        var $self = $(this);
                        $self.val($self.attr('value'));
                        $self.selectpicker();
                    })
                }

                /*--- DateTime Picker ----*/
                if ($new_form.find('.date-time-picker').length > 0) {
                    $new_form.find('.date-time-picker').each(function () {
                        var $location = $(this),
                            $format = $location.data('format'),
                            $use_current = $location.data('use_current'),
                            $view_mode = $location.data('view_mode'),
                            $conf = {
                                format: $format,
                                useCurrent: $use_current,
                                viewMode: $view_mode,

                            };
                        if ($location.data('min_date') != '') {
                            $conf.minDate = '+' + $location.data('min_date');
                        }
                        if ($location.data('default_date') != '') {
                            $conf.defaultDate = '+' + $location.data('default_date');
                        }
                        if ($location.data('max_date') != '') {
                            $conf.maxDate = '+' + $location.data('max_date');
                        }
                        if (data.eform.name === 'Marico Accounts Payable Solution - Capture' && $('#new_form').find('#receipt_date').length > 0) {
                            $conf.defaultDate = moment();
                        }
                        /*--- Marico requirements ----*/
                        if ($('#new_form').find('#posting_date').length > 0) {
                            $conf.defaultDate = moment();
                        }
                        /*--- Marico requirements ----*/
                        if ($new_form.find('#document_date').length > 0) {
                            $conf.maxDate = moment();
                        }
                        $location.datetimepicker(
                            $conf
                        );
                    });
                }

                //Comment
                $.ajax({
                    url: app_comment_url + "?app_id=" + data.application.id,
                    method: "GET",
                    dataType: "JSON",
                    success: function (data) {
                        $form_comment_count.empty().append("(" + data.length + ")");
                        if (data.length > 0) {
                            $pre_comment.empty();
                            $.each(data, function (k, v) {
                                $pre_comment.prepend("<div class='list-group-item'>" +
                                    "<div class='media-body'> " +
                                    "<div class='lgi-heading'>" + v.user_name + "</div> " +
                                    "<small> " + v.comment + '</small> ' +
                                    "<ul class='lgi-attrs'>" +
                                    "<li>Task: " + v.task_name + "</li>" +
                                    "<li>" + moment(v.date).format('MMM Do YY, h:mm a') + "</li>" +
                                    "</ul>" +
                                    "</div>" +
                                    "</div>");
                            });
                        }
                    },
                    error: function (response) {
                        $.each(JSON.parse(response.responseText), (k, v) => {
                            notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                        });
                    }
                });

                // Show upload file names
                $new_form.find("input:file").change(function (e) {

                    var $near_class = $(this).parent();
                    var files = e.target.files;

                    for (var i = 0, file; file = files[i]; i++) {
                        $near_class.siblings(".files_list").append('<li>' + file.name + '</li>')
                    }
                });
                $new_form.find('input:file').on('click', function () {
                    var $length = $(this).parent().siblings('.files_list').children().length;
                    if ($(this).val() != "" || $length > 0) {
                        $(this).parent().siblings('.files_list').empty();
                    }
                });

            }
            else if (data.type == 'task') {
                if (data.end == true) {
                    //Complete
                    swal({
                        title: "Good Job",
                        text: "This application is completed",
                        type: "success",
                        showCancelButton: false,
                        confirmButtonText: "OK",
                        allowOutsideClick: false
                    }).then(function (isConfirm) {
                        if (isConfirm) {
                            window.location = new_case_page;
                        } else {
                            return false;
                        }
                    });
                }
                else if (data.end == false) {
                    if (data.manual == true) {
                        $.each(data.user, function (i, d) {
                            $("#next_user").append($('<option>', {
                                value: d.id,
                                text: d.name,
                            }));
                        });
                        $("#next_user").selectpicker('refresh');
                        $('#next_user_modal').modal({backdrop: 'static', keyboard: false}).show();
                        $('#save_next_user').on('click', (e) => {
                            e.preventDefault();
                            let process_form = $('#next_user_form').parsley();
                            process_form.validate();
                            if (process_form.isValid()) {
                                var $form_name;
                                (customer == 'xcb59hj') ? $form_name = $('#marico_capture_form') : $form_name = $new_form;

                                $form_name.append("<input type='hidden' value='" + parseInt($('#next_user').val()) + "' name='manual_final_user'>" +
                                    "<input type='hidden' value='true' name='manual'>");
                                SubmitForm();
                            }

                        });
                    } else if (data.manual == false) {
                        swal({
                            title: "Good Job",
                            text: "<p class='f-500'>Next Task: " + data.target + "</p><p class='f-500'>Next User: " + data.user + "</p>",
                            type: "success",
                            showCancelButton: false,
                            confirmButtonText: "Continue",
                            allowOutsideClick: false
                        }).then(function (isConfirm) {
                            if (isConfirm) {
                                window.location = new_case_page;
                            } else {
                                return false;
                            }
                        });
                    }
                }
            }
        }


        /*--- Clear Form -----*/
        function FormClear() {
            $new_form.empty();
            $frm_name.empty();
            $app_id.empty();
            $form_summary_button.removeData('id');

        }


        /*---- Submit Form -----*/
        function SubmitForm() {
            //new
            var $form_name;
            (customer == 'xcb59hj') ? $form_name = $('#marico_capture_form') : $form_name = $new_form;
            var $form_data = $form_name[0];
            var $formData = new FormData($form_data);
            //new end

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
                    console.log(res);
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify('Sorry!! ', v, '', 'danger', 10000);
                    });
                }
            });
        }
    }
}
