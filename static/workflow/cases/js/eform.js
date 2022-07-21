/**
 * Created by rawnak on 6/14/17.
 */
// common case form setup
function CommonFormSet(task_id, app_id, query_id, delegation_id) {
    query_id = query_id || null;
    delegation_id = delegation_id || null;
    if (extra_ != 'history') {
        $application_list.hide();
    }
    $common_case_form.show();

    var case_page = '//' + location.host + '/workflow/case/inbox';

    var $new_form = $('#new_form'),
        $new_comment = $('#new_comment'),
        // $new_comment = $('#'),
        $frm_name = $('#form_name'),
        $form_summary_button = $('#form_summary_button'),
        $form_query_button = $('#form_query_button'),
        $add_query_button = $('#add_query_button'),
        $form_summary_modal = $('#form_summary_modal'),
        $form_query_modal = $('#form_query_modal'),
        $add_query_modal = $('#add_query_modal'),
        $app_id = $('#application_id'),
        $pre_comment = $('.comment_side').find('.pre_comment'),
        $form_comment_count = $('#form_comment_count'),
        $comment_write = $('#new_comment').find('textarea'),
        $url = case_form + task_id + '/?application=' + app_id,
        $del_status,
        $submit_info = {};
    if (extra_ != 'history') {
        $url = case_form + task_id + '/?application=' + app_id;
    }

    function QueryInfo(success_data) {
        var html = '';
        return html = `<tr data-query-id="${success_data.id}">
                <td>${success_data.query}</td>
                <td>${success_data.user_from_name}</td>
                <td>${success_data.date}</td>
                <td>${success_data.user_to_name}</td>
                <td>${success_data.query_answer ? success_data.query_answer : `--`}</td>
                <td>${success_data.answer_date ? success_data.answer_date : `--`}</td>
            </tr>`;
    }

    function GetSubmitButtonName(event) {
        var submitButton;
        if (typeof event.originalEvent != 'undefined') {  //
            submitButton = event.originalEvent;
        } else if (typeof document.activeElement.value != 'undefined') {  // IE
            submitButton = document.activeElement;
        }
        return submitButton.name;
    }

    if (extra_ == 'query') {
        $url = "/api/v1/workflow/query_inbox/?query_id=" + query_id
    } else if (extra_ == 'history') {
        $url = "/api/v1/workflow/query_inbox/?delegation_id=" + delegation_id
    }
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
     var submit_button_group = "input[name='_approve_'], input[name='_recheck_'], input[name='_reject_'], input[name='save_as_draft']";
    $(document).off('click.rew').on('click.rew', submit_button_group, function (e) {
         e.preventDefault();
        //var clickbutton = GetSubmitButtonName(e);
        var clickbutton = this.name;
        if (clickbutton === 'save_as_draft') {
            $new_form.append(`<input type='hidden' name='` + clickbutton + `' value="1">`);
            $new_form.find($('input[name=_recheck_]').not(':submit')).remove();
            $new_form.find($('input[name=_reject_]').not(':submit')).remove();
            $new_form.find($('input[name=_approve_]').not(':submit')).remove();
            SubmitForm();

        }
        else if (clickbutton === '_recheck_') {
            if($("input[name='comment']").val() != '') {
                $new_form.append(`<input type='hidden' name='` + clickbutton + `' value="1">`);
                $new_form.find($('input[name=save_as_draft]').not(':submit')).remove();
                $new_form.find($('input[name=_reject_]').not(':submit')).remove();
                $new_form.find($('input[name=_approve_]').not(':submit')).remove();
                SubmitForm();
            }else{
                notify('Please ', 'fill up the comment.', '', 'danger', 6000)
            }

        }
        else if (clickbutton === '_reject_') {
            if($("input[name='comment']").val() != '') {
                $new_form.append(`<input type='hidden' name='` + clickbutton + `' value="1">`);
                $new_form.find($('input[name=save_as_draft]').not(':submit')).remove();
                $new_form.find($('input[name=_recheck_]').not(':submit')).remove();
                $new_form.find($('input[name=_approve_]').not(':submit')).remove();
                SubmitForm();
            }else{
                notify('Please ', 'fill up the comment.', '', 'danger', 6000)
            }
        }
        else if (clickbutton === '_approve_') {
            window.Parsley.addValidator('fileextension', {
                    validateString: function (value, requeriment, instance) {
                        var element = instance.$element[0].files;
                        for (var i = 0; i < instance.$element[0].files.length; i++) {
                            var ext = instance.$element[0].files[i].name.split('.').pop();
                            return (ext.toLowerCase() == "pdf");
                        }
                    },
                    messages: {
                        en: 'Please select PDF files'
                    }
                });
            let process_form = $(document).find($new_form).parsley();
            process_form.validate();
            if (process_form.isValid()) {
                $new_form.append(`<input type='hidden' name='` + clickbutton + `' value="1">`);
                $new_form.find($('input[name=save_as_draft]').not(':submit')).remove();
                $new_form.find($('input[name=_recheck_]').not(':submit')).remove();
                $new_form.find($('input[name=_reject_]').not(':submit')).remove();
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
                    $('#collapseOne').attr('style', '');
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
    });

    /*--------- Query Submit ------*/
    $('#answer_form').on('submit', (e) => {
        e.preventDefault();
        if ($('#answer_form').parsley().validate()) {
            var data = {
                answer: $('#answer_form').find('textarea[name=query_answer]').val(),
                is_submit: "1",
                query_id: query_id,
            };
            $.ajax({
                url: query_url,
                method: 'POST',
                data: JSON.stringify(data),
                "processData": false,
                "headers": {
                    "content-type": "application/json",
                },
                success: (data) => {
                    notify('', 'Query answer submitted successfully', '', 'success', 5000);
                    setTimeout(function () {
                        location.reload()
                    }, 1500);
                },
                error: (res) => {
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                    });
                }
            });
        }
    });


    /*------- Summary ---------*/
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
                    url: process_map_url + "?app_id=" + id,
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
                                '<td>' + StatusName(v.status, v.additional_status) + '</td>' +
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

    // Query
    $form_query_button.off('click').on('click', function () {
        $('#query_show_table tbody').find('tr').not('.empty_query_row').remove();
        $('#query_show_table tbody').find('.empty_query_row').show();
        var application_id = $(this).data('id');
        $('#form_query_modal').modal().show();
        // Get previous Query
        $.ajax({
            type: "GET",
            url: query_url + "?user_id=" + userId + " &application=" + app_id + "&task=" + task_id + "&status=query",
            dataType: "json",
            success: function (data) {
                if (data.length > 0) {
                    $('#query_show_table').find('.empty_query_row').hide();
                    $.each(data, function (i, d) {
                        $('#query_show_table tbody').append(QueryInfo(d));
                    });
                } else {
                    $('#query_show_table').find('.empty_query_row').show();
                }
            },
            error: function (response) {
                $('#delegate_show_table').find('.empty_delegation_row').show();
                $.each(JSON.parse(response.responseText), (k, v) => {
                    console.log(k, v)
                });
            }
        });
    });

    //New query
    $add_query_button.off('click').on('click', function () {
        var id = $form_query_button.data('id');
        //Form Reset
        $('#query_text').val('');
        $("#add_query_form .help-block").empty();
        $('#add_query_form .form-group').removeClass('has-error');
        $("#user_to option[value]").remove();

        $('#add_query_modal').modal().show();

        //Users List
        $.ajax({
            type: "GET",
            url: process_map_url + "?app_id=" + app_id + "&is_query=1",
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                    $("#user_to").append($('<option>', {
                        value: d.user+','+d.id,
                        text: d.user_name,
                    }));
                });
                $("#user_to").selectpicker('refresh');
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                });
            }
        });
        // Date
        $('#add_query_form').find('input[name=expiry_date]').datetimepicker({
            format: 'YYYY/MM/DD',
            minDate: moment().add(24, 'h'),
        });
    });

    // Query Submit
    $(document).on('click', '#query_save_button_', function (e) {
        e.preventDefault();
        //validation
        let process_form = $('#add_query_form').parsley();
        process_form.validate();
        if (process_form.isValid()) {
            var $form_name = $('#add_query_form');
            var $form_data = $form_name[0];
            var $processData = new FormData($form_data);
            $processData.append('user_from', userId);
            $processData.append('application', app_id);
            $processData.append('task', task_id);

            $.ajax({
                url: query_url,
                method: 'POST',
                data: $processData,
                processData: false,
                contentType: false,
                success: (data) => {
                    console.log(data);
                    notify('', 'Query has been sent', '', 'success');
                    $('#query_show_table').find('.empty_query_row').hide();
                    $('#query_show_table tbody').append(QueryInfo(data[0]));
                    $add_query_modal.modal('hide');
                },
                error: (res) => {
                    console.log(res);
                    $.each(JSON.parse(res.responseText), (k, v) => {
                        notify('Sorry!! ', v, '', 'danger', 10000);
                    });
                }
            });
            // // Make Data
            // var $form = $('#add_query_form');
            // var $process_data = $form[0];
            // var $processData = new FormData($process_data);
            //     $processData.append('user_from', userId);
            //     $processData.append('application', app_id);
            //     $processData.append('task', task_id);
            //
            // // post data
            // $.ajax({
            //     url: query_url,
            //     method: 'POST',
            //     processData: false,
            //     contentType: false,
            //     success: (data) => {
            //         console.log(data);
            //         notify('', 'Query has been sent', '', 'success');
            //         $('#query_show_table').find('.empty_query_row').hide();
            //         $('#query_show_table tbody').append(QueryInfo(data[0]));
            //         $('#add_query_button').prop('disabled', true);
            //         $add_query_modal.modal('hide');
            //     },
            //     error: (res) => {
            //         $.each(JSON.parse(res.responseText), (k, v) => {
            //             notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
            //         });
            //     }
            // });
        }


    });

    /*--- Set Form */
    function FormSetUP(data) {
        if (data.type === 'eform' || data.type === 'query_view' || data.type === 'history_view') {
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
            if (extra_ == 'query') {
                $form_summary_button.data("query_id", data.id);
            }
            $form_query_button.data("id", data.application.id);

            /*--- textarea auto-size -----*/
            $(".auto-size")[0] && autosize($(".auto-size"));

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

            // Query & history show
            if (extra_ == 'history' || (extra_ == 'query' && query_id != null)) {
                $('.answer_side').find('.detail_query').text(data.query);
                $('#new_form').find('input, textarea, button, select').attr('disabled', 'disabled');
            }

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

            /*--- remove save_as_draft button change color of button -----*/
            if (extra_ == 'draft') {
                $new_form.find('input[name=_recheck_], input[name=_reject_]').closest('.form-group').parent().remove();
            } else {
                $new_form.find('input[name=save_as_draft]').closest('.form-group').parent().remove();
            }
            $new_form.find('input[name=_recheck_]').css("cssText", "background: #ff9800 !important;");
            $new_form.find('input[name=_reject_]').css("cssText", "background: #EE4E50 !important;");
            $new_form.find('input[name=save_as_draft]').css("cssText", "background: #a169ff !important;");
            //here
        }
        else if (data.type == 'task') {
            if (data.end == true) {
                //Complete
                swal({
                    title: "Good Job",
                    text: data.detail,
                    type: "success",
                    showCancelButton: false,
                    confirmButtonText: "OK",
                    allowOutsideClick: false
                }).then(function (isConfirm) {
                    if (isConfirm) {
                        if (data.upload_dms == true) {
                            swal({
                                title: "Upload Files!!",
                                text: "Do you want to upload files to DMS ",
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Yes",
                                cancelButtonText: "No",
                            }).then(function (isConfirm) {
                                if (isConfirm) {
                                    window.open('/dms/document/upload/standard_upload/filesave/application/' + app_id, '_blank');
                                    window.top.close();
                                }
                            }, function (dismiss) {
                                location.reload();
                            });
                        } else {
                            location.reload();
                        }

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
                    if (data.parallel == true) {
                        swal({
                            title: "Good Job",
                            text: "Multiple users have been assigned to the next task as it is going as parallel.",
                            type: "success",
                            showCancelButton: false,
                            confirmButtonText: "Continue",
                            allowOutsideClick: false
                        }).then(function (isConfirm) {
                            if (isConfirm) {
                                location.reload();
                            } else {
                                return false;
                            }
                        });
                    } else {
                        var detail_title = ""
                        if (data.recheck == true) {
                            detail_title = "Application has been send for recheck"
                        }
                        else if (data.reject == true){
                            detail_title = 'The application has been rejected. This is being sent to the documentation team for storage'
                        }
                        if (data.recheck == true || data.reject == true) {
                            swal({
                                title: detail_title,
                                text: "<p class='f-500'>To Task: " + data.target + "</p><p class='f-500'> User: " + data.user + "</p>",
                                type: "success",
                                showCancelButton: false,
                                confirmButtonText: "Continue",
                                allowOutsideClick: false
                            }).then(function (isConfirm) {
                                if (isConfirm) {
                                    location.reload();
                                } else {
                                    return false;
                                }
                            });
                        } else {
                            swal({
                                title: "Good Job",
                                text: "<p class='f-500'>Next Task: " + data.target + "</p><p class='f-500'>Next User: " + data.user + "</p>",
                                type: "success",
                                showCancelButton: false,
                                confirmButtonText: "Continue",
                                allowOutsideClick: false
                            }).then(function (isConfirm) {
                                if (isConfirm) {
                                    location.reload();
                                } else {
                                    return false;
                                }
                            });
                        }
                    }
                }
            }
        }
        else if (data.type == 'draft') {
            notify('', data.detail, '', 'success', 5000);
            setTimeout(function () {
                location.reload()
            }, 1500);
        }
        // else{
        //     //eform Load
        //     FormClear();
        //     $('#application_id').append('Application ID: ' + data.application.number);
        //     customer != 'xcb59hj' ? $new_form.append(data.eform.html) : '';
        //
        //     /*---- marico ----*/
        //     if (customer == 'xcb59hj') {
        //         var eform = $('#marico_capture_form');
        //         eform.find("input[name=project]").val(data.application.project);
        //         eform.find("input[name=task]").val(data.id);
        //         eform.find("input[name=application]").val(data.application.id);
        //         eform.find("input[name=process]").val(data.process);
        //         eform.find("input[name=next_pos]").val(data.next_pos);
        //     }
        //
        //     $new_form.append("<input type='hidden' value='" + data.application.project + "' name='project'>" +
        //         "<input type='hidden' value='" + data.id + "' name='task'>" +
        //         "<input type='hidden' value='" + data.application.id + "' name='application'>" +
        //         "<input type='hidden' value='" + data.process + "' name='process'>" +
        //         "<input type='hidden' value='" + data.next_pos + "' name='next_pos'>");
        //
        //     $submit_info.application_id = data.application.id;
        //
        //     $del_status = data.application.status;
        //     $form_summary_button.data("id", data.application.id);
        //     if (extra_ == 'query') {
        //         $form_summary_button.data("query_id", data.id);
        //     }
        //     $form_query_button.data("id", data.application.id);
        //
        //     /*--- Select Picker ----*/
        //     if ($new_form.find($('.selectpicker').length > 0)) {
        //         $new_form.find($('.selectpicker')).each(function () {
        //             var $self = $(this);
        //             $self.val($self.attr('value'));
        //             $self.selectpicker();
        //         })
        //     }
        //
        //     /*--- DateTime Picker ----*/
        //     if ($new_form.find('.date-time-picker').length > 0) {
        //         $new_form.find('.date-time-picker').each(function () {
        //             var $location = $(this),
        //                 $format = $location.data('format'),
        //                 $use_current = $location.data('use_current'),
        //                 $view_mode = $location.data('view_mode'),
        //                 $conf = {
        //                     format: $format,
        //                     useCurrent: $use_current,
        //                     viewMode: $view_mode,
        //
        //                 };
        //             if ($location.data('min_date') != '') {
        //                 $conf.minDate = '+' + $location.data('min_date');
        //             }
        //             if ($location.data('default_date') != '') {
        //                 $conf.defaultDate = '+' + $location.data('default_date');
        //             }
        //             if ($location.data('max_date') != '') {
        //                 $conf.maxDate = '+' + $location.data('max_date');
        //             }
        //             if (data.eform.name === 'Marico Accounts Payable Solution - Capture' && $('#new_form').find('#receipt_date').length > 0) {
        //                 $conf.defaultDate = moment();
        //             }
        //             /*--- Marico requirements ----*/
        //             if ($('#new_form').find('#posting_date').length > 0) {
        //                 $conf.defaultDate = moment();
        //             }
        //             /*--- Marico requirements ----*/
        //             if ($new_form.find('#document_date').length > 0) {
        //                 $conf.maxDate = moment();
        //             }
        //             $location.datetimepicker(
        //                 $conf
        //             );
        //         });
        //     }
        //
        //     //Comment
        //     $.ajax({
        //         url: app_comment_url + "?app_id=" + data.application.id,
        //         method: "GET",
        //         dataType: "JSON",
        //         success: function (data) {
        //             $form_comment_count.empty().append("(" + data.length + ")");
        //             if (data.length > 0) {
        //                 $pre_comment.empty();
        //                 $.each(data, function (k, v) {
        //                     $pre_comment.prepend("<div class='list-group-item'>" +
        //                         "<div class='media-body'> " +
        //                         "<div class='lgi-heading'>" + v.user_name + "</div> " +
        //                         "<small> " + v.comment + '</small> ' +
        //                         "<ul class='lgi-attrs'>" +
        //                         "<li>Task: " + v.task_name + "</li>" +
        //                         "<li>" + moment(v.date).format('MMM Do YY, h:mm a') + "</li>" +
        //                         "</ul>" +
        //                         "</div>" +
        //                         "</div>");
        //                 });
        //             }
        //         },
        //         error: function (response) {
        //             $.each(JSON.parse(response.responseText), (k, v) => {
        //                 notify('Sorry!!! ', v.detail, '', 'danger', 5000)
        //             });
        //         }
        //     });
        //
        //     // Query show
        //     if (extra_ == 'query' && query_id != null) {
        //         $.ajax({
        //             url: "/api/v1/workflow/query_inbox/?query_id=" + query_id,
        //             method: "GET",
        //             dataType: "JSON",
        //             success: function (data) {
        //                 $('.answer_side').find('.detail_query').text(data.query);
        //             },
        //             error: function (response) {
        //                 $.each(JSON.parse(response.responseText), (k, v) => {
        //                     notify('Sorry!!! ', v.detail, '', 'danger', 5000)
        //                 });
        //             }
        //         });
        //         $new_form.click(function(){return false;});
        //     }
        //
        //     // Show upload file names
        //     $new_form.find("input:file").change(function (e) {
        //
        //         var $near_class = $(this).parent();
        //         var files = e.target.files;
        //
        //         for (var i = 0, file; file = files[i]; i++) {
        //             $near_class.siblings(".files_list").append('<li>' + file.name + '</li>')
        //         }
        //     });
        //     $new_form.find('input:file').on('click', function () {
        //         var $length = $(this).parent().siblings('.files_list').children().length;
        //         if ($(this).val() != "" || $length > 0) {
        //             $(this).parent().siblings('.files_list').empty();
        //         }
        //     });
        // }
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
        var $form_name;
        (customer == 'xcb59hj') ? $form_name = $('#marico_capture_form') : $form_name = $new_form;
        var $form_data = $form_name[0];
        var $formData = new FormData($form_data);
        if ($formData.has('_recheck_') == false) {
            $formData.append('_recheck_', 0)
        }
        if ($formData.has('_approve_') == false) {
            $formData.append('_approve_', 0)
        }

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