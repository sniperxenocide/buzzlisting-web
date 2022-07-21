{
    let init = function () {
        let dept_id;
        let userIdList = [];

        let $add_dept_modal = $('#department_add');
        let $edit_dept_modal = $('#department_edit');
        let $delete_dept_modal = $('#department_delete');
        let $user_assign_modal = $('#department_assign_user');
        let $free_user_select = $("#free_user_list");
        let $assigned_user_select = $('#assigned_user_list');

        let get_dept_api = location.origin + '/api/v1/dms/departments/getdepartment/';
        let post_dept_api = location.origin + '/api/v1/dms/departments/department/';
        let get_dept_staff = location.origin + '/api/v1/dms/departments/departmentstaff/';
        let freestaff_api = location.origin + '/api/v1/dms/departments/freestaff/';
        let org_chart_api = location.origin + '/api/v1/dms/departments/orgchart/';

        function ajaxRepopulateJsTree($modal){
            $.ajax({
                method: 'GET',
                url: get_dept_api,
                success: function (res) {
                    $('div#jstree').jstree(true).settings.core.data = res;
                    $('div#jstree').jstree(true).refresh();

                    if($modal){
                        $modal.modal('hide');
                    }
                },
                error: function (err) {
                    console.log('get error', err);
                }
            });
        }

        $('#add_dept_button').on('click', function (e) {
            e.preventDefault();
            $add_dept_modal.find('.modal-title').text('Add new department');
            $add_dept_modal.find('#parent_id').val('');
            $add_dept_modal.find('#department_name_input').val('');
            $add_dept_modal.modal('show');
        });

        $.ajax({
            method: 'GET',
            url: get_dept_api,
            success: function (res) {


                // load jstree
                $("#jstree").jstree({
                    //plugins: ["table", "dnd", "contextmenu", "sort"],
                    plugins: ["table", "dnd", "contextmenu"],
                    core: {
                        data: res
                    },
                    "contextmenu": {
                        "items": function ($node) {
                            let tree = $("#jstree").jstree(true);
                            return {
                                "New Sub-Department": {
                                    "separator_before": false,
                                    "separator_after": true,
                                    "label": "New Sub-Department",
                                    "action": function (obj) {
                                        /*$node = tree.create_node($node);
                                         tree.edit($node);*/
                                        $add_dept_modal.find('.modal-title').text('Add new sub-department');
                                        $add_dept_modal.find('#parent_id').val($node.id);
                                        $add_dept_modal.find('#department_name_input').val('');
                                        $add_dept_modal.modal('show');
                                        console.log($node);
                                    }
                                },
                                "Edit": {
                                    "separator_before": false,
                                    "separator_after": false,
                                    "label": "Edit",
                                    "action": function (obj) {
                                        console.log($node);
                                        $edit_dept_modal.find('#self_id').val($node.id);
                                        $edit_dept_modal.find('#department_name_input').val($node.text);
                                        let activeness = ($node.data.status == 'Active')? 'true' : 'false';
                                        console.log(activeness);
                                        $edit_dept_modal.find('#activeness').val(activeness).selectpicker('refresh');
                                        $edit_dept_modal.find('#manager').empty();

                                        $.ajax({
                                            method: "GET",
                                            url: get_dept_staff+'?deptid='+$node.id,
                                            success: function (res) {
                                                if(!res.length > 0){
                                                    $edit_dept_modal.find('#manager').append('<option value="">No user available</option>');
                                                }
                                                else{
                                                    $edit_dept_modal.find('#manager').append('<option value="">None</option>')
                                                }
                                                console.log(res);
                                                $.each(res, function (k,v) {
                                                    $edit_dept_modal.find('#manager').append('<option value="'+ v.id+'">'+ v.username +'</option>');
                                                });
                                                $edit_dept_modal.find('#manager').val($node.data['manager_id']);
                                                $edit_dept_modal.find('#manager').selectpicker('refresh');
                                            }

                                        });

                                        $edit_dept_modal.find('#manager').append();
                                        $edit_dept_modal.modal('show');
                                    }
                                },
                                "Delete": {
                                    "separator_before": false,
                                    "separator_after": false,
                                    "label": "Delete",
                                    "action": function (obj) {
                                        //tree.edit($node);
                                        //alert('Delete');
                                        $delete_dept_modal.find('#self_id').val($node.id);
                                        $delete_dept_modal.modal('show');
                                        console.log($node);
                                    }
                                },
                                "Assign User": {
                                    "separator_before": true,
                                    "separator_after": false,
                                    "label": "Assign User",
                                    "action": function (obj) {
                                        //tree.edit($node);
                                        //alert('Assign User');
                                        $free_user_select.empty();
                                        $assigned_user_select.empty();
                                        dept_id = $node.id;
                                        $.ajax({
                                            method: 'GET',
                                            url: freestaff_api,
                                            success: function (res) {
                                                $.each(res, function (k,v) {
                                                    $free_user_select.append('<option value="'+ v.id+'">'+ v.username +'</option>');
                                                });
                                            }
                                        });
                                        $.ajax({
                                            method: "GET",
                                            url: get_dept_staff+'?deptid='+$node.id,
                                            success: function (res) {
                                                console.log(res);
                                                $.each(res, function (k,v) {
                                                    $assigned_user_select.append('<option value="'+ v.id+'">'+ v.username +'</option>');
                                                });
                                            }

                                        });
                                        $user_assign_modal.modal('show');
                                    }
                                }
                            };
                        }
                    },
                    // configure tree table
                    table: {
                        columns: [
                            {header: "Department Name"},
                            {width: 100, value: "status", header: "Status"},
                            {width: 350, value: "manager", header: "Manager"},
                            {width: 150, value: "users", header: "Users"}
                        ],
                        /*resizable: true,
                         draggable: true,
                         width: '100%'
                         height: 300*/
                    }
                });
            }
        });
        //action modal submits

        $('#submit_department').on('click', function () {
            let $parent = $add_dept_modal.find('#parent_id').val();
            let dept_name = $add_dept_modal.find('#department_name_input').val();
            $parent = ($parent == '') ? null : $parent;
            let param = {
                "name": dept_name,
                "parent": $parent,
                "active": true,
                "manager": null
            };

            $('#department_name_input').parsley().validate();
            if(!$('#department_name_input').parsley().isValid()){
                return;
            }

            $.ajax({
                method: "POST",
                url: post_dept_api,
                data: param,
                success: function (res) {
                    console.log(res);
                    ajaxRepopulateJsTree($add_dept_modal);

                    notify('Department added successfully', '', '', 'success', 2000);
                },
                error: function (err) {

                    notify('Department cannot be added', '', '', 'danger', 2000);
                    console.log('post error',err);
                }
            })
        });

        $('#submit_edit_department').on('click', function () {
            let self_id = $edit_dept_modal.find('#self_id').val();
            let active = $edit_dept_modal.find('#activeness').val() === 'true';
            let param1 = {
                name: $edit_dept_modal.find('#department_name_input').val(),
                active: active
            };

            let param2 = {
                action:"add",
                type: "manager",
                department: self_id,
                userid: new Array($edit_dept_modal.find('#manager').val())
            };

            $.ajax({
                method: 'PATCH',
                url: post_dept_api + self_id + '/',
                data: param1,
                success: function (res) {
                    console.log('edit',res);
                    ajaxRepopulateJsTree($edit_dept_modal);

                    notify('Department updated successfully', '', '', 'success', 2000);
                },
                error: function (err) {
                    console.log('edit',err);
                    notify('Department cannot be updated', '', '', 'danger', 2000);
                }
            });

            $.ajax({
                method: 'POST',
                url: org_chart_api,
                data: JSON.stringify(param2),
                headers: {
                  "content-type": "application/json"
                },
                success: function (res) {
                    console.log('edit',res);
                    ajaxRepopulateJsTree($edit_dept_modal);

                    notify('Manager updated successfully', '', '', 'success', 2000);
                },
                error: function (err) {
                    console.log('edit',err);

                    if($edit_dept_modal.find('#manager').val() == ''){
                        notify('You cannot leave department\'s manager empty', '', '', 'danger', 2000);
                    }else{
                        notify('Manager cannot be updated', '', '', 'danger', 2000);
                    }

                }
            });
        });

        $('#delete_department_button').on('click', function () {
            let self_id = $delete_dept_modal.find('#self_id').val();

            $.ajax({
                method: 'DELETE',
                url: post_dept_api + self_id + '/',
                success: function (res) {
                    console.log('delete',res);
                    ajaxRepopulateJsTree($delete_dept_modal);

                    notify('Department deleted successfully', '', '', 'success', 2000);
                },
                error: function (err) {
                    console.log('delete',err);

                    notify('Department cannot be deleted', '', '', 'danger', 2000);
                }
            });
        });

        //multi select list define
        $('#free_user_list').multiselect({
            /*right: '#multi_d_to, #multi_d_to_2',
             rightSelected: '#multi_d_rightSelected, #multi_d_rightSelected_2',
             leftSelected: '#multi_d_leftSelected, #multi_d_leftSelected_2',
             rightAll: '#multi_d_rightAll, #multi_d_rightAll_2',
             leftAll: '#multi_d_leftAll, #multi_d_leftAll_2',*/
            right: '#assigned_user_list',
            rightSelected: '#assign_user_rightSelected',
            leftSelected: '#assign_user_leftSelected',
            rightAll: '#assign_user_rightAll',
            leftAll: '#assign_user_leftAll',
            search: {
                left: '<input type="text" name="q" class="form-control" placeholder="Search user" />',
                right: '<input type="text" name="q" class="form-control" placeholder="Search user" />'
            },
            moveToRight: moveToRight,
            moveToLeft: moveToLeft
        });

        function moveToRight(Multiselect, $options, event, silent, skipStack) {
            let button = $(event.currentTarget).attr('id');

            let $left_options;
            if (button == 'assign_user_rightSelected') {
                $left_options = Multiselect.$left.find('> option:selected');
                Multiselect.$right.eq(0).append($left_options);

                if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                    Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
                }
            } else if (button == 'assign_user_rightAll') {
                $left_options = Multiselect.$left.children(':visible');
                Multiselect.$right.eq(0).append($left_options);

                if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                    Multiselect.$right.eq(0).find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$right.eq(0));
                }
            }

            if($left_options){
                $left_options.each(function (k, v) {
                    let uid = v.value;
                    if ($.inArray(uid, userIdList) == -1) {
                        userIdList.push(v.value);
                    }
                });

                postLeftRight("add");
            }
        };

        function moveToLeft(Multiselect, $options, event, silent, skipStack) {
            let button = $(event.currentTarget).attr('id');

            let $right_options;
            if (button == 'assign_user_leftSelected') {
                $right_options = Multiselect.$right.eq(0).find('> option:selected');
                Multiselect.$left.append($right_options);

                if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                    Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
                }
            } else if (button == 'assign_user_leftAll') {
                $right_options = Multiselect.$right.eq(0).children(':visible');
                Multiselect.$left.append($right_options);

                if (typeof Multiselect.callbacks.sort == 'function' && !silent) {
                    Multiselect.$left.find('> option').sort(Multiselect.callbacks.sort).appendTo(Multiselect.$left);
                }
            }

            if ($right_options) {
                $right_options.each(function (k, v) {
                    let uid = v.value;
                    if ($.inArray(uid, userIdList) == -1) {
                        userIdList.push(v.value);
                    }
                });

                postLeftRight("remove")
            }
        }

        //ajax post request while moving left -> right / right -> left
        function postLeftRight(actionType) {
            let param = {
                "action": actionType,
                "type": "user",
                "department": parseInt(dept_id),
                "userid": userIdList

            };
            $.ajax({
                method: "POST",
                url: org_chart_api,
                data: JSON.stringify(param),
                contentType: "application/json; charset=utf-8",
                success: function (res) {
                    console.log(res);
                    userIdList = [];
                    ajaxRepopulateJsTree();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    };

    init();
}
