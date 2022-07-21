{
    function init() {
        //api url
        let api_url = location.host + '/api/v1/dms/';

        //ajax url
        let ajax_url = '//' + api_url + 'categorization/';
        let app_url = '//' + location.host + 'dms/categorization/root/';
        let group_url = '//' + location.host + '/api/v1/group';
        let docpermission = ajax_url + 'attachdocpermission/';
        console.log(docpermission);
        //parent
        let parent = null;
        //table click remove selected class from tr
        let remove_table_row_selected_class = function ($tableSelector, $notSelector) {
            let $table_selected_rows = $tableSelector.find('tbody tr.selected');

            /*console.log($notSelector);*/

            if ($table_selected_rows.length > 0) {
                $table_selected_rows.not($notSelector).removeClass('selected');
            }
        };
        /*if (user_role === 'workflow_admin') {
         $("#update_parent_publish_field").css('display', 'block');
         }else{
         $("#update_parent_publish_field").css('display', 'none');
         }*/
        window.Parsley.on('field:error', function () {
            // This global callback will be called for any field that fails validation.
            console.log('Validation failed for: ', this.$element);
        });
        let date = new Date();
        /*console.log(date);*/
        $('#date_box').datetimepicker({
            format: 'YYYY-MM-DD hh:mm',
            useCurrent: false,
            defaultDate: moment().add(50, 'years'),
            minDate: moment()
        });
        $('#group_modal').on('hidden.bs.modal', function () {
            $(this).removeData('bs.modal');
        });
        $('#add_parent_new_cat_doc').on('hidden.bs.modal', function () {
            // remove the bs.modal data attribute from it
            $(".help-block").empty();
            $('.form-group').removeClass('has-error');
            $(this).removeData('bs.modal');

        });
        $('#add_new_metafield').on('hidden.bs.modal', function () {
            // remove the bs.modal data attribute from it
            $(".help-block").empty();
            $('.form-group').removeClass('has-error');
            $(this).removeData('bs.modal');

        });

        $('#add_new_cat_doc').on('hidden.bs.modal', function () {
            // remove the bs.modal data attribute from it
            $(".help-block").empty();
            $('.form-group').removeClass('has-error');
            $(this).removeData('bs.modal');

        });
        $("#update_metafield_modal").on('hidden.bs.modal', function () {
            // remove the bs.modal data attribute from it
            $(".help-block").empty();
            $('.form-group').removeClass('has-error');
            $(this).removeData('bs.modal');

        });
        $("#update_parent_new_cat_doc").on('hidden.bs.modal', function () {
            // remove the bs.modal data attribute from it
            $(".help-block").empty();
            $('.form-group').removeClass('has-error');
            $(this).removeData('bs.modal');

        });

        //table tr click add selected class on tr
        $(document).on('click', '#all_doc_list tbody tr', function (e) {
            e.stopPropagation();
            let $this = $(this);
            let info = new Function("return" + $($this).data('info'))();
            let self = info.self;
            if ($(this).data('type') == 'meta') {
                $('#update_btn, #delete_btn').removeAttr('disabled').data('type', 'meta').data('self', self);
            } else if ($(this).data('type') == 'cat') {
                $('#update_btn, #delete_btn').removeAttr('disabled').data('self', self);
                $('#assign_group, #pub_per, #retention').attr('disabled', 'disabled');
            } else if ($(this).data('type') == 'doc') {
                $('#update_btn, #delete_btn, #assign_group, #pub_per, #save_grp, #retention').removeAttr('disabled').data('self', self);
            }
            $this.addClass('selected');

            remove_table_row_selected_class($('#all_doc_list'), $this);
        });

        /*$(document).on('click', function () {
         let $table_selected_rows = $('#all_doc_list tbody tr.selected');
         if ($table_selected_rows.length > 0) {
         $table_selected_rows.removeClass('selected');
         //disable buttons
         $('#update_btn, #delete_btn').attr('disabled', 'disabled');
         }
         });*/
        function retention_value(v) {
            let retention_type, retention_policy = v.retention_policy, retention_period = v.retention_period,
                retention_html;
            if (retention_policy == '0') {
                retention_type = "None";
                retention_html = `${retention_type}`;
            } else if (retention_policy == '1') {
                retention_type = "Archive";
                retention_html = `${retention_type}- in ${retention_period} months`;
            } else if (retention_policy == '2') {
                retention_type = 'Delete';
                retention_html = `${retention_type}- in ${retention_period} months`;
            }
            return retention_html;
        }

        let $table = $('#all_doc_list');
        //load ajax table onload
        $.ajax({
            url: ajax_url + 'root/',
            method: 'GET',
            success: function (data) {

                $table.find('tbody').html('');
                /*let groupNames = [];
                 $.each(v.group, function (i, j) {
                 groupNames.push(j.groups__name);
                 });*/
                if (data.length > 0) {
                    $.each(data, function (k, v) {
                        v.root = (v.parent == null) ? 'Yes' : 'No';
                        let type = (v.type == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                        v.published = (v.published == false) ? "N/A" : "Published";
                        let groupNames = [];

                        $.each(v.groups, function (i, j) {
                            $.each(j.group, function (m, n) {
                                groupNames.push(n.groups__name);
                            });
                        });
                        let html =
                            '<tr class="clickie" data-type="' + v.type + '" data-info="' + '{' + 'parent' + ':' + v.parent + ',' + 'self' + ':' + v.id + '}' + '">' +
                            //'<td>' + v.id + '</td>' +
                            '<td>' + v.name + '</td>' +
                            '<td>' + type + '</td>' +
                            '<td>' + v.published + '</td>' +
                            '<td>' + groupNames + '</td>' +
                            '<td>' + retention_value(v) + '</td>' +
                            '</tr>';
                        $table.find('tbody').append(html);
                    });
                }
                // else {
                //     let html = '<tr>' +
                //         '<td colspan="4" style="text-align: center;"> Sorry, no sub-item available!</td>' +
                //         '</tr>';
                //     $table.append(html);
                // }
            }
        });

        //-----------table double click-----------
        $(document).on('dblclick', '#all_doc_list tbody tr.clickie', function () {

            let $this = $(this);
            let info = new Function("return" + $($this).data('info'))();
            parent = info.parent;

            $.ajax({
                url: ajax_url + 'category/' + info.self,
                method: 'GET',
                success: function (res) {
                    $table.find('tbody').html('');
                    let add_btn = $('#add_btn');
                    add_btn.data('parent', parent);
                    add_btn.data('type', res.type);
                    add_btn.data('url_id', res.id);

                    //disable buttons
                    $('#update_btn, #delete_btn, #assign_group, #pub_per, #retention').attr('disabled', 'disabled');

                    //back button
                    $('#all_doc_list thead tr .back_button_container').html('' +
                        '<button id="back_button" data-href="' + res.id + '" class="btn bgm-cyan waves-effect">' +
                        '<i class="zmdi zmdi-arrow-back"></i>' +
                        '</button>' +
                        '' + " " + res.name);

                    //if response is category
                    if (res.type.toLowerCase() == 'cat') {
                        $($table.find('thead tr th')[0]).attr('colspan', 5);
                        //if has any children
                        if (res.children.length > 0) {
                            let root = '\'' + res.name + '\'';
                            $.each(res.children, function (k, v) {
                                let groupNames = [];
                                $.each(v.group, function (i, j) {
                                    groupNames.push(j.groups__name);
                                });
                                let type = (v.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                                v.published = (v.published == false) ? "N/A" : "Published";
                                let html =
                                    '<tr class="clickie" data-type="' + v.type + '" data-info="' + '{' + 'parent' + ':' + root + ',' + 'self' + ':' + v.id + '}' + '">' +
                                    '<td>' + v.name + '</td>' +
                                    '<td>' + type + '</td>' +
                                    '<td>' + v.published + '</td>' +
                                    '<td>' + groupNames + '</td>' +
                                    '<td>' + retention_value(v) + '</td>' +
                                    '</tr>';
                                $table.find('tbody').append(html);
                                var head =
                                    '<td>Name</td>' +
                                    '<td>Type</td>' +
                                    '<td>Published</td>' +
                                    '<td>Groups</td>' +
                                    '<td>Retention</td>';

                                $($table.find('thead tr')[1]).html(head);
                            });
                        }
                    } else if (res.type.toLowerCase() == 'doc') {
                        $("#assign_group, #pub_per, #retention").css('display', 'none');
                        $.ajax({
                            url: ajax_url + 'metafield/?doc_id=' + info.self,
                            method: 'GET',
                            success: function (res) {
                                if (res.length > 0) {
                                    $.each(res, function (k, v) {
                                        let required = (v.required == 0) ? 'No' : 'Yes';
                                        let unique = (v.unique == 0) ? 'No' : 'Yes';
                                        let dataType;
                                        if (v.data_type == 0) {
                                            dataType = "String";
                                        } else if (v.data_type == 1) {
                                            dataType = "Integer";
                                        } else if (v.data_type == 2) {
                                            dataType = "TextArea";
                                        } else if (v.data_type == 3) {
                                            dataType = "DropDown";
                                        } else if (v.data_type == 4) {
                                            dataType = "Date";
                                        } else if (v.data_type == 5) {
                                            dataType = "Float";
                                        } else {
                                            dataType = "String"
                                        }
                                        $($table.find('thead tr th')[0]).attr('colspan', 6);

                                        let head =
                                            '<td>Title</td>' +
                                            '<td>Display Name</td>' +
                                            '<td>Data Type</td>' +
                                            '<td>Default Value</td>' +
                                            '<td>Required</td>' +
                                            '<td>Order</td>';
                                        $($table.find('thead tr')[1]).html(head).css({
                                            "font-weight": 500,
                                            "color": "#333",
                                            "text-transform": "uppercase",
                                        });

                                        let html =
                                            '<tr class="clickie" data-type="meta" data-info="' + '{' + 'self' + ':' + v.id + '}' + '">' +
                                            '<td>' + v.title + '</td>' +
                                            '<td>' + v.displayname + '</td>' +
                                            '<td>' + dataType + '</td>' +
                                            '<td>' + v.default_text + '</td>' +
                                            '<td>' + required + '</td>' +
                                            '<td>' + v.order + '</td>' +
                                            '</tr>';

                                        $table.find('tbody').append(html);

                                    });
                                }
                                /*else {
                                 let html =
                                 '<tr>' +
                                 '<td colspan="4" style="text-align: center;">Sorry, no sub-item available!</td>' +
                                 '</tr>';
                                 $table.find('tbody').append(html);
                                 }*/
                                $("#all_doc_list tbody tr.clickie").dblclick(function () {
                                    return false;
                                });
                            }
                        });
                    }
                }
            });
        });

        $(document).on('click', '#back_button', function () {
            var $this = $(this);
            var href = $($this).data('href');
            $("#assign_group, #pub_per, #retention").css('display', 'inline-block');
            $.ajax({
                url: ajax_url + 'siblings/' + href,
                method: 'GET',
                success: function (res) {
                    $table.find('tbody').html('');

                    //disable buttons
                    $('#update_btn, #delete_btn').attr('disabled', 'disabled');
                    $('#add_btn').data('type', 'cat');
                    $('#update_btn').data('type', 'cat');
                    $('#delete_btn').data('type', 'cat');
                    $($table.find('thead tr th')[0]).attr('colspan', 5);
                    $($table.find('thead tr')[1]).css({
                        "font-weight": 500,
                        "color": "#333",
                        "text-transform": "uppercase"
                    });
                    //back button

                    if (res.parent != null) {
                        $("#add_btn").data('url_id', res.parent);
                        $('#all_doc_list thead tr .back_button_container').html('' +
                            '<button id="back_button" data-href="' + res.parent + '" class="btn bgm-cyan waves-effect">' +
                            '<i class="zmdi zmdi-arrow-back"></i>' +
                            '</button>' +
                            '' + " " + res.siblings[0].parent_name);
                    } else {
                        $("#add_btn").data('url_id', "undefined");
                        $('#all_doc_list thead tr .back_button_container').html('');
                    }

                    //if has any children
                    if (res.siblings.length > 0) {
                        let head =
                            '<td>Name</td>' +
                            '<td>Type</td>' +
                            '<td>Published</td>' +
                            '<td>Groups</td>' +
                            '<td>Retention</td>';
                        $($table.find('thead tr')[1]).html(head);

                        let root = '\'' + res.parent + '\'';

                        $.each(res.siblings, function (k, v) {
                            let type = (v.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                            v.published = (v.published == false) ? "N/A" : "Published";
                            let groupNames = [];
                            $.each(v.group, function (i, j) {
                                groupNames.push(j.groups__name);
                            });
                            let html =
                                '<tr class="clickie" data-type="' + v.type + '" data-info="' + '{' + 'parent' + ':' + root + ',' + 'self' + ':' + v.id + '}' + '">' +
                                //'<td>' + v.id + '</td>' +
                                '<td>' + v.name + '</td>' +
                                '<td>' + type + '</td>' +
                                '<td>' + v.published + '</td>' +
                                '<td>' + groupNames + '</td>' +
                                '<td>' + retention_value(v) + '</td>' +
                                '</tr>';
                            $table.find('tbody').append(html);
                        });
                    }
                    /*else {
                     let html =
                     '<tr>' +
                     '<td colspan="4" style="text-align: center;"> Sorry, no sub-item available!</td>' +
                     '</tr>';
                     $table.find('tbody').append(html);
                     }*/
                }
            });
        });


        $('#add_btn').on('click', function () {
            let default_text = '<label class="control-label">' + "Default Text" + '</label>' +
                '<input type="text" data-parsley-trigger="change" minlength="2" maxlength="50" data-parsley-error-message="Length should be between maximum and mimimum field" class="form-control" name="default_text" value="">';
            $('#name').find('input:text').val('');
            $('#name').removeClass("fg-toggled");
            $('#add_title').find('input:text').val('');
            $('#add_title').removeClass("fg-toggled");
            $('#add_default_text').empty().append(default_text);
            $('#add_default_text').find('input:text').val('');
            $('#display_name').find('input:text').val('');
            $('#add_default_text').removeClass("fg-toggled");
            $('#p_name').find('input:text').val('');
            $('#p_name').removeClass("fg-toggled");
            $('#update_title').find('input:text').val('');
            $('.max_field').find('input:text').val('');
            $('.max_field').removeClass("fg-toggled");
            $('.min_field').removeClass("fg-toggled");
            $('.min_field').find('input:text').val('');
            $('#update_title').removeClass("fg-toggled");
            $('#update_display_name').find('input:text').val('');
            $('#update_display_name').removeClass("fg-toggled");
            $('#update_default_text').find('input:text').val('');
            $('#update_default_text').removeClass("fg-toggled");

            let parent = $(this).data('parent');
            let type = $(this).data('type');
            let url_id = $(this).data('url_id');
            if ($(this).data('parent') === undefined || $(this).data('url_id') == "undefined") {
                $('#add_parent_new_cat_doc').modal().show();
                $("#parent_cat_doc_field").selectpicker('refresh');
                $('#parent_cat_doc_field').selectpicker('val', ['cat']);
            } else {
                if ($(this).data('type') == 'cat') {
                    $.ajax({
                        url: ajax_url + 'category/' + url_id,
                        method: 'GET',
                        success: function (res) {
                            let html = '<option value=' + res.id + '>' + res.name + '</option>';
                            /*let html = '<input type="text" name="parent" class="form-control fg-input" value="'+res.id+'">'+
                             '<label class="fg-label">'+"Parent:"+res.name+'</label>';*/
                            $("#select_parent").empty().append(html);
                            $('#add_new_cat_doc').modal().show();
                            $("#cat_doc_field").selectpicker('refresh');
                            $('#cat_doc_field').selectpicker('val', ['cat']);
                        }
                    });

                }
                else if ($(this).data('type') == 'doc') {
                    $.ajax({
                        url: ajax_url + 'category/' + url_id,
                        method: 'GET',
                        success: function (res) {
                            let html = '<option value=' + res.id + '>' + res.name + '</option>';
                            let default_textarea_text = '<label class="control-label">' + "Default Text" + '</label>' +
                                '<textarea class="form-control auto-size" name="default_text" data-parsley-trigger="change" minlength="2" maxlength="250" data-parsley-error-message="Length should be 2-250 characters"></textarea>';
                            let default_drop_text = '<label class="control-label">' + "Dropdown Value" + '</label>' +
                                '<textarea class="form-control auto-size" required name="default_text" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9\\\\&\/_.\r -]{2,2000}$" data-parsley-error-message="Dropdown Value contains alphanumeric and ( - , _, /, \\, &, . ). Length should be 2-2000 characters"></textarea>';
                            let default_text = '<label class="control-label">' + "Default Text" + '</label>' +
                                '<input type="text" data-parsley-trigger="change" minlength="2" maxlength="50" data-parsley-error-message="Length should be between Maximum and minimum field" class="form-control" name="default_text" value="">';
                            let int_text = '<label class="control-label">' + "Put Integer Value" + '</label>' +
                                '<input type="text" data-parsley-trigger="change" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value" class="form-control" name="default_text">';
                            let float_text = '<label class="control-label">' + "Decimal Value" + '</label>' +
                                '<input type="text" data-parsley-trigger="change" data-parsley-type="number" data-parsley-error-message="Value should contain only Decimal values" class="form-control" name="default_text" value="">';
                            let date_text = '<label class="control-label">' + "Date" + '</label>' +
                                '<input type="text" class="form-control date-time-picker" id="date_box" name="default_text">';
                            let max_field = '<label class="control-label">' + "Maximum" + '<span class="required_star">'+"*"+'<span>' +'</label>' +
                                '<input id="max_field" type="text" data-parsley-trigger="change" data-parsley-ge="#min_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be greater or equal to minimum field" class="form-control" name="max">';
                            let min_field = '<label class="control-label">' + "Minimum" + '<span class="required_star">'+"*"+'<span>'+ '</label>' +
                                '<input id="min_field" type="text" data-parsley-trigger="change" data-parsley-le="#max_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be smaller or equal to maximum field" class="form-control" name="min">';
                            $("#doc").empty().append(html);
                            $('#add_new_metafield').modal().show();
                            $("#add_meta_type").selectpicker('refresh');
                            $('#add_meta_type').selectpicker('val', 0);
                            $("#meta_order").selectpicker('refresh');
                            $('#meta_order').selectpicker('val', 1);
                            $("#required").selectpicker('refresh');
                            $('#required').selectpicker('val', 0);
                            $(".max_field").css('display', 'block');
                            $(".min_field").css("display", "block");
                            $(".max_field").empty();
                            $(".max_field").append(max_field);
                            $(".min_field").empty();
                            $(".min_field").append(min_field);
                            $("#max_field").keyup(function () {
                                $("input[name='default_text']").attr('maxlength', $(this).val());
                            });
                            $("#min_field").keyup(function () {
                                $("input[name='default_text']").attr('minlength', $(this).val());
                            });
                            $('#add_meta_type').on('change', function () {
                                if (this.value == 0) {
                                    $("#add_default_text").empty().append(default_text);
                                    $(".max_field").css('display', 'block');
                                    $(".min_field").css("display", "block");
                                    $(".max_field").empty();
                                    $(".max_field").append(max_field);
                                    $(".min_field").empty();
                                    $(".min_field").append(min_field);
                                }
                                if (this.value == 3) {
                                    $("#add_default_text").empty().append(default_drop_text);
                                    $(".max_field").css('display', 'none');
                                    $(".min_field").css("display", "none");
                                }
                                if (this.value == 2) {
                                    $("#add_default_text").empty().append(default_textarea_text);
                                    $(".max_field").css('display', 'none');
                                    $(".min_field").css("display", "none");
                                }
                                if (this.value == 1) {
                                    $("#add_default_text").empty().append(int_text);
                                    $(".max_field").css('display', 'none');
                                    $(".min_field").css("display", "none");
                                }
                                if (this.value == 4) {
                                    $("#add_default_text").empty().append(date_text);
                                    $('#date_box').datetimepicker({
                                        format: 'YYYY-MM-DD',
                                        useCurrent: false,
                                    });
                                    $(".max_field").css('display', 'none');
                                    $(".min_field").css("display", "none");
                                }
                                if (this.value == 5) {
                                    $("#add_default_text").empty().append(float_text);
                                    $(".max_field").css('display', 'none');
                                    $(".min_field").css("display", "none");
                                }
                            });
                            $("#cat_doc_field").selectpicker('refresh');
                        }
                    });
                }
                else if ($(this).data('type') === null) {
                    $('#add_new_cat_doc').modal().show();
                    $("#cat_doc_field").selectpicker('refresh');
                }
                else if ($(this).data('url_id') == "undefined") {

                }
            }


        });
        /*-----------------Add new category or doctype Root--------------*/

        let add_root_cat_doc_url = "/api/v1/dms/categorization/root/";
        let add_parent_frm = $('#add_parent_new_cat_doc_form');
        let add_parent_modal = $("#add_parent_new_cat_doc");

        add_parent_frm.submit(function (e) {
            e.preventDefault();
            let data = new FormData($(this)[0]);
            let add_parent_form_parsley = add_parent_frm.parsley();
            add_parent_form_parsley.validate();
            if (add_parent_form_parsley.isValid()) {
                $.ajax({
                    type: "post",
                    url: add_root_cat_doc_url,
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        let type = (data.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                        data.published = (data.published == false) ? "N/A" : "Published";
                        let groupNames = [];
                        $.each(data.group, function (i, j) {
                            groupNames.push(j.groups__name);
                        });
                        let html =
                            '<tr class="clickie" data-type="' + data.type + '" data-info="' + '{' + 'parent' + ':' + data.parent + ',' + 'self' + ':' + data.id + '}' + '">' +
                            '<td>' + data.name + '</td>' +
                            '<td>' + type + '</td>' +
                            '<td>' + data.published + '</td>' +
                            '<td>' + groupNames + '</td>' +
                            '<td>' + retention_value(data) + '</td>' +
                            '</tr>';
                        $table.find('tbody').append(html);
                        add_parent_modal.modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        notify('Congratulations!!! ', type + ' Added Successfully ', ' ', 'success');
                    }
                    ,
                    error: function (response) {
                        let errors = response.responseText;
                        $.each(JSON.parse(errors), function (key, value) {
                            let nMessage = value;
                            notify('', nMessage, '', 'danger', 3000);
                        });
                    }
                });
                return false;
            }
        });

        /*------------------Add Category or doctype with parent-----------*/

        let add_cat_doc_url = "/api/v1/dms/categorization/category/";
        let add_cat_doc_frm = $('#add_new_cat_doc_form');
        let add_cat_doc_modal = $("#add_new_cat_doc");

        add_cat_doc_frm.submit(function (e) {
            e.preventDefault();
            let data = new FormData($(this)[0]);
            let add_cat_doc_parsley = add_cat_doc_frm.parsley();
            add_cat_doc_parsley.validate();
            if (add_cat_doc_parsley.isValid()) {
                $.ajax({
                    type: "post",
                    url: add_cat_doc_url,
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        let type = (data.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                        data.published = (data.published == false) ? "N/A" : "Published";
                        let groupNames = [];
                        $.each(data.group, function (i, j) {
                            groupNames.push(j.groups__name);
                        });
                        let html =
                            '<tr class="clickie" data-type="' + data.type + '" data-info="' + '{' + 'parent' + ':' + data.parent + ',' + 'self' + ':' + data.id + '}' + '">' +
                            '<td>' + data.name + '</td>' +
                            '<td>' + type + '</td>' +
                            '<td>' + data.published + '</td>' +
                            '<td>' + groupNames + '</td>' +
                            '<td>' + retention_value(data) + '</td>' +
                            '</tr>';

                        $table.find('tbody').append(html);
                        add_cat_doc_modal.modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        notify('Congratulations!!! ', type + ' Added Successfully ', ' ', 'success');

                    }
                    ,
                    error: function (response) {
                        let errors = response.responseText;
                        $.each(JSON.parse(errors), function (key, value) {
                            let nMessage = value;
                            notify('', nMessage, '', 'danger', 3000);
                        });
                    }
                });
                return false;
            }
        });

        /*------------------Add MetaField---------------*/

        let add_metafield_url = "/api/v1/dms/categorization/metafield/";
        let add_metafield_frm = $('#add_new_metafield_form');
        let add_metafield_modal = $("#add_new_metafield");

        /*add_metafield_frm.submit(function (e) {
         e.preventDefault();
         console.log($(this)[0]);
         let data = new FormData($(this)[0]);

         let add_meta_parsley = add_metafield_frm.parsley();
         add_meta_parsley.validate();
         if (add_meta_parsley.isValid()) {
         $.ajax({
         type: "post",
         url: add_metafield_url,
         data: data,
         processData: false,
         contentType: false,
         success: function (data) {
         let required = (data.required == 0) ? 'No' : 'Yes';
         let dataType;
         if (data.data_type == 0) {
         dataType = "String";
         } else if (data.data_type == 1) {
         dataType = "Integer";
         } else if (data.data_type == 2) {
         dataType = "TextArea";
         } else if (data.data_type == 3) {
         dataType = "DropDown";
         } else if (data.data_type == 4) {
         dataType = "Date";
         } else if (data.data_type == 5) {
         dataType = "Float";
         } else {
         dataType = "String"
         }
         $($table.find('thead tr th')[0]).attr('colspan', 5);
         let head =
         '<td>Order</td>' +
         '<td>Title</td>' +
         '<td>Data Type</td>' +
         '<td>Default Value</td>' +
         '<td>Required</td>';
         $($table.find('thead tr')[1]).html(head);
         let html =
         '<tr class="clickie" data-type="meta" data-info="' + '{' + 'self' + ':' + data.id + '}' + '">' +
         '<td>' + data.order + '</td>' +
         '<td>' + data.title + '</td>' +
         '<td>' + dataType + '</td>' +
         '<td>' + data.default_text + '</td>' +
         '<td>' + required + '</td>' +
         '</tr>';

         $table.find('tbody').append(html);
         add_metafield_modal.modal('hide');
         $('body').removeClass('modal-open');
         $('.modal-backdrop').remove();
         notify('Congratulations!!! ', 'Metafield Added Successfully ', ' ', 'success');
         $("#all_doc_list tbody tr.clickie").dblclick(function () {
         return false;
         });
         }
         ,
         error: function (response) {
         var errors = response.responseText;
         $.each(JSON.parse(errors), function (key, value) {
         var nMessage = key + ": " + value;
         notify('', nMessage, '', 'danger');
         });
         }
         });
         return false;
         }
         });*/
        let adding_meta_form = $("#add_new_metafield_form").parsley();
        $('#save_metafield').on('click', (e) => {
            e.preventDefault();
            adding_meta_form.validate();
            if (adding_meta_form.isValid()) {
                let data = {};
                data.title = (($('#add_new_metafield_form [name="title"]')).val()).toLowerCase();
                data.displayname = ($('#add_new_metafield_form [name="displayname"]')).val();
                data.data_type = $('#add_meta_type').val();
                data.default_text = ($('#add_new_metafield_form [name="default_text"]')).val();
                if ($("#add_meta_type").val() == 0) {
                    data.max = ($('#add_new_metafield_form [name="max"]')).val();
                    data.min = ($('#add_new_metafield_form [name="min"]')).val();
                }
                data.order = $('#meta_order').val();
                data.required = $('#required').val();
                data.unique = $('#unique').val();
                data.doc = ($('#add_new_metafield_form [name="doc"]')).val();
                data = JSON.stringify(data);
                $.ajax({
                    url: add_metafield_url,
                    method: 'POST',
                    data: data,
                    contentType: "application/json",
                    success: function (res) {
                        let required = (res.required == 0) ? 'No' : 'Yes';
                        let dataType;
                        if (res.data_type == 0) {
                            dataType = "String";
                        } else if (res.data_type == 1) {
                            dataType = "Integer";
                        } else if (res.data_type == 2) {
                            dataType = "TextArea";
                        } else if (res.data_type == 3) {
                            dataType = "DropDown";
                        } else if (res.data_type == 4) {
                            dataType = "Date";
                        } else if (res.data_type == 5) {
                            dataType = "Float";
                        } else {
                            dataType = "String"
                        }
                        $($table.find('thead tr th')[0]).attr('colspan', 6);
                        let head =
                            '<td>Title</td>' +
                            '<td>Display Name</td>' +
                            '<td>Data Type</td>' +
                            '<td>Default Value</td>' +
                            '<td>Required</td>' +
                            '<td>Order</td>';
                        $($table.find('thead tr')[1]).html(head);
                        let html =
                            '<tr class="clickie" data-type="meta" data-info="' + '{' + 'self' + ':' + res.id + '}' + '">' +
                            '<td>' + res.title + '</td>' +
                            '<td>' + res.displayname + '</td>' +
                            '<td>' + dataType + '</td>' +
                            '<td>' + res.default_text + '</td>' +
                            '<td>' + required + '</td>' +
                            '<td>' + res.order + '</td>' +
                            '</tr>';

                        $table.find('tbody').append(html);
                        add_metafield_modal.modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        notify('Congratulations!!! ', 'Metafield Added Successfully ', ' ', 'success');
                        $("#all_doc_list tbody tr.clickie").dblclick(function () {
                            return false;
                        });

                    },
                    error: function (response) {
                        var errors = response.responseText;
                        $.each(JSON.parse(errors), function (key, value) {
                            var nMessage = value;
                            notify('', nMessage, '', 'danger', 3000);
                        });
                    }
                });
            }
        });

        $('#update_btn').on('click', function () {
            let update_url_id = $(this).data('self');
            if ($(this).data('type') == 'meta') {
                $.ajax({
                    url: ajax_url + 'metafield/' + update_url_id,
                    method: 'GET',
                    success: function (res) {
                        let required = (res.required == 0) ? 'No' : 'Yes';
                        let unique = (res.unique == 0) ? 'No' : 'Yes';
                        let max;
                        let min;
                        /*let update_default_text = '<label class="control-label">' + "Default Text" + '</label>' +
                         '<input type="text" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9_. ]{2,50}$" data-parsley-error-message="Value should contain only Alphanumeric and (._) values, length should be 2-50 characters" class="form-control" name="default_text" value="' + res.default_text + '">';*/
                        let dataType;
                        if (res.data_type == 0) {
                            dataType = "String";
                        } else if (res.data_type == 1) {
                            dataType = "Integer";
                        } else if (res.data_type == 2) {
                            dataType = "TextArea";
                        } else if (res.data_type == 3) {
                            dataType = "DropDown";
                            /*update_default_text ='<label class="control-label">' + "Dropdown Value" + '</label>' +
                             '<textarea class="form-control auto-size" name="default_text" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9_. ]{2,50}$" data-parsley-error-message="Value should contain only Alphanumeric and (._) values, length should be 2-50 characters"></textarea>';*/
                        } else if (res.data_type == 4) {
                            dataType = "Date";
                        } else if (res.data_type == 5) {
                            dataType = "Float";
                        } else {
                            dataType = "String"
                        }
                        if (res.max == null) {
                            max = "";
                        } else {
                            max = res.max;
                        }
                        if (res.min == null) {
                            min = "";
                        } else {
                            min = res.min;
                        }
                        let update_title = '<label class="control-label">' + "Name:" + '<span class="required_star">*</span></label>' +
                            '<input type="text" required="" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9_.]{3,50}$" data-parsley-error-message="Name contains alphanumeric, underscore. Length: 3 to 50" class="form-control" name="title" value="' + res.title + '">';
                        let update_display_name = '<label class="control-label">' + "Display Name" + '<span class="required_star">*</span></label>' +
                            '<input type="text" data-parsley-required="" data-parsley-trigger="change" data-parsley-length="[3, 50]" class="form-control" name="displayname" value="' + res.displayname + '">';

                        let data_type = '<option selected="selected" value="' + res.data_type + '">' + dataType + '</option>';

                        let update_required = '<option selected="selected" value="' + res.required + '">' + required + '</option>';
                        let update_unique = '<option selected="selected" value="' + res.unique + '">' + unique + '</option>';
                        let update_doc = '<option selected="selected" value="' + res.doc + '">' + res.doc + '</option>';

                        let update_order = '<option selected="selected" value="' + res.order + '">' + res.order + '</option>';

                        let default_textarea_text = '<label class="control-label">' + "Default Text" + '</label>' +
                            '<textarea class="form-control auto-size" name="default_text" data-parsley-trigger="change" maxlength="250" minlength="2" data-parsley-error-message="Length should be 2-250 characters">' + res.default_text + '</textarea>';
                        let default_drop_text = '<label class="control-label">' + "Dropdown Value" + '</label>' +
                            '<textarea class="form-control auto-size" required name="default_text" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9\\\\&\/_.\r -]{2,2000}$" data-parsley-error-message="Dropdown Value contains alphanumeric and ( - , _, /, \\, &, . ). Length should be 2-2000 characters">' + res.default_text + '</textarea>';
                        let update_default_text = '<label class="control-label">' + "Default Text" + '</label>' +
                            '<input type="text" data-parsley-trigger="change" minlength="2" maxlength="50" data-parsley-error-message="Length should be according to maximum and minimum field" class="form-control" name="default_text" value="' + res.default_text + '">';
                        let int_text = '<label class="control-label">' + "Put Integer Value" + '</label>' +
                            '<input type="text" data-parsley-trigger="change" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value" class="form-control" name="default_text" value="' + res.default_text + '">';
                        let float_text = '<label class="control-label">' + "Decimal Value" + '</label>' +
                            '<input type="text" data-parsley-trigger="change" data-parsley-type="number" data-parsley-error-message="Value should contain only Decimal values" class="form-control" name="default_text" value="' + res.default_text + '">';
                        let date_text = '<label class="control-label">' + "Date" + '</label>' +
                            '<input type="text" class="form-control date-time-picker" id="update_date_box" name="default_text" value="' + res.default_text + '">';
                        let max_field = '<label class="control-label">' + "Maximum" + '<span class="required_star">'+"*"+'<span>'+ '</label>' +
                            '<input id="update_max_field" type="text" value="' + max + '" required data-parsley-trigger="change" data-parsley-ge="#update_min_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be greater or equal to minimum field" class="form-control" name="max">';
                        let min_field = '<label class="control-label">' + "Minimum" + '<span class="required_star">'+"*"+'<span>'+ '</label>' +
                            '<input id="update_min_field" type="text" value="' + min + '" required data-parsley-trigger="change" data-parsley-le="#update_max_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be smaller or equal to maximum field" class="form-control" name="min">';
                        $('#update_meta_order').find('option[value =' + res.order + ']').remove();
                        $('#update_meta_order').append(update_order);
                        $('#update_required').find('option[value =' + res.required + ']').remove();
                        $('#update_required').append(update_required);
                        $('#update_unique').find('option[value =' + res.unique + ']').remove();
                        $('#update_unique').append(update_unique);
                        $('#update_data_type').find('option[value =' + res.data_type + ']').remove();
                        $("#update_data_type").append(data_type);
                        $("#update_title").empty().append(update_title);
                        $("#update_display_name").empty().append(update_display_name);
                        $(".update_max_field").empty().append(max_field);
                        $(".update_min_field").empty().append(min_field);
                        // $("#update_max_field").keyup(function () {
                        //     $("#update_default_text input").attr('maxlength', $(this).val());
                        // });
                        // $("#update_min_field").keyup(function () {
                        //     $("#update_default_text input").attr('minlength', $(this).val());
                        // });
                        $(document).on('keyup', '#update_max_field', function () {
                            $("#update_default_text input").attr('maxlength', $(this).val());
                        });
                        $(document).on('keyup', '#update_min_field', function () {
                            $("#update_default_text input").attr('minlength', $(this).val());
                        });
                        if (res.data_type == 0) {
                            console.log("string");
                            $("#update_default_text").empty().append(update_default_text);
                            $("#update_default_text input").attr('maxlength', $("#update_max_field").val());
                            $("#update_default_text input").attr('minlength', $("#update_min_field").val());
                            $(".update_max_field").css('display', 'block');
                            $(".update_min_field").css("display", "block");
                            $(".update_max_field").empty();
                            $(".update_max_field").append(max_field);
                            $(".update_min_field").empty();
                            $(".update_min_field").empty().append(min_field);
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                        } else if (res.data_type == 1) {
                            console.log("int");
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("#update_default_text").empty().append(int_text);
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                        } else if (res.data_type == 2) {
                            console.log("Texta");
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("#update_default_text").empty().append(default_drop_text);
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                        } else if (res.data_type == 3) {
                            console.log("drop");
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                            $("#update_default_text").empty().append(default_drop_text);
                        }
                        else if (res.data_type == 4) {
                            console.log("date");
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                            $("#update_default_text").empty().append(date_text);
                            $('#update_date_box').datetimepicker({
                                format: 'YYYY-MM-DD',
                                useCurrent: false,
                            });
                        }
                        else if (res.data_type == 5) {
                            console.log("float");
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                            $("#update_default_text").empty().append(float_text);
                        } else {
                            $(".update_max_field").css('display', 'none');
                            $(".update_min_field").css("display", "none");
                            $("input#update_max_field").removeAttr('required');
                            $("input#update_min_field").removeAttr('required');
                            $("#update_default_text").empty().append(update_default_text);
                        }
                        $('#updateing_doc').css("display", "none");
                        $('#update_doc_id').append(update_doc);
                        $('#update_metafield_modal').modal().show();
                        $("#update_required").selectpicker('refresh');
                        $("#update_unique").selectpicker('refresh');
                        $("#update_data_type").selectpicker('refresh');
                        $("#update_meta_order").selectpicker('refresh');
                        $('#update_data_type').on('change', function () {
                            $("#update_metafield_form").parsley().reset();
                            if (this.value == 0) {
                                console.log("string");
                                let max_field = '<label class="control-label">' + "Maximum" + '</label>' +
                                    '<input id="update_max_field" type="text" data-parsley-trigger="change" data-parsley-ge="#update_min_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be greater or equal to minimum field" class="form-control" name="max">';
                                let min_field = '<label class="control-label">' + "Minimum" + '</label>' +
                                    '<input id="update_min_field" type="text" data-parsley-trigger="change" data-parsley-le="#update_max_field" data-parsley-type="integer" data-parsley-error-message="Value should contain only Integer value and must be smaller or equal to maximum field" class="form-control" name="min">';
                                $("#update_default_text").empty().append(update_default_text);
                                $('#update_default_text').find('input:text').val('');
                                $(".update_max_field").empty();
                                $(".update_max_field").append(max_field);
                                $(".update_min_field").empty();
                                $(".update_min_field").append(min_field);
                                /*$("input#update_max_field").removeAttr('required');
                                 $("input#update_min_field").removeAttr('required');*/
                                $(".update_max_field").css('display', 'block');
                                $(".update_min_field").css("display", "block");
                            }
                            if (this.value == 3) {
                                console.log("drp");
                                $("#update_default_text").empty().append(default_drop_text);
                                $('#update_default_text').find('input:text').val('');
                                $(".update_max_field").css('display', 'none');
                                $(".update_min_field").css("display", "none");
                            }
                            if (this.value == 2) {
                                console.log("txa");
                                $("#update_default_text").empty().append(default_textarea_text);
                                $('#update_default_text').find('textarea').val('');
                                $(".update_max_field").css('display', 'none');
                                $(".update_min_field").css("display", "none");
                                /*$("#update_default_text").text(res.default_text);*/
                            }
                            if (this.value == 1) {
                                console.log("int");
                                $("#update_default_text").empty().append(int_text);
                                $('#update_default_text').find('input:text').val('');
                                $(".update_max_field").css('display', 'none');
                                $(".update_min_field").css("display", "none");
                            }
                            if (this.value == 4) {
                                console.log("date");
                                $("#update_default_text").empty().append(date_text);
                                $('#update_default_text').find('input:text').val('');
                                $("input#update_max_field").removeAttr('required');
                                $("input#update_min_field").removeAttr('required');
                                $('#update_date_box').datetimepicker({
                                    format: 'YYYY-MM-DD',
                                    useCurrent: false,
                                });
                                $(".update_max_field").css('display', 'none');
                                $(".update_min_field").css("display", "none");
                            }
                            if (this.value == 5) {
                                console.log("flt");
                                $("#update_default_text").empty().append(float_text);
                                $('#update_default_text').find('input:text').val('');
                                $(".update_max_field").css('display', 'none');
                                $(".update_min_field").css("display", "none");
                            }
                        });

                    }
                });
            } else {
                if ($(this).data('parent') === undefined) {
                    $.ajax({
                        url: ajax_url + 'category/' + update_url_id,
                        method: 'GET',
                        success: function (res) {
                            let types;
                            if (res.type == 'cat') {
                                types = 'Category';
                            } else {
                                types = 'Document';
                            }
                            let published = (res.published == false) ? "N/A" : "Published";
                            let published_option = '<option selected="selected" value="' + res.published + '">' + published + '</option>';
                            let option = '<option selected="selected" value="' + res.type + '">' + types + '</option>';
                            let name = '<label class="control-label">' + "Name" + '<span class="required_star">*</span></label>' + '<input type="text" required="" data-parsley-trigger="change" data-parsley-pattern="^[a-zA-Z0-9_. ]{2,50}$" data-parsley-error-message="Name should contain only should contain only Alphanumeric and (._) values, length should be 2-50 characters" name="name" class="form-control fg-input" id="#name_value" value="' + res.name + '">';

                            $("#update_parent_name").empty().append(name);
                            $('#update_parent_cat_doc_field').find('option[value =' + res.type + ']').remove();
                            $("#update_parent_cat_doc_field").append(option);
                            $('#update_parent_published_field').find('option[value =' + res.published + ']').remove();
                            $("#update_parent_published_field").append(published_option);
                            $('#update_parent_new_cat_doc').modal().show();
                            $("#update_parent_cat_doc_field").selectpicker('refresh');
                            $("#update_parent_published_field").selectpicker('refresh');
                        }
                    });
                } else {
                    if ($(this).data('type') == 'cat') {
                        $.ajax({
                            url: ajax_url + 'category/' + update_url_id,
                            method: 'GET',
                            success: function (res) {
                                let html = '<option value=' + res.id + '>' + res.name + '</option>';
                                $("#select_parent").empty().append(html);
                                $('#add_new_cat_doc').modal().show();
                            }
                        });

                    }
                    else if ($(this).data('type') == 'doc') {
                        $.ajax({
                            url: ajax_url + 'category/' + update_url_id,
                            method: 'GET',
                            success: function (res) {
                                let html = '<option value=' + res.id + '>' + res.name + '</option>';
                                $("#doc").empty().append(html);
                                $('#add_new_metafield').modal().show();
                            }
                        });
                    }
                    /*else if ($(this).data('type') == 'meta') {
                     $.ajax({
                     url: ajax_url + 'metafield/?doc_id=' + update_url_id,
                     method: 'GET',
                     success: function (res) {
                     let html = '<option value=' + res.id + '>' + res.name + '</option>';
                     $("#doc").empty().append(html);
                     $('#add_new_metafield').modal().show();
                     }
                     });
                     }*/
                    else if ($(this).data('type') === null) {
                        /*$('#add_new_cat_doc').modal().show();*/
                        $('#add_parent_new_cat_doc').modal().show();
                    }
                }
            }
        });

        let update_parent_frm = $('#update_parent_new_cat_doc_form');
        let parent_modal = $("#update_parent_new_cat_doc");

        update_parent_frm.submit(function (e) {
            e.preventDefault();
            let update_url_id = $("#update_btn").data('self');
            let update_root_cat_doc_url = "/api/v1/dms/categorization/category/" + update_url_id + "/";
            let data = new FormData($(this)[0]);
            let update_parent_parsley = update_parent_frm.parsley();
            update_parent_parsley.validate();
            if (update_parent_parsley.isValid()) {
                $.ajax({
                    type: "PATCH",
                    url: update_root_cat_doc_url,
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function (res) {

                        let type = (res.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                        data.published = (res.published == false) ? "N/A" : "Published";
                        let groupNames = [];
                        $.each(res.group, function (i, j) {
                            groupNames.push(j.groups__name);
                        });
                        let html =
                            '<tr class="clickie" data-type="' + res.type + '" data-info="' + '{' + 'parent' + ':' + res.parent + ',' + 'self' + ':' + res.id + '}' + '">' +
                            '<td>' + res.name + '</td>' +
                            '<td>' + type + '</td>' +
                            '<td>' + data.published + '</td>' +
                            '<td>' + groupNames + '</td>' +
                            '<td>' + retention_value(res) + '</td>' +
                            '</tr>';
                        /*let index = $table.find('.selected').index();*/
                        $table.find('.selected').empty();
                        $table.find('tbody').append(html);
                        /*$table.find('tr')[index].append(html);*/
                        parent_modal.modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        $('#update_btn, #delete_btn').prop('disabled', true);
                        notify('Congratulations!!! ', type + ' Updated Successfully ', ' ', 'success');
                    }
                    ,
                    error: function (response) {
                        var errors = response.responseText;
                        $.each(JSON.parse(errors), function (key, value) {
                            var nMessage = value;
                            notify('', nMessage, '', 'danger', 3000);
                        });
                    }
                });
                return false;
            }

        });
        /*------------------Update MetaField---------------*/

        /*let up_meta_parsley = $("#update_metafield_form").parsley();
         let update_metafield_frm = $('#update_metafield_form');
         let update_metafield_modal = $("#update_metafield_modal");
         update_metafield_frm.submit(function (e) {
         e.preventDefault();
         let update_url_id = $("#update_btn").data('self');
         let update_metafield_url = ajax_url + 'metafield/' + update_url_id + "/";
         let data = new FormData($(this)[0]);
         up_meta_parsley.validate();
         if (up_meta_parsley.isValid()) {
         $.ajax({
         type: "PATCH",
         url: update_metafield_url,
         data: data,
         processData: false,
         contentType: false,
         success: function (data) {
         let required = (data.required == 0) ? 'No' : 'Yes';
         let dataType;
         if (data.data_type == 0) {
         dataType = "String";
         } else if (data.data_type == 1) {
         dataType = "Integer";
         } else if (data.data_type == 2) {
         dataType = "TextArea";
         } else if (data.data_type == 3) {
         dataType = "DropDown";
         } else if (data.data_type == 4) {
         dataType = "Date";
         } else if (data.data_type == 5) {
         dataType = "Float";
         } else {
         dataType = "String"
         }
         $($table.find('thead tr th')[0]).attr('colspan', 5);
         let head =
         '<td>Order</td>' +
         '<td>Title</td>' +
         '<td>Data Type</td>' +
         '<td>Default Value</td>' +
         '<td>Required</td>';
         $($table.find('thead tr')[1]).html(head);
         let html =
         '<tr class="clickie" data-type="meta" data-info="' + '{' + 'self' + ':' + data.id + '}' + '">' +
         '<td>' + data.order + '</td>' +
         '<td>' + data.title + '</td>' +
         '<td>' + dataType + '</td>' +
         '<td>' + data.default_text + '</td>' +
         '<td>' + required + '</td>' +
         '</tr>';
         $table.find('.selected').empty();
         $table.find('tbody').append(html);
         update_metafield_modal.modal('hide');
         $('body').removeClass('modal-open');
         $('.modal-backdrop').remove();
         $('#update_btn, #delete_btn').prop('disabled', true);
         notify('Congratulations!!! ', 'Metafield updated Successfully ', ' ', 'success');
         }
         ,
         error: function (response) {
         var errors = response.responseText;
         $.each(JSON.parse(errors), function (key, value) {
         var nMessage = key + ": " + value;
         notify('', nMessage, '', 'danger');
         });
         }
         });
         return false;

         }

         });*/
        let updating_meta_form = $("#update_metafield_form").parsley();
        let update_metafield_modal = $("#update_metafield_modal");
        $('#update_meta_save').on('click', (e) => {
            e.preventDefault();
            let update_url_id = $("#update_btn").data('self');

            let update_metafield_url = ajax_url + 'metafield/' + update_url_id + "/";
            updating_meta_form.validate();
            if (updating_meta_form.isValid()) {
                let data = {};
                data.title = (($('#update_metafield_form [name="title"]')).val()).toLowerCase();
                data.displayname = ($('#update_metafield_form [name="displayname"]')).val();
                data.data_type = $('#update_data_type').val();
                data.default_text = ($('#update_metafield_form [name="default_text"]')).val();
                // data.max = "";
                // data.min = "";
                if ($("#update_data_type").val() == 0) {
                    console.log("update");
                    data.max = $('#update_metafield_form [name="max"]').val();
                    data.min = $('#update_metafield_form [name="min"]').val();
                }
                data.order = $('#update_meta_order').val();
                data.required = $('#update_required').val();
                data.unique = $('#update_unique').val();
                data.doc = $("#update_doc_id").val();
                data = JSON.stringify(data);
                $.ajax({
                    url: update_metafield_url,
                    method: 'PATCH',
                    data: data,
                    contentType: "application/json",
                    success: function (data) {
                        console.log(data.displayname);
                        let required = (data.required == 0) ? 'No' : 'Yes';
                        let unique = (data.unique == 0) ? 'No' : 'Yes';
                        let dataType;
                        if (data.data_type == 0) {
                            dataType = "String";
                        } else if (data.data_type == 1) {
                            dataType = "Integer";
                        } else if (data.data_type == 2) {
                            dataType = "TextArea";
                        } else if (data.data_type == 3) {
                            dataType = "DropDown";
                        } else if (data.data_type == 4) {
                            dataType = "Date";
                        } else if (data.data_type == 5) {
                            dataType = "Float";
                        }
                        $($table.find('thead tr th')[0]).attr('colspan', 6);
                        let head =
                            '<td>Title</td>' +
                            '<td>Display Name</td>' +
                            '<td>Data Type</td>' +
                            '<td>Default Value</td>' +
                            '<td>Required</td>' +
                            '<td>Order</td>';
                        $($table.find('thead tr')[1]).html(head);
                        let html =
                            '<tr class="clickie" data-type="meta" data-info="' + '{' + 'self' + ':' + data.id + '}' + '">' +
                            '<td>' + data.title + '</td>' +
                            '<td>' + data.displayname + '</td>' +
                            '<td>' + dataType + '</td>' +
                            '<td>' + data.default_text + '</td>' +
                            '<td>' + required + '</td>' +
                            '<td>' + data.order + '</td>' +
                            '</tr>';
                        $table.find('.selected').empty();
                        $table.find('tbody').append(html);
                        update_metafield_modal.modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        $("#all_doc_list tbody tr.clickie").dblclick(function () {
                            return false;
                        });
                        $('#update_btn, #delete_btn').prop('disabled', true);
                        notify('Congratulations!!! ', 'Metafield updated Successfully ', ' ', 'success');
                    },
                    error: function (response) {
                        var errors = response.responseText;
                        $.each(JSON.parse(errors), function (key, value) {
                            var nMessage = value;
                            notify('', nMessage, '', 'danger', 3000);
                        });
                    }
                });
            } else {
                console.log("Parsley Error");
            }
        });

        /*});*/


        //---------------Publish Field------------------

        $(document).on('click', '#pub_per', function () {
            let update_id = $(this).data('self');
            $.ajax({
                url: ajax_url + 'category/' + update_id,
                method: 'GET',
                success: function (res) {
                    let published = res.published;
                    $("#publish_select").selectpicker('refresh');
                    $('#publish_select').selectpicker('val', [published]);
                },
                error: function (res) {
                    console.log(res);
                }
            });
            $('#publish_modal').modal().show();
        });

        $('#save_publish').on('click', (e) => {
            e.preventDefault();
            let update_url_id = $("#pub_per").data('self');
            let update_pub_url = "/api/v1/dms/categorization/category/" + update_url_id + "/";
            $.ajax({
                type: "PATCH",
                "processData": false,
                "contentType": false,
                "cache": false,
                url: update_pub_url,
                data: new FormData($('#assign_publish_form')[0]),
                success: function (res) {

                    let type = (res.type.toLowerCase() == 'cat') ? '<i class="zmdi zmdi-folder"></i> Category' : '<i class="zmdi zmdi-file"></i> Document';
                    res.published = (res.published == false) ? "N/A" : "Published";
                    let groupNames = [];
                    $.each(res.group, function (i, j) {
                        groupNames.push(j.groups__name);
                    });
                    $table.find('tr.selected td:nth-last-child(3)').empty().append(res.published);
                    $table.find('tr.selected').removeClass('selected');
                    // let html =
                    //     '<tr class="clickie" data-type="' + res.type + '" data-info="' + '{' + 'parent' + ':' + res.parent + ',' + 'self' + ':' + res.id + '}' + '">' +
                    //     '<td>' + res.name + '</td>' +
                    //     '<td>' + type + '</td>' +
                    //     '<td>' + res.published + '</td>' +
                    //     '<td>' + groupNames + '</td>' +
                    //     '</tr>';
                    // // let index = $table.find('.selected').index();
                    // $table.find('.selected').empty();
                    // $table.find('tbody').append(html);
                    // $table.find('tr')[index].append(html);
                    $("#publish_modal").modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    $('#update_btn, #delete_btn, #assign_group, #pub_per, #retention').prop('disabled', true);
                    notify('Congratulations!!! ', type + ' Updated Successfully ', ' ', 'success');
                }
                ,
                error: function (response) {
                    var errors = response.responseText;
                    $.each(JSON.parse(errors), function (key, value) {
                        var nMessage = value;
                        notify('', nMessage, '', 'danger', 3000);
                    });
                }
            });
        });
        $(document).on('change', '#retention_policy', function () {
           if($(this).val() == '0'){
               $('#retention_period').val(0);
               $('#retention_period').attr('data-parsley-required', false);
           }else {
               $('#retention_period').attr('data-parsley-required', true);
           }
        });
        $(document).on('click', '#retention', function () {
            let update_id = $(this).data('self');
            $.ajax({
                url: ajax_url + 'category/' + update_id,
                method: 'GET',
                success: function (res) {
                    let retention_period = res.retention_period;
                    if (res.retention_policy == '0') {
                        retention_period = 0;
                    }
                    $('#retention_policy').selectpicker('val', res.retention_policy);
                    $("#retention_policy").selectpicker('refresh');
                    $('#retention_period').val(retention_period);
                    $('#retention_modal').modal().show();
                },
                error: function (res) {
                    console.log(res);
                }
            });
        });
        $(document).on('click', '#save_retention', function (e) {
            e.preventDefault();
            let update_url_id = $("#retention").data('self');
            let update_pub_url = "/api/v1/dms/categorization/category/" + update_url_id + "/";
            var $form_parsley = $('#retention_form').parsley();
            $form_parsley.validate();
            if (!$form_parsley.isValid()) {
                return;
            }
            var $form = new FormData($('#retention_form')[0]);
            $.ajax({
                "method": "PATCH",
                "processData": false,
                "contentType": false,
                "cache": false,
                "data": $form,
                "url": update_pub_url,
                "success": function (res) {
                    $('#retention_modal').modal('hide');
                    $table.find('tr.selected td:nth-last-child(1)').empty().append(retention_value(res));
                    $table.find('tr.selected').removeClass('selected');
                    notify('', 'Retention Policy Updated successfully', '', 'success', 4000);
                },
                "error": function (res) {
                    var errors = res.responseText;
                    $.each(JSON.parse(errors), function (key, value) {
                        var nMessage = value;
                        notify('', nMessage, '', 'danger', '5000');
                    });
                }

            })
        });
        //---------------Assign Group-------------------
        $(document).on('click', '#assign_group', function () {
            console.log($(this).data('self'));
            let doc_id = $(this).data('self');
            let get_doc_info = "/api/v1/dms/categorization/descendants/" + doc_id;
            let Ass_group_ids = [];
            $.ajax({
                type: 'GET',
                url: get_doc_info,
                success: function (res) {
                    $.each(res.descendants, function (i, k) {
                        $.each(k.group, function (m, n) {
                            Ass_group_ids.push(n.groups__id);
                        });
                    });
                }
            });
            $.ajax({
                type: "GET",
                url: group_url,
                dataType: "json",
                success: function (data) {
                    $("#group_select").empty();
                    $.each(data, function (i, d) {
                        $("#group_select").append($('<option>', {
                            value: d.id,
                            text: d.name,
                        }));
                        /*let option_grp = '<option value=' + d.id + '>' + d.name + '</option>';
                         $("#group_select").append(option_grp);*/
                    });
                    $("#group_select").selectpicker('refresh');
                    $('#group_select').selectpicker('val', Ass_group_ids);
                    $("#docselect").empty().append('<option value=' + doc_id + '></option>');
                },
                error: function (response) {
                    /*$.each(JSON.parse(response.responseText), (k, v) => {
                     notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger', 10000);
                     });*/
                }
            });
            $('#group_modal').modal().show();
        });
        //---------------------post Group-----------------
        $('#save_grp').on('click', (e) => {
            let doc_id = $(this).data('self');
            let doc_url = "/api/v1/dms/categorization/category/" + doc_id + "/";
            e.preventDefault();
            e.stopImmediatePropagation();
            var group_form_data = {
                docid: $('#docselect').val(),
                group: $('#group_select').val() != null ? $('#group_select').val() : [],
            };
            $.ajax({
                url: docpermission,
                method: 'POST',
                data: JSON.stringify(group_form_data),
                "processData": false,
                "headers": {
                    "content-type": "application/json",
                },
                success: function (res) {
                    let groupNames = [];
                    $.each(res.result, function (i, j) {
                        groupNames.push(j.groups__name + ",");
                    });
                    $table.find('tr.selected td:nth-last-child(2)').empty().append(groupNames);
                    $('#assign_group_form').trigger('reset');
                    // $('#group_modal').modal('toggle');
                    $("#group_modal").modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    notify('Congratulations!!! ', ' Group Assigned Successfully ', ' ', 'success');
                },
                error: (res) => {
                    console.log(res);
                }
            });
        });

        /*--------------------Delete--------------------*/
        $(document).on('click', '#delete_btn', function () {
            let url_id = $(this).data('self');
            let delete_url;
            if ($(this).data('type') == 'meta') {
                delete_url = ajax_url + 'metafield/' + url_id;
            } else {
                delete_url = "/api/v1/dms/categorization/category/" + url_id;
            }
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this file!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
            }).then(function () {
                $.ajax({
                    type: "DELETE",
                    url: delete_url,
                    data: "csrfmiddlewaretoken=" + getCookie("csrftoken"),
                    success: function (res) {
                        swal("Deleted!", "Deletion successful", "success");
                        $table.find('.selected').empty();
                        $('#update_btn, #delete_btn').prop('disabled', true);
                    }
                    ,
                    error: function (response) {
                        console.log(response);
                    }
                });
            });
        });

        /*--------------------Publish field----------------------*/
        /*$(document).on('change', '#cat_doc_field', function () {
         if ($(this).val() == 'cat') {
         $('#publish_field').css('display', 'none');
         } else {
         $('#publish_field').css('display', 'block');
         }
         });
         $(document).on('change', "#published", function () {
         if ($(this).is(':checked')) {
         $(this).attr('value', 0);
         } else {
         $(this).attr('value', 1);
         }
         });*/
        /*--------------Parsley Validation-------------*/
        $('#add_parent_new_cat_doc_form').parsley();
        $('#add_new_cat_doc_form').parsley();
        $('#add_new_metafield_form').parsley();
    }

    init();
}