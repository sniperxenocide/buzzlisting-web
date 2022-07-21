{
    doT.templateSettings = {
        evaluate: /\{\{([\s\S]+?)\}\}/g,
        interpolate: /\{\{=([\s\S]+?)\}\}/g,
        encode: /\{\{!([\s\S]+?)\}\}/g,
        use: /\{\{#([\s\S]+?)\}\}/g,
        define: /\{\{##\s*([\w\.$]+)\s*(\😐=)([\s\S]+?)#\}\}/g,
        conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
        varname: 'd',
        strip: true,
        append: true,
        selfcontained: false
    };

    var $selected_gateway = $('.djs-element.selected[data-element-id^="ExclusiveGateway_"]');
    var $mainHtml = $('#gateway_condition_modal #inner_container');
    var $rule_panel = $('.rule_panel');

    var current_process_id = $selected_gateway
        .closest('.djs-children')
        .closest('.djs-group')
        .find(".djs-element[data-element-id^='Participant_']").data('element-id');

//ajax get ExclusiveGateway_ related tasks and conditions
    var condition_api = location.origin + '/api/v1/workflow/condition/';
    var task_api = location.origin + '/api/v1/workflow/task_op/';
    var task_rule_api = location.origin + '/api/v1/workflow/task_rule/';
    var step_api = location.origin + '/api/v1/workflow/step/';
    var eform_api = location.origin + '/api/v1/workflow/eform/';
    var output_doc_api = location.origin + '/api/v1/workflow/output_document/';

    let task_id = null;

    var $no_rules_wrap = $('.no_rules_wrap');
    var $rule_panel_wrap = $('.rule_panel_wrap');

    var $free_list = $('#free_list');
    var $assigned_list = $("#assigned_list");

    //variable template generator

    let variable_options = '';
    $.ajax({
        method: 'GET',
        url: '/api/v1/workflow/variable/?project=' + project_id,
        success: function (res) {
            //console.log(res);
            $.each(res, function (k, v) {
                variable_options += `<button type="button" id="variable_id_${v.id}" class="btn btn-default btn-sm">${v.name}</button>`;
            });

        },
        error: function (res) {
            console.log(res);
        }
    }).done(function () {
        $('#template_gen').summernote({
            height: 300,                 // set editor height
            minHeight: null,             // set minimum height of editor
            maxHeight: null,             // set maximum height of editor
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['height', ['height']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'hr']],
                ['view', ['fullscreen', 'codeview']],
                ['mybutton', ['hello']]

                //['help', ['help']]
            ],

            buttons: {
                hello: function (context) {
                    var ui = $.summernote.ui;

                    // create button
                    var button = ui.buttonGroup([
                        ui.button({
                            className: 'dropdown-toggle',
                            contents: '@ <span class="caret"></span>',
                            tooltip: 'Variables',
                            data: {
                                toggle: 'dropdown'
                            }
                        }),
                        ui.dropdown({
                            className: 'drop-default summernote-list scrollable-menu',
                            contents: '<div class="btn-group">' +
                            variable_options +
                            '</div>',
                            callback: function ($dropdown) {
                                $dropdown.find('.btn').click(function () {
                                    var text = ' {{ ' + $(this).text() + ' }} ';

                                    context.invoke('editor.restoreRange');
                                    context.invoke('editor.focus');
                                    context.invoke('editor.insertText', text);
                                });
                            }
                        })
                    ]);

                    return button.render();   // return button as jquery object
                }
            }
        });
    });

    $(document).off('click.funk').on('click.funk', 'a.gateway_condition.active', function (e) {
        e.preventDefault();
        var selected_gateway_id = $('.djs-element.selected[data-element-id^="ExclusiveGateway_"]').data('element-id');

        if ($('.djs-element.selected[data-element-id^="ExclusiveGateway_"]').length > 0) {
            $.ajax({
                method: 'GET',
                url: condition_api +
                '?project=' + project_id +
                '&process=' + 'Process_1' +
                '&gateway=' + selected_gateway_id,
                success: function (res) {
                    //console.log(res);

                    $mainHtml.empty();

                    var template = doT.template($('#conditional_row').html());

                    $.each(res, function (k, v) {
                        if (v.condition == null) v.condition = '';
                        $mainHtml.append(template(v));
                    });

                    $('#gateway_condition_modal').modal('show');

                    //////
                    var $element = $('#inner_container').find('input');
                    $element.autocomplete({
                        minLength: 1,
                        source: function (request, response) {
                            $.ajax({
                                url: "/api/v1/workflow/query_variable/?project=" + project_id,
                                dataType: "json",
                                method: 'GET',
                                success: function (data) {
                                    // var term = request.term;
                                    // console.log("1", term);
                                    // if (term.indexOf(' ') > 0) {
                                    //     var index = term.lastIndexOf(' ');
                                    //     console.log("2", index);
                                    //     term = term.substring(index + 2);
                                    //     console.log("3", term);
                                    // }
                                    // var re = $.ui.autocomplete.escapeRegex(term);
                                    // console.log("4", re);
                                    // var matcher = new RegExp('^' + re, 'i');
                                    // console.log("5", matcher);
                                    // var regex_validated_array = $.grep(data, function (item, index) {
                                    //     console.log("6", item);
                                    //     console.log("7", matcher.test(item));
                                    //     return matcher.test(item);
                                    // });
                                    //
                                    // response(regex_validated_array,
                                    //     extractLast(term));
                                    response($.ui.autocomplete.filter(
                                        data, extractLast(request.term)));
                                }
                            })
                        },
                        focus: function () {
                            return false;
                        },
                        select: function (event, ui, request) {
                            // console.log("request.term", request.term);
                            var terms = split(this.value);
                            terms.pop();
                            terms.push(ui.item.value);
                            terms.push('');
                            // var caretPos = this.selectionStart;
                            // console.log(caretPos);
                            // var inputTxt = $(this).val();
                            // var txtToAdd = terms.join(' ');
                            // $(this).val(inputTxt.substring(0, caretPos) + txtToAdd + inputTxt.substring(caretPos));

                            this.value = terms.join(' ');
                            return false;
                        },
                        open: function () {
                            setTimeout(function () {
                                $('.ui-autocomplete').css('z-index', 1050);
                            }, 0);
                        }
                    })
                        .data("ui-autocomplete")._renderItem = function (ul, item) {

                        return $("<li>")
                            .data("ui-autocomplete-item", item.value)
                            .append("<a>" + item.label + "</a>")
                            .appendTo(ul);
                    };

                    function split(val) {
                        return val.split(/ \s*/);
                    }

                    function extractLast(term) {
                        return split(term).pop();
                    }


                    ////
                },
                error: function (err) {
                    //console.log(err.statusText);
                }
            });
        }
    });

//condition save
    $('#save_condtions').on('click', function (e) {
        var $modal = $('#gateway_condition_modal');

        var $input = $modal.find('.condition_input');

        $.each($input, function (k, v) {
            var $this = $(v);
            var condition_id = $this.data('task-id');
            var condition = $this.val();

            $.ajax({
                method: 'PATCH',
                url: condition_api + condition_id + '/',
                data: {condition: condition},
                success: function (res) {
                    //console.log(res);
                },
                error: function (err) {
                    //console.log(err);
                    notify(err, '', '', 'success', '2000');
                }
            });

        });
        $modal.modal('hide');

        notify('Condition Saved!', '', '', 'success', '2000');

    });

    $('.djs-palette-entries').append($('.bottom-control'));


//patch task ajax
    function patchTask(taskid, param, message, error, duration) {
        //console.log('taskid',taskid);
        $.ajax({
            method: "PATCH",
            url: task_api + taskid + '/',
            "headers": {
                "content-type": "application/json"
            },
            "processData": false,
            "data": param,
            success: function (res) {
                //console.log(res);
                notify(message, '', '', 'success', duration);
            },
            error: function (err) {
                //console.log(err);
                notify(error, '', '', 'success', duration);
            }
        })
    }

//reset ajax everything for assignment rules
    function resetEverything(res) {
        //1st tab activation and user_view activation
        $('.tab-nav a[href="#assignment_type"]').tab('show');
        $('#assignable_view_user').attr('checked', 'checked');

        //assignment activation
        $('[name="assignment_rules"]').prop('checked', false);

        if (res['assignment_type'] == 1 || res['assignment_type'] == 3) {
            $('.assignment-rules-header li:nth-child(3)').hide();
        } else {
            $('.assignment-rules-header li:nth-child(3)').show();
        }
        $("input[name=assignment_rules][value=" + res['assignment_type'] + "]").prop('checked', true);

        //getAllAssignmentRules();
    }

    function getAllAssignmentRules() {
        //check existing rules, display empty or existing rules
        $.ajax({
            method: "GET",
            url: task_rule_api +
            '?project=' + project_id +
            '&process=' + 'Process_1' +
            '&task=' + selected_task_id,
            success: function (response) {
                //console.log(response);
                if (response.length > 0) {
                    $no_rules_wrap.hide();
                    $rule_panel_wrap.show();
                    $rule_panel.empty();

                    //generate template on load
                    var template = doT.template($('#rule_raw_template').html());
                    $.each(response, function (k, v) {
                        $rule_panel.append(template(v));
                        //console.log(v.user);
                        var $currentUserSelect = $('.rule_row[data-rule-id="' + v.id + '"] select.assigned_users');
                        $currentUserSelect.selectpicker();
                        $currentUserSelect.val(v.user);
                        $currentUserSelect.selectpicker('refresh');
                    });

                    //$('.assigned_users').selectpicker()
                } else {
                    $no_rules_wrap.show();
                    $rule_panel_wrap.hide();
                    $rule_panel.empty();
                }
            },
            error: function (err) {
                //console.log(err);
            }
        });
    }

//user and group
    function findCheckedAndDisplayRelatedWrap(available_users, assigned_users, available_groups, assigned_groups) {

        //console.log(available_users, assigned_users, available_groups, assigned_groups);

        $free_list.empty();
        $assigned_list.empty();

        if ($('#assignable_view_user').is(':checked')) {
            $.each(available_users, function (k, v) {
                $free_list.append('<option value="' + v.id + '">' + v.username + '</option>');
            });
            $.each(assigned_users, function (k, v) {
                $assigned_list.append('<option value="' + v.id + '">' + v.username + '</option>');
            });
        }
        else if ($('#assignable_view_groups').is(':checked')) {
            $.each(available_groups, function (k, v) {
                $free_list.append('<option value="' + v.id + '">' + v.name + '</option>');
            });
            $.each(assigned_groups, function (k, v) {
                $assigned_list.append('<option value="' + v.id + '">' + v.name + '</option>');
            });
        }
    };

//Assignment Rules modal open
    var selected_task_id = null;
    $(document).off('click.punga').on('click.punga', '.assignment_rules.active', function (e) {
        e.preventDefault();
        selected_task_id = $('.djs-element.selected[data-element-id^="Task_"]').data('element-id');
        //console.log('clicked', selected_task_id);
        if (selected_task_id != 'undefined') {
            //console.log('clicked inside condition');
            $.ajax({
                method: "GET",
                url: task_api +
                '?project=' + project_id +
                '&process=' + 'Process_1' +
                '&task=' + selected_task_id,
                success: function (res) {
                    task_id = res.id;

                    resetEverything(res);

                    $('#assignment_rules').modal('show');

                    //change assignment type
                    $('[name="assignment_rules"]').off('change.ping').on('change.ping', function () {
                        var val = $(this).val();

                        var param = {};
                        param['assignment_type'] = val;
                        //console.log(val,JSON.stringify(param));
                        if (val == 1 || val == 3) {
                            $('.assignment-rules-header li:nth-child(3)').hide();
                        } else {
                            $('.assignment-rules-header li:nth-child(3)').show();
                        }


                        patchTask(task_id, JSON.stringify(param), 'Assignment type changed!', 'Sorry assignment type cannot be changed!', 1000);
                        //console.log("patch",task_id)
                    });

                    var groupIdUserIdList = [];
                    var available_users = res['available_users'];
                    var assigned_users = res['assigned_users'];
                    var available_groups = res['available_groups'];
                    var assigned_groups = res['assigned_groups'];

                    //console.log(available_users);

                    //user and group
                    findCheckedAndDisplayRelatedWrap(available_users, assigned_users, available_groups, assigned_groups);

                    /*$.each(available_groups, function (k,v) {
                     $free_group_list.append('<option value="'+ v.id+'">'+ v.name +'</option>');
                     });
                     $.each(assigned_groups, function (k,v) {
                     $assigned_group_list.append('<option value="'+ v.id+'">'+ v.name +'</option>');
                     });*/

                    //multi select list define for user
                    $free_list.multiselect({
                        right: '#assigned_list',
                        rightSelected: '#assign_rightSelected',
                        leftSelected: '#assign_leftSelected',
                        rightAll: '#assign_rightAll',
                        leftAll: '#assign_leftAll',
                        search: {
                            left: '<input type="text" name="q" class="form-control" placeholder="Search user" />',
                            right: '<input type="text" name="q" class="form-control" placeholder="Search user" />'
                        },
                        moveToRight: moveToRight,
                        moveToLeft: moveToLeft
                    });


                    function userIdgroupIdGen() {
                        var param;
                        if ($('#assignable_view_user').is(':checked')) {
                            param = {
                                user: groupIdUserIdList
                            };
                        } else if ($('#assignable_view_groups').is(':checked')) {
                            param = {
                                group: groupIdUserIdList
                            };
                        }
                        return param;
                    }

                    function moveToRight(Multiselect, $options, event, silent, skipStack) {
                        let button = $(event.currentTarget).attr('id');

                        let $left_options;
                        if (button == 'assign_rightSelected') {
                            $left_options = Multiselect.$left.find('> option:selected');
                            Multiselect.$right.eq(0).append($left_options);

                            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                                Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
                            }
                        } else if (button == 'assign_rightAll') {
                            $left_options = Multiselect.$left.children(':visible');
                            Multiselect.$right.eq(0).append($left_options);

                            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                                Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
                            }
                        }

                        //console.log(Multiselect.$right.eq(0).find('> option'));

                        if (Multiselect.$right.eq(0).find('> option')) {

                            groupIdUserIdList = [];
                            Multiselect.$right.eq(0).find('> option').each(function (k, v) {
                                groupIdUserIdList.push(v.value);
                            });

                            //console.log(param);
                            //return;
                            //console.log("move", res);
                            //console.log(task_id);

                            //console.log(JSON.stringify(userIdgroupIdGen()));

                            patchTask(task_id, JSON.stringify(userIdgroupIdGen()), 'User Assign Success!', 'Sorry, cannot assign user', 1000);
                        }
                    };

                    function moveToLeft(Multiselect, $options, event, silent, skipStack) {
                        let button = $(event.currentTarget).attr('id');

                        let $right_options;
                        if (button == 'assign_leftSelected') {
                            $right_options = Multiselect.$right.eq(0).find('> option:selected');
                            Multiselect.$left.append($right_options);

                            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                                Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
                            }
                        } else if (button == 'assign_leftAll') {
                            $right_options = Multiselect.$right.eq(0).children(':visible');
                            Multiselect.$left.append($right_options);

                            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                                Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
                            }
                        }

                        //console.log($('#assigned_user_list').find('option'));


                        groupIdUserIdList = [];
                        $assigned_list.find('option').each(function (k, v) {
                            groupIdUserIdList.push(v.value);
                        });
                        /*var param = {
                         user: groupIdUserIdList
                         };*/
                        //console.log(task_id);
                        //return;
                        //console.log("move", task_id);

                        //console.log(JSON.stringify(userIdgroupIdGen()));
                        patchTask(task_id, JSON.stringify(userIdgroupIdGen()), 'User remove Success!', 'Sorry, cannot remove user', 1000);
                    };

                    //add new rules function call
                    //onAddRuleButton();
                    //save all rules function call
                    saveAllRules(task_id);
                    //open_step model pass taskId
                    getExistingSteps(task_id);

                    $('#save_duration').off('click.wees').on('click.wees', function () {
                        taskDurationPatch(task_id);
                    });

                },
                error: function (err) {
                    //console.log(err);
                }
            });
        }
    });

    $('a[data-toggle="tab"]').on('click', function (e) {
        let id = $(e.target).attr('aria-controls');
        if (id == 'assignment_rule') {
            getAllAssignmentRules();
            onAddRuleButton();
        }
    });


    $('[name="assignable_views"]').on('change', function () {
        $.ajax({
            method: "GET",
            url: task_api +
            '?project=' + project_id +
            '&process=' + 'Process_1' +
            '&task=' + selected_task_id,
            success: function (res) {
                //console.log(res);

                var available_users = res['available_users'];
                var assigned_users = res['assigned_users'];
                var available_groups = res['available_groups'];
                var assigned_groups = res['assigned_groups'];

                //user and group
                findCheckedAndDisplayRelatedWrap(available_users, assigned_users, available_groups, assigned_groups);
            }
        });

    });

    function onAddRuleButton() {
        $.ajax({
            method: "GET",
            url: task_api +
            '?project=' + project_id +
            '&process=' + 'Process_1' +
            '&task=' + selected_task_id,
            success: function (res) {
                //add new rule button click
                $('#add_new_rule').off('click.phung').on('click.phung', function () {
                    let template = doT.template($('#rule_raw_template').html());
                    let assigned_users = res['assigned_users'];
                    let obj = {
                        'id': '',
                        'condition': '',
                        'available_users': assigned_users
                    };
                    $rule_panel.append(template(obj));
                    //console.log(obj);
                    $no_rules_wrap.hide();
                    $rule_panel_wrap.show();
                    $('select.assigned_users').selectpicker();
                });
            }
        });
    }

    function deleteRule() {
        $(document).off('click.pang').on('click.pang', '.remove_rule', function () {
            let $this = $(this);
            let $curr_rule_row = $this.closest('.rule_row');
            let $curr_rule_id = $curr_rule_row.data('rule-id');

            function hideRuleWrap() {
                if (!$('.rule_row').length > 0) {
                    $rule_panel_wrap.hide();
                    $no_rules_wrap.show();
                }
            }

            hideRuleWrap();

            //console.log($curr_rule_row,$curr_rule_id);
            if ($curr_rule_id != '') {
                $.ajax({
                    method: "DELETE",
                    url: task_rule_api + $curr_rule_id + '/',
                    success: function (res) {
                        //console.log(res);
                        $curr_rule_row.remove();
                        hideRuleWrap();
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            } else {
                $curr_rule_row.remove();
            }


        });
    };
    deleteRule();

    function saveAllRules(task_id) {
        $('.save_all_rule').off('click.fung').on('click.fung', function () {
            let $rule_row = $('.rule_row');

            let isValidAll = true;

            $.each($rule_row, function (k, v) {
                let $this = $(v);
                let $rule_id = $this.data('rule-id');
                let post_patch_api = task_rule_api;

                let user = $this.find('select.assigned_users').val();
                //console.log(user,task_id);
                let $form = $('#rules_form').parsley();
                $form.validate();
                if (!$form.isValid()) {
                    isValidAll = false;
                    return;
                }

                let condition = $this.find('.rule_condition_wrap input').val();

                let param = {task: task_id, user: user, condition: condition};

                let method;
                if ($rule_id == '') {
                    method = "POST";
                } else {
                    method = "PATCH";
                    post_patch_api += $rule_id + '/';
                }

                $.ajax({
                    method: method,
                    url: post_patch_api,
                    data: param,
                    success: function (res) {
                        //console.log(res);
                    },
                    error: function (err) {
                        console.log(err);
                    }
                })
            });
            if (isValidAll) {
                notify('All rules successfully saved!', '', '', 'success', 2000);
                setTimeout(function () {
                    getAllAssignmentRules();
                    getAllAssignmentRules();
                }, 100);
            }
        });
    };

    function getExistingSteps(task_id) {
        //hide and empty existing step table
        var $existing_steps_table = $('.existing_step_table');
        $existing_steps_table.hide().find('tbody').empty();

        $.ajax({
            method: "GET",
            url: step_api + '?task=' + task_id,
            success: function (resp) {
                var $modal = $('#add_new_step_modal');
                let $eform_output_doc_wrap = $modal.find('.eformrs-or-output-document-wrap');
                let respLength = resp.length;
                //display existing step table
                $existing_steps_table.show();
                //console.log($existing_steps_table);
                let lastPosition;
                if (respLength > 0) {
                    lastPosition = resp[respLength - 1].position;

                    //checking existing position
                    //console.log('last resp position', lastPosition);
                    console.log(resp);

                    //console.log('main resp', resp);
                    //return;
                    //append existing steps to existing_step_table
                    let template = doT.template($('#existing_step').html());
                    $.each(resp, function (k, v) {
                        var obje = {};
                        obje = v;
                        if (obje.type == 0) {
                            obje['type_name'] = 'eForm';
                        }
                        else if (obje.type == 1) {
                            obje['type_name'] = 'Script';
                        }
                        else if (obje.type == 2) {
                            obje['type_name'] = 'Output Document';
                        }

                        if (obje.mode == 0) {
                            obje.mode_name = 'Edit';
                        }
                        else if (obje.mode == 1) {
                            obje.mode_name = 'View';
                        }

                        if (obje.eform != null && obje.output_document == null) {
                            $.ajax({
                                method: 'GET',
                                url: eform_api + obje.eform + '/',
                                success: function (res) {
                                    //console.log(res);
                                    obje['document_name'] = '';
                                    obje['eform_name'] = res.title;
                                    $existing_steps_table.find('tbody').append(template(obje));

                                    //console.log('eform is', obje);
                                },
                                error: function (res) {
                                    console.log(res);
                                }
                            })
                        }
                        else if (obje.eform == null && obje.output_document != null) {
                            $.ajax({
                                method: 'GET',
                                url: output_doc_api + obje.output_document + '/',
                                success: function (res) {
                                    //console.log(output_doc_api + obje.output_document);
                                    obje['document_name'] = res.title;
                                    obje['eform_name'] = '';
                                    $existing_steps_table.find('tbody').append(template(obje));
                                    //console.log('output doc is', obje);
                                },
                                error: function (res) {
                                    console.log(res);
                                }
                            })
                        }
                    });


                } else {
                    //console.log('no existing tasks');
                    //hide and empty existing step table
                    $existing_steps_table.hide().find('tbody').empty();
                }

                $('#add_new_step').off('click.fane').on('click.fane', function () {
                    $modal.find('#type').data('selectpicker').val('');
                    //$modal.find('#mode').data('selectpicker').val('');
                    $eform_output_doc_wrap.empty();
                    $modal.modal('show');
                    $modal.find('form#add_step_form').removeData('step-id').removeClass('editing-a-step');
                    //set new position value
                    if (lastPosition == undefined) {
                        lastPosition = 0;
                    }
                    $modal.find('#position').val(lastPosition + 1);
                });

                $(document).off('click.fune').on('click.fune', '.edit_step', function () {
                    let $this = $(this);
                    let stepId = $this.closest('tr').data('step-id');
                    let position = $this.closest('tr').data('position');
                    let type = $this.closest('tr').data('step-type-id');
                    let mode = $this.closest('tr').data('mode-id');
                    let condition = $this.closest('tr').data('condition');
                    let template = doT.template($('#eforms-or-output-docs').html());
                    //console.log(position, type);
                    $modal.modal('show');
                    //add step id to data attribute
                    $modal.find('form#add_step_form').data('step-id', stepId).addClass('editing-a-step');
                    $modal.find('#position').val(position);
                    $modal.find('#type').data('selectpicker').val(type);
                    /* $modal.find('#mode').data('selectpicker').val(mode);
                     $modal.find('#condition').val(condition);*/

                    let obj = {
                        "eform_or_output": type
                    };

                    function editCommonWorker(res) {
                        $eform_output_doc_wrap.empty();
                        obj['options'] = res;
                        //console.log(res);

                        $eform_output_doc_wrap.html(template(obj));
                    }

                    if (type == 0) {
                        $.ajax({
                            method: 'GET',
                            url: eform_api + '?project=' + project_id,
                            success: function (res) {
                                editCommonWorker(res);
                                let eformId = $this.closest('tr').data('eform-id');

                                //console.log($this, eformId);

                                $('#eforms').selectpicker();
                                $('#eforms').data('selectpicker').val(eformId);
                            },
                            error: function (res) {
                                console.log(res);
                            }
                        });
                    } else if (type == 2) {
                        $.ajax({
                            method: "GET",
                            url: output_doc_api + '?project=' + project_id,
                            success: function (res) {
                                editCommonWorker(res);
                                let outputDocId = $this.closest('tr').data('output-doc-id');

                                //console.log($this,outputDocId);

                                $('#output_documents').selectpicker();
                                $('#output_documents').data('selectpicker').val(outputDocId);
                            },
                            error: function (res) {
                                console.log(res);
                            }
                        })
                    }
                });

                //type onchange
                $('#type.selectpicker').off('change.funk').on('change.funk', function () {
                    var selected = $(this).find('option:selected').val();
                    var template = doT.template($('#eforms-or-output-docs').html());

                    let obj = {
                        "eform_or_output": selected
                    };

                    function commonWorker(res) {
                        $eform_output_doc_wrap.empty();
                        obj['options'] = res;
                        //console.log(res);

                        $eform_output_doc_wrap.html(template(obj));
                    }

                    if (selected == '0') {
                        $.ajax({
                            method: 'GET',
                            url: eform_api + '?project=' + project_id,
                            success: function (res) {
                                commonWorker(res);

                                $('#eforms').selectpicker();
                            },
                            error: function (res) {
                                console.log(res);
                            }
                        });

                        //console.log(selected);
                    } else if (selected == '2') {
                        $.ajax({
                            method: "GET",
                            url: output_doc_api + '?project=' + project_id,
                            success: function (res) {
                                commonWorker(res);
                                //console.log(res);

                                $('#output_documents').selectpicker();
                            },
                            error: function (res) {
                                console.log(res);
                            }
                        })
                    }
                    else {
                        $modal.find('.eformrs-or-output-document-wrap').empty();
                    }
                });
            },
            error: function (res) {
                console.log(res);
            }
        });

        $('#add_step_form').off('submit.pong').on('submit.pong', function (e) {
            e.preventDefault();
            let $form = $(this);
            let stepId = $form.data('step-id');
            let position = $form.find('#position').val();
            let type = $form.find('#type').data('selectpicker').val();
            //let mode = $form.find('#mode').data('selectpicker').val();
            //let condition = $form.find('#condition').val();
            let method;
            let postUrl = null;
            if ($form.find('#eforms').length > 0) {
                var eform = $form.find('#eforms').data('selectpicker').val();
            } else if ($form.find('#output_documents').length > 0) {
                var output_doc = $form.find('#output_documents').data('selectpicker').val();
            }

            $form.parsley().validate();

            if (!$form.parsley().isValid()) {
                return;
            }

            let data = {
                type: type,
                //condition: (condition !== '') ? condition : null,
                position: position,
                //mode: mode,
                mode: 0,
                eform: (eform != undefined) ? eform : null,
                output_document: (output_doc != undefined) ? output_doc : null,
                project: project_id,
                task: task_id
            };

            if ($form.hasClass('editing-a-step')) {
                method = "PATCH";
                postUrl = step_api + stepId + '/';
                //console.log(postUrl);
            } else {
                method = "POST";
                postUrl = step_api;
            }

            $.ajax({
                method: method,
                url: postUrl,
                data: data,
                success: function (res) {
                    //console.log(res);
                    $('#add_new_step_modal').modal('hide');
                    getExistingSteps(task_id);
                },
                error: function (res) {
                    console.log(res);
                }
            });
        });


        let $deleteStepModal = $('#delete_a_step');
        $(document).off('click.efen').on('click.efen', '.remove_step', function () {
            let $this = $(this);
            let stepId = $this.closest('tr').data('step-id');

            $deleteStepModal.data('step-id', stepId);
            $deleteStepModal.modal('show');
        });

        $('.delete_step_button').off('click.efrt').on('click.efrt', function () {
            let stepId = $deleteStepModal.data('step-id');

            //console.log(step_api + stepId + '/');

            $.ajax({
                method: 'DELETE',
                url: step_api + stepId + '/',
                success: function (res) {
                    notify('Step has been deleted successfully!', '', '', 'success', 3000);
                    getExistingSteps(task_id);
                    $deleteStepModal.modal('hide');
                    //console.log(res);
                },
                error: function (res) {
                    console.log(res);
                }
            })
        });
    }

    //supervisor modal bringing
    $('#supervisor_button').off('click.fen').on('click.fen', function () {
        $.ajax({
            method: "GET",
            url: "/api/v1/workflow/supervisor/" + project_id + "/",
            success: function (res) {
                //console.log(res);
                freeAndSupervisorUser(res["available_users"], res["assigned_users"]);
            },
            error: function (res) {
                console.log(res);
            }
        });
        $('#supervisor_assign_modal').modal();
    });


    //get all templates on bpmn button click
    $('#template_button').off('click.wen').on('click.wen', function () {
        get_existing_templates();
        $('#template_list_modal').modal();
    });


    $('#add_new_template').off('click.men').on('click.men', function () {
        var $modal = $('#add_template_modal');
        $modal.removeAttr('data-template-id');

        $modal.find('#file_name').val('').parsley().reset();
        $('#template_gen').summernote('reset');
        $modal.modal();
    });

    function get_existing_templates() {
        var $table = $('#existing_templates');
        $.ajax({
            method: "GET",
            url: '/api/v1/workflow/template/?project=' + project_id,
            success: function (res) {
                $table.find('tbody').empty();

                var $template = doT.template($('#template_tr').html());

                $.each(res, function (k, v) {
                    $table.find('tbody').append($template(v));
                });
                //console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        })
    }

    function edit_an_template(id) {
        $.ajax({
            method: "GET",
            url: '/api/v1/workflow/template/' + id + '/',
            success: function (res) {
                //console.log(res);

                var $modal = $('#add_template_modal');
                $modal.attr('data-template-id', id);
                /*var $editable_template = $('#template_gen').data('layoutInfo')['editable']();
                 var $codable_template = $('#template_gen').data('layoutInfo')['codable']();*/

                var gentemp = $('<div/>').html(res.content).text();
                $modal.find('#file_name').val(res.file_name);

                //console.log(gentemp);
                $('#template_gen').summernote('code', gentemp);

                /*$editable_template.html(gentemp);
                 $codable_template.val(gentemp);*/
                $modal.modal();

            },
            error: function (res) {
                console.log(res);
            }

        })
    }

    $('#save_template').off('click.pinga').on('click.pinga', function () {
        var filename = $('#file_name').val();
        var genHtml = $('#template_gen').summernote('code');

        var param = {
            content: genHtml,
            project: project_id,
            file_name: filename
        };

        var $file_name = $('#file_name').parsley();
        $file_name.validate();

        if (!$file_name.isValid()) {
            notify('Invalid file name!', '', '', 'danger', 3000);
            return;
        }

        if (genHtml.replace(/<\/?[^>]+(>|$)/g, "") == '') {
            notify('Template cannot be left empty!', '', '', 'danger', 3000);
            return;
        }

        var template_id = $('#add_template_modal').attr('data-template-id');

        var ajax_method = '';

        if (typeof template_id !== typeof undefined && template_id !== false) {
            ajax_method = 'PATCH';
            template_id = template_id + '/';
        }
        else {
            ajax_method = 'POST';
            template_id = '';
        }
        $.ajax({
            method: ajax_method,
            url: "/api/v1/workflow/template/" + template_id,
            data: param,
            success: function (res) {
                //console.log(res);
                get_existing_templates();
                $('#add_template_modal').modal('hide');
            },
            error: function (res) {
                console.log(res);
                notify(res.responseJSON['non_field_errors'][0], '', '', 'danger', 3000);
            }

        });

        //console.log(genHtml, filename);
    });

    $(document).off('click.pwe').on('click.pwe', '.edit_template', function (e) {
        e.preventDefault();

        var $this = $(this);

        var template_id = $this.closest('tr').data('template-id');

        edit_an_template(template_id);
    });

    var del_template_id = '';
    $(document).off('click.enga').on('click.enga', '.delete_template', function (e) {
        e.preventDefault();

        var $this = $(this);

        del_template_id = $this.closest('tr').data('template-id');

        $("#delete_template_modal").modal();
    });

    $('#delete_template_btn').off('click.waer').on('click.waer', function () {
        $.ajax({
            method: "DELETE",
            url: "/api/v1/workflow/template/" + del_template_id + '/',
            success: function (res) {
                //console.log(res);
                get_existing_templates();

                $("#delete_template_modal").modal('hide');
                notify('Template has been Successfully deleted!', '', '', 'success', 2000);
            },
            error: function (res) {
                console.log(res);
                notify(res.statusText, '', '', 'danger', 2000);
            }
        })
    });

    function get_existing_outputdocs() {
        var $table = $('#existing_outputdoc');
        $.ajax({
            method: "GET",
            url: '/api/v1/workflow/output_document/?project=' + project_id,
            success: function (res) {
                $table.find('tbody').empty();

                var $template = doT.template($('#outputdoc_tr').html());

                $.each(res, function (k, v) {
                    $table.find('tbody').append($template(v));
                });
                //console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        })
    }

    function edit_an_outputdoc(id) {
        $.ajax({
            method: "GET",
            url: '/api/v1/workflow/output_document/' + id + '/',
            success: function (res) {
                //console.log(res);

                $.ajax({
                    method: "GET",
                    url: '/api/v1/workflow/template/?project=' + project_id,
                    success: function (response) {
                        var $template_list_picker = $('#template_lists');

                        $template_list_picker.html('');

                        response.unshift({'id': '', 'file_name': 'Choose a template'});
                        var options = '';
                        $.each(response, function (k, v) {
                            options += `<option value="${v.id}">${v.file_name}</option>`;
                        });

                        $template_list_picker.html(options).selectpicker('refresh');
                        //console.log(response);

                        $('#add_outputdoc_form').parsley().reset();

                        var $modal = $('#add_outputdoc_modal');
                        $modal.attr('data-outputdoc-id', id);
                        var $doc_generated_name = $modal.find('#doc_generated_name');
                        var $doc_title = $modal.find('#doc_title');
                        var $doc_description = $('#doc_description');
                        var $template_lists = $('#template_lists');
                        /*var $doc_download = $('#doc_download');
                         var $doc_version = $('#doc_version');*/

                        $doc_generated_name.val(res.generated_name);
                        $doc_title.val(res.title);
                        $doc_description.val(res.description);
                        $template_lists.val(res.template).selectpicker('refresh');
                        /*
                         $doc_version.attr('checked', res.version);
                         $doc_download.attr('checked', res.download);
                         */
                        $modal.modal();

                    }
                });
            },
            error: function (res) {
                console.log(res);
            }

        })
    }

    //get all output docs on bpmn button click
    $('#outputdoc_button').off('click.outpu').on('click.outpu', function () {
        get_existing_outputdocs();
        $('#outputdoc_list_modal').modal();
    });

    $('#add_new_outputdoc').off('click.fenr').on('click.fenr', function () {
        $.ajax({
            method: "GET",
            url: '/api/v1/workflow/template/?project=' + project_id,
            success: function (res) {
                var $template_list_picker = $('#template_lists');

                $template_list_picker.html('');

                res.unshift({'id': '', 'file_name': 'Choose a template'});
                var options = '';
                $.each(res, function (k, v) {
                    options += `<option value="${v.id}">${v.file_name}</option>`;
                });

                $template_list_picker.html(options).selectpicker('refresh');
                //console.log(res);

                $('#add_outputdoc_form').parsley().reset();

                var $modal = $('#add_outputdoc_modal');
                $modal.removeAttr('data-outputdoc-id');
                var $doc_generated_name = $modal.find('#doc_generated_name');
                var $doc_title = $modal.find('#doc_title');
                var $doc_description = $('#doc_description');
                var $template_lists = $('#template_lists');
                /*var $doc_download = $('#doc_download');
                 var $doc_version = $('#doc_version');*/

                $doc_generated_name.val('');
                $doc_title.val('');
                $doc_description.val('');
                $template_lists.val('').selectpicker('refresh');
                /*$doc_version.attr('checked', false);
                 $doc_download.attr('checked', false);*/
                $modal.modal();
            },
            error: function (res) {
                console.log(res);
            }
        });
    });

    $('#save_outputdoc').off('click.saveOutputDoc').on('click.saveOutputDoc', function () {
        var $form = $('#add_outputdoc_form').parsley();

        $form.validate();

        if (!$form.isValid()) {
            notify('Please correct all the fields!', '', '', 'danger', 2000);
            return;
        }

        var param = {
            "generated_name": $('#doc_generated_name').val(),
            "title": $('#doc_title').val(),
            "description": $('#doc_description').val(),
            /*"version": $('#doc_version').is(':checked'),
             "download": $('#doc_download').is(':checked'),*/
            "version": false,
            "download": true,
            "project": project_id,
            "template": $('#template_lists').val()
        };

        var outputdoc_id = $('#add_outputdoc_modal').attr('data-outputdoc-id');

        var ajax_method = '';

        if (typeof outputdoc_id !== typeof undefined && outputdoc_id !== false) {
            ajax_method = 'PATCH';
            outputdoc_id = outputdoc_id + '/';
        }
        else {
            ajax_method = 'POST';
            outputdoc_id = '';
        }

        $.ajax({
            method: ajax_method,
            url: '/api/v1/workflow/output_document/' + outputdoc_id,
            data: param,
            success: function (res) {
                //console.log(res);
                get_existing_outputdocs();
                $("#add_outputdoc_modal").modal('hide');
            },
            error: function (res) {
                //console.log(res);
                notify(res.responseText, '', '', 'danger', 2000);
            }
        })
    });


    $(document).off('click.editOut').on('click.editOut', '.edit_ouputdoc', function (e) {
        e.preventDefault();

        var $this = $(this);

        var outputdoc_id = $this.closest('tr').data('outputdoc-id');

        edit_an_outputdoc(outputdoc_id);
    });


    var del_outputdoc_id = '';
    $(document).off('click.fenga').on('click.fenga', '.delete_ouputdoc', function (e) {
        e.preventDefault();

        var $this = $(this);

        del_outputdoc_id = $this.closest('tr').data('outputdoc-id');

        $("#delete_outputdoc_modal").modal();
    });

    $('#delete_outputdoc_btn').off('click.weer').on('click.weer', function () {
        $.ajax({
            method: "DELETE",
            url: "/api/v1/workflow/output_document/" + del_outputdoc_id + '/',
            success: function (res) {
                //console.log(res);
                get_existing_outputdocs();

                $("#delete_outputdoc_modal").modal('hide');
                notify('Output document has been Successfully deleted!', '', '', 'success', 2000);
            },
            error: function (res) {
                console.log(res);
                notify(res.statusText, '', '', 'danger', 2000);
            }
        })
    });

    //supervisor and free users list
    var $users_free_list = $('#users_free_list');
    var $assigned_supervisor_list = $('#assigned_supervisor_list');

    function freeAndSupervisorUser(available_users, assigned_users) {

        //console.log(available_users, assigned_users);

        $users_free_list.empty();
        $assigned_supervisor_list.empty();

        $.each(available_users, function (k, v) {
            $users_free_list.append('<option value="' + v.id + '">' + v.username + '</option>');
        });
        $.each(assigned_users, function (k, v) {
            $assigned_supervisor_list.append('<option value="' + v.id + '">' + v.username + '</option>');
        });
    };


    function patchSupervisor(projectId, param) {
        let parameter = {
            "supervisors": param
        };
        //console.log(projectId, JSON.stringify(parameter));
        $.ajax({
            method: "PATCH",
            url: '/api/v1/workflow/supervisor/' + projectId + '/',
            "headers": {
                "content-type": "application/json"
            },
            "processData": false,
            "data": JSON.stringify(parameter),
            success: function (res) {
                //console.log(res);
                notify('Changes saved successfully!', '', '', 'success', 3000);
            },
            error: function (err) {
                console.log(err);
                notify('Sorry cannot assign supervisor!', '', '', 'danger', 3000);
            }
        });
    };

    var supervisorUserList;

    function superVisorMoveToRight(Multiselect, $options, event, silent, skipStack) {
        let button = $(event.currentTarget).attr('id');

        let $left_options;
        if (button == 'users_assign_rightSelected') {
            $left_options = Multiselect.$left.find('> option:selected');
            Multiselect.$right.eq(0).append($left_options);

            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
            }
        } else if (button == 'users_assign_rightAll') {
            $left_options = Multiselect.$left.children(':visible');
            Multiselect.$right.eq(0).append($left_options);

            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
            }
        }

        //console.log(Multiselect.$right.eq(0).find('> option'));

        if (Multiselect.$right.eq(0).find('> option')) {

            supervisorUserList = [];
            Multiselect.$right.eq(0).find('> option').each(function (k, v) {
                supervisorUserList.push(v.value);
            });

            //console.log(supervisorUserList);
            //return;
            //console.log("move", res);
            //console.log(task_id);

            //console.log(JSON.stringify(userIdgroupIdGen()));

            patchSupervisor(project_id, supervisorUserList);
        }
    };

    function superVisorMoveToLeft(Multiselect, $options, event, silent, skipStack) {
        let button = $(event.currentTarget).attr('id');

        let $right_options;
        if (button == 'users_assign_leftSelected') {
            $right_options = Multiselect.$right.eq(0).find('> option:selected');
            Multiselect.$left.append($right_options);

            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
            }
        } else if (button == 'users_assign_leftAll') {
            $right_options = Multiselect.$right.eq(0).children(':visible');
            Multiselect.$left.append($right_options);

            if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
            }
        }

        //console.log($assigned_supervisor_list.find('option'));

        supervisorUserList = [];
        $assigned_supervisor_list.find('option').each(function (k, v) {
            supervisorUserList.push(v.value);
        });
        /*var param = {
         user: groupIdUserIdList
         };*/
        //console.log(task_id);
        //return;
        //console.log("move", task_id);

        //console.log(JSON.stringify(userIdgroupIdGen()));

        //console.log(supervisorUserList);

        patchSupervisor(project_id, supervisorUserList);
    };

    $users_free_list.multiselect({
        right: '#assigned_supervisor_list',
        rightSelected: '#users_assign_rightSelected',
        leftSelected: '#users_assign_leftSelected',
        rightAll: '#users_assign_rightAll',
        leftAll: '#users_assign_leftAll',
        search: {
            left: '<input type="text" name="qu" class="form-control" placeholder="Search user" />',
            right: '<input type="text" name="qu" class="form-control" placeholder="Search user" />'
        },
        moveToRight: superVisorMoveToRight,
        moveToLeft: superVisorMoveToLeft
    });


    Number.prototype.round = function (p) {
        p = p || 10;
        return parseFloat(this.toFixed(p));
    };


    $('#calculator_opener').off('click.wang').on('click.wang', function () {
        $('#duration_calculation_modal').modal('show');
        $('#converter_days, #converter_hours').val(0);
    });

    $('#converter_days').on('change, keyup', function () {
        //$(this).val(Number($(this).val()).round(3));
        dayToHour($(this), $('#converter_hours'))
    });

    $('#converter_hours').on('change, keyup', function () {
        //$(this).val(Number($(this).val()).round(6));
        hourToDay($(this), $('#converter_days'))
    });

    function dayToHour($days, $hours) {
        console.log(($days.val() * 24).round(6));
        $hours.val(($days.val() * 24).round(6));
    }

    function hourToDay($hours, $days) {
        console.log(($hours.val() / 24).round(3));
        $days.val(($hours.val() / 24).round(3));
    }

    $('.pick_hour').off('click.feqs').on('click.feqs', function () {
        $('#tasks_duration').val($('#converter_hours').val());
        $('#duration_calculation_modal').modal('hide');
    });

    function taskDurationPatch(taskid) {
        var $tasks_duration = $('#tasks_duration');
        var duration = $tasks_duration.val();

        $tasks_duration.parsley({
            classHandler: function (el) {
                return el.$element.closest('.tab-pane'); //working
            }
        }).validate();

        if (!$tasks_duration.parsley().isValid()) {
            return;
        }

        $.ajax({
            url: task_api + taskid + '/',
            data: 'duration=' + duration,
            method: 'PATCH',
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        });
    }
}

