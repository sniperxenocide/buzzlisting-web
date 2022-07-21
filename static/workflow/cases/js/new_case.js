$(document).bind("ajaxSend", function () {
    $('.loader').show();
}).bind("ajaxStop", function () {
    $('.loader').hide();
});

$(document).ready(function () {

    var $dtTbl = $('#process_list');

    function GetSubmitButtonName(event) {
        var submitButton;
        if (typeof event.originalEvent != 'undefined') {  //
            submitButton = event.originalEvent;
        } else if (typeof document.activeElement.value != 'undefined') {  // IE
            submitButton = document.activeElement;
        }
        return submitButton.name;
    }

    if (localStorage.getItem("outer_new") != null) {
        var outerdata = JSON.parse(localStorage.getItem("outer_new"));
        setTimeout(
            function () {
                NewCaseForm(outerdata.process);
            }, 100
        );
        localStorage.removeItem("outer_new");
    }
    else if (out_open == 1) {
        $.ajax({
            url: login_url,
            type: "POST",
            data: {
                username: out_user,
                password: out_password
            },
            success: function () {
                setTimeout(
                    function () {
                        $('#header .pull-right').remove();
                        NewCaseForm(out_task_id);
                    }, 50
                )
            },
            error: function (response) {
                notify('Something went wrong!! ', 'Please try after sometime', '', 'danger', '5000')
            }
        });

    } else {
        $.ajax({
            type: "GET",
            url: init_process + '?init=true',
            success: function (data) {
                if (data.length > 0) {
                    $("#new_form_area").hide();
                    /*---------Data table----------*/
                    $dtTbl.DataTable({
                        processing: true,
                        serverSide: true,
                        ajax: $.fn.dataTable.pipeline({
                            url: init_process + '?init=true',
                            pages: 1 // number of pages to cache
                        }),
                        scrollY: 300,
                        deferRender: true,
                        scroller: true,
                        columns: [
                            {"title": "Process Name", "data": "project_name"},
                            {"title": "Category", "data": "category_name"},
                            {"title": "Description", "data": "description"},
                        ],
                        columnDefs: [
                            {
                                targets: 0,
                                width: '40%',
                                render: (data, a, b) => {
                                    return data + ' ( ' + b.name + ' )'
                                }
                            },
                            {
                                targets: 1,
                                width: '30%',
                                render: (data) => {
                                    if (data == null) {
                                        return "--"
                                    } else {
                                        return data
                                    }
                                }
                            },
                            {
                                targets: 2,
                                width: '30%',
                                render: (data) => {
                                    if (data == '') {
                                        return "--"
                                    } else {
                                        return data
                                    }
                                }
                            }
                        ],
                    });

                    $("#permit").show();

                    /*-----------Single Click----------------*/
                    $dtTbl.find('tbody').on('click', 'tr', function () {
                        var table = $dtTbl.DataTable();
                        var data = table.row(this).data();
                        var $open_button = $('#open_button');

                        if ($(this).hasClass('selected')) {
                            $(this).removeClass('selected');
                            $open_button.removeData('process-id').removeClass('c-black');
                        }
                        else {
                            table.$('tr.selected').removeClass('selected');
                            $(this).addClass('selected');
                            $open_button.addClass("c-black");
                            $open_button.removeData("role-id").data("process-id", data.id);
                            $open_button.attr({
                                "data-toggle": "modal",
                                "data-target": ""
                            });
                        }
                    });
                    // if (localStorage.getItem("outer_new") != null) {
                    //     var outerdata = JSON.parse(localStorage.getItem("outer_new"));
                    //     setTimeout(
                    //         function () {
                    //             NewCaseForm(outerdata.process);
                    //         }, 100
                    //     );
                    //     localStorage.removeItem("outer_new");
                    // }
                    // if (out_open = 1 && out_task_id == 32) {
                    //     $('#header .pull-right').remove();
                    //     NewCaseForm(out_task_id);
                    // }

                    /*----------Open button click----------*/
                    $(document).off('click.re').on('click.re','#open_button' , function () {
                        console.log("ok")
                        if ($(this).data('process-id')) {
                            $('#process_list tr.selected').dblclick();
                        } else {
                            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
                        }
                    });

                    /*-------------Row DoubleClick Start case---------------*/
                    $dtTbl.find('tbody').on('dblclick', 'tr', function () {
                        var table = $('#process_list').DataTable();
                        var data = table.row(this).data();
                        var process_id = data.id;
                        NewCaseForm(process_id);
                        //window.location = '/workflow/case/new_case/' + process_id;
                    });

                } else {
                    $("#new_form_area").hide();
                    $("#not_permit").show();
                }
            },
            error: function (response) {
                console.log(response);
            }
        });
    }

    function NewCaseForm(task_id) {
        $("#not_permit").hide();
        $("#permit").hide();
        $("#new_form_area").show();

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

        var new_case_page = '//' + location.host + '/workflow/case/new_case';
        var $new_form = $('#new_form'),
            $new_comment = $('#new_comment'),
            $summary_button = $('#summary_button'),
            $summary_modal = $('#summary_modal'),
            $app_id = $('#application_id'),
            $del_status,
            $submit_info = {},
            $pre_comment = $('.pre_comment'),
            $comment_count = $('#comment_count'),
            $comment_write = $('#new_comment').find('textarea');
        if (out_open == 1) {
            var $out_open = 'True';
        } else {
            $out_open = 'False';
        }
        $.ajax({
            url: init_process + task_id + '/?startapp=true&out_open=' + $out_open,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                FormSetUP(data);
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    notify('Sorry!!! ', v, '', 'danger', 5000)
                });
            }
        });

        /*---------- Form submit-----------*/

        var submit_button_group = "input[name='_approve_'], input[name='save_as_draft']";
        $(document).off('click.rew').on('click.rew', submit_button_group, function (e) {
            e.preventDefault();
            var clickbutton = this.name;

            // PDF file validation
            window.Parsley.addValidator('fileextension', {
                validateString: function (value, requeriment, instance) {
                    var element = instance.$element[0].files;
                    console.log(element);
                    //var selection = document.getElementById('element');
                    for (var i = 0; i < instance.$element[0].files.length; i++) {
                        var ext = instance.$element[0].files[i].name.split('.').pop();
                        return (ext.toLowerCase() == "pdf");
                    }
                },
                messages: {
                    en: 'Please select PDF files'
                }
            });
            if (clickbutton === 'save_as_draft') {
                $new_form.append(`<input type='hidden' name='` + clickbutton + `' value="1">`);
                SubmitForm();
            } else {
                let process_form = $new_form.parsley();
                process_form.validate();
                if (process_form.isValid()) {
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
                                    $comment_count.empty().append("(" + data.length + ")");
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

        /*-------Summary ---------*/
        $summary_button.off('click').on('click', function () {
            var id = $(this).data('id');

            /*----- Tab Data -------*/
            $('a[data-toggle="tab"]').off('shown.bs.tab').on('shown.bs.tab', function (e) {
                var $target = $(e.target).attr("href");
                //alert(target);
                if (($target == '#general_info')) {
                    var $url = general_info + id;
                    $.ajax({
                        url: $url,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            var $process_info = $($target).find('#process_info'),
                                $task_info = $($target).find('#current_task'),
                                $finish_date = null;

                            (data.delegation[0].delegation_finish_date == null) ? $finish_date = '' : $finish_date = moment(data.delegation[0].delegation_finish_date).format('MMMM Do YYYY, h:mm a')

                            $process_info.find('.title').text(data.process_name);
                            $process_info.find('.description').text(data.description);
                            $process_info.find('.category').text(data.category);
                            $process_info.find('.author').text('');
                            $process_info.find('.create_date').text(moment(data.process_created_date).format('MMMM Do YYYY, h:mm a'));

                            $task_info.find('.title').text(data.delegation[0].task);
                            $task_info.find('.init_date').text(moment(data.delegation[0].delegation_init_date).format('MMMM Do YYYY, h:mm a'));
                            $task_info.find('.finish_date').text($finish_date);
                            $task_info.find('.due_date').text(moment(data.delegation[0].delegation_due_date).format('MMMM Do YYYY, h:mm a'))
                            $task_info.find('.task_duration').text(data.delegation[0].duration)
                        },
                        error: function (response) {
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                            });
                        }
                    });
                }
                else if ($target == '#process_map') {
                    $.ajax({
                        url: '//' + location.host + '/api/v1/workflow/process_map/?app_id=' + id,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            $('#map_table').empty();
                            $.each(data, (k, v) => {

                                (v.finish_date != null) ? $finish_date = moment(v.finish_date).format('MMMM Do YYYY, h:mm a') : $finish_date = "--";
                                (v.time_taken != null) ? $time_taken = v.time_taken : $time_taken = "--";
                                $('#map_table').append('<tr>' +
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
            $('.tab-nav a[href="#general_info"]').tab('show');

            $summary_modal.modal().show();

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
                } else {
                    $new_form.append("<input type='hidden' value='" + data.application.project + "' name='project'>" +
                        "<input type='hidden' value='" + data.id + "' name='task'>" +
                        "<input type='hidden' value='" + data.application.id + "' name='application'>" +
                        "<input type='hidden' value='" + data.process + "' name='process'>" +
                        "<input type='hidden' value='" + data.next_pos + "' name='next_pos'>");
                }

                DatetimepickerRefresh();

                $submit_info.application_id = data.application.id;
                $del_status = data.application.status;
                if (out_open == 1) {
                    $summary_button.remove();
                } else {
                    $summary_button.data("id", data.application.id);
                }

                /*--- Select Picker ----*/
                if ($new_form.find($('.selectpicker').length > 0)) {
                    $new_form.find($('.selectpicker')).each(function () {
                        var $self = $(this);
                        $self.val($self.attr('value'));
                        $self.selectpicker();
                    })
                }

                //Comment
                if (out_open == 1) {
                    $('.comment_side').closest('.card-body').remove();
                } else {
                    $.ajax({
                        url: app_comment_url + "?app_id=" + data.application.id,
                        method: "GET",
                        dataType: "JSON",
                        success: function (data) {
                            $comment_count.empty().append("(" + data.length + ")");
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
                                })
                            }
                        },
                        error: function (response) {
                            $.each(JSON.parse(response.responseText), (k, v) => {
                                notify('Sorry!!! ', v.detail, '', 'danger', 5000)
                            });
                        }
                    });
                }

                // Show upload file names
                $(document).find($new_form).find("input:file").change(function (e) {
                    console.log("ok");
                    var $near_class = $(this).parent();
                    var files = e.target.files;

                    for (var i = 0, file; file = files[i]; i++) {
                        $near_class.siblings(".files_list").append('<li>' + file.name + '</li>')
                    }
                });
                $(document).find($new_form).find('input:file').on('click', function () {
                    var $length = $(this).parent().siblings('.files_list').children().length;
                    if ($(this).val() != "" || $length > 0) {
                        $(this).parent().siblings('.files_list').empty();
                    }
                });


                // /*-------Grid Start--------*/
                // //function
                // function gridRowDelete() {
                //     //grid delete row
                //     $new_form.find('.delete_grid_row').off('click').on('click', function (e) {
                //         e.preventDefault();
                //         $(this).closest('tr').empty();
                //         //$(this).closest('tr').empty();
                //     });
                // }
                //
                // //grid change input name
                // var $grid = $new_form.find('.grid');
                // if ($grid.length > 0) {
                //
                //     $grid.each(function () {
                //         var $gridVar = $(this).data('variable');
                //
                //         if ($(this).find('table').length > 0) {
                //             var $table = $(this).find('tbody'),
                //                 $gridVar2 = $gridVar;
                //             $table.find('tr').each(function () {
                //                 var $row = $(this).index();
                //                 $gridVar = $gridVar2 + '[' + $row + ']';
                //                 $(this).find('td').each(function () {
                //                     if ($(this).find(':input').length > 0) {
                //                         var $input = $(this).find(':input');
                //                         var $new_name = $gridVar + '[' + $input.attr('name') + ']';
                //                         $input.attr('name', $new_name);
                //                     }
                //                 });
                //             });
                //         }
                //     });
                // }
                //
                // //grid add row
                // $('.add_grid_row').off('click').on('click', function (e) {
                //     e.preventDefault();
                //     var $row = $(this).data('add_row'),
                //         $table = $(this).closest('.add_div').siblings('table');
                //     $table.find('tbody').append($row);
                //     var $last_row = $table.find('tbody tr').last(),
                //         $row_index = $last_row.index(),
                //         $gridVar2 = $last_row.data('grid-name'),
                //         $gridVar = $gridVar2 + '[' + $row_index + ']';
                //
                //     $last_row.find('td').each(function () {
                //         if ($last_row.find(':input').length > 0) {
                //             var $input = $(this).find(':input');
                //             var $new_name = $gridVar + '[' + $input.attr('name') + ']';
                //
                //             $input.attr('name', $new_name);
                //         }
                //     });
                //
                //     DatetimepickerRefresh();
                //     gridRowDelete();
                // });
                // gridRowDelete();
                //
                // /*-------Grid End--------*/

                /*------ Remove recheck and reject button -----*/
                $new_form.find('input[name=_recheck_], input[name=_reject_]').closest('.form-group').parent().remove();
                $new_form.find('input[name=save_as_draft]').css("cssText", "background: #a169ff !important;");
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
                            location.reload();
                        } else {
                            return false;
                        }
                    });
                }
                else if (data.end == false) {
                    if (data.manual == true) {
                        $("#next_user").selectpicker();
                        $.each(data.user, function (i, d) {
                            $("#next_user").append($('<option>', {
                                value: d.id,
                                text: d.name,
                            }));
                        });
                        $('#next_user').selectpicker('refresh');

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
                                // $submit_info.user = parseInt($('#next_user').val());
                                // $submit_info.manual = true;
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
                            if (out_open == 1) {

                                swal({
                                    title: "Good Job",
                                    text: "<b>Please note this App ID: <span class='c-green'>#" + data.application.number + "</span> for further information. Check your mail for further notification</b>",
                                    type: "success",
                                    showCancelButton: false,
                                    confirmButtonText: "Continue",
                                    allowOutsideClick: false
                                }).then(function (isConfirm) {
                                    if (isConfirm) {
                                        swal({
                                            title: "Open Another Account?",
                                            text: "Do you want to open Another Account?",
                                            type: "warning",
                                            showCancelButton: true,
                                            confirmButtonText: "Yes",
                                            cancelButtonText: "No",
                                            allowOutsideClick: false
                                        }).then(function (isConfirm) {
                                            if (isConfirm) {
                                                location.reload();
                                            }
                                        }, function (dismiss) {
                                            swal.close();
                                            $('#content').html('<h3 style="text-align: center">Thank you for banking with us.</h3>')
                                        });
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
        }


        /*--- Clear Form -----*/
        function FormClear() {
            if (customer != 'marico') {
                $new_form.empty();
            }
            $app_id.empty();
            $summary_button.removeData('id');
        }

        /*---- Date Time Picker Refresh Function ----*/
        function DatetimepickerRefresh() {
            if ($new_form.find('.date-time-picker').length > 0) {
                var $set_conf = [];

                // make set_conf
                $new_form.find('.date-time-picker').each(function (k, v) {
                    var $location = $(v),
                        $conf = {};

                    $conf = {
                        format: $location.data('format'),
                        useCurrent: $location.data('use_current'),
                        viewMode: $location.data('view_mode'),
                        location: $location,
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
                    $set_conf.push($conf);
                });

                //datetimepicker
                $.each($set_conf, function (i, val) {
                    var $place = val.location;
                    delete val.location;
                    $place.datetimepicker(
                        val
                    )
                });
            }
        }

        DatetimepickerRefresh();


        function SubmitForm() {
            var $form_name;
            (customer == 'xcb59hj') ? $form_name = $('#marico_capture_form') : $form_name = $new_form;
            var $form_data = $form_name[0];
            var $formData = new FormData($form_data);
            // if(out_open == 1){
            //     $formData.append('out_open', true);
            // }


            /*--- Set Form ----*/
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


    }


    /*------Remove Selection---------*/
    $(document).on('click', '.paginate_button', function () {
        if ($('#process_list').find('.selected').length > 0) {
            $('#start_case').removeData('process-id').removeClass('c-black');
            $('#process_list tbody tr').removeClass('selected');
        }
    });
});
