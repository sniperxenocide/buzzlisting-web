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
    let $search_text = $("#search_text"),
        $search_drop_icon = $(".search_drop_icon"),
        $search_menu = $(".search-menu-head"),
        $select_search = $("#select_search"),
        $search_icon = $("#search_icon"),
        $metaGenWrap = $('.meta-data-wrap'),
        $dmsSearch = $("#dms_search_form"),
        $workflowSearch = $("#workflow_search_form"),
        $docname = $("#docname"),
        $doccreated = $("#doccreated"),
        $docexpired = $("#docexpire"),
        $search_tags = $("#search_tags"),
        $documentType = $("#documentType"),
        $dms_reset_btn = $("#dms_reset_btn"),
        $workflow_reset_btn = $("#workflow_reset_btn"),
        $dms_normal_search = $("#dms_normal_search"),
        $workflow_normal_search = $("#workflow_normal_search"),
        $search_result_download = $('.search_result_download'),
        $select_all_status = false,
        $exclude_from_selection = [],
        $_search_type = 0,
        $_search_key = {},
        length = 10,
        $search_doc_id_list = [],
        $_search_total_loop = 0;

    $wf_project_id = $("#wf_project_id");
    $var_gen_wrap = $(".var_gen_wrap");
    $search_history_content = $("#search_history_content");
    $process_map_tab = $("#search_process_map_tab");
    $uploaded_document_tab = $("#uploaded_document_tab");
    $generated_document_tab = $("#search_generated_document_tab");
    // $wf_variables = $("#wf_variables");


//    $("#test_btn").on('click', function(){
//        window.location = search_url
//    })
    //--------Search onclick functions------------
    function searchReset() {
        $documentType.selectpicker('refresh');
        $documentType.selectpicker('val', 0);
        $select_search.selectpicker('refresh');
        $select_search.selectpicker('val', 1);
        $workflowSearch.css('display', 'none');
        $dmsSearch.css('display', 'block');
        $($dmsSearch).trigger('reset');
        $($workflowSearch).trigger('reset');
        $('.fg-line.fg-toggled').removeClass('fg-toggled');
        $search_tags.val(null).trigger("change");
        $search_text.val(null);
        $wf_project_id.selectpicker('refresh');
        $wf_project_id.val('val', '');
        $(".wf_project_class").css('display', 'none');
        $metaGenWrap.empty();
    }

    $search_icon.on('click', function () {
        searchReset();
    });
    $search_text.on('click', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css('display', 'block');
    });

    $search_drop_icon.on('click', function () {
        searchReset();
        $(".search-menu-normal").css("display", "none");
        $($dmsSearch).parsley().destroy();
        $documentType.empty().append('<option value="0">CHOOSE</option>');
        genDoc();
        $search_menu.toggle();
    });

    $(document).on('click', '#dms_search_btn, #workflow_search_btn', function () {
        $documentType.selectpicker('refresh');
        $documentType.selectpicker('val', 0);
        $($dmsSearch).trigger('reset');
        $($workflowSearch).trigger('reset');
        $('.fg-line.fg-toggled').removeClass('fg-toggled');
        $search_tags.val(null).trigger("change");
        $metaGenWrap.empty();
    });

    function reset() {
        $documentType.selectpicker('refresh');
        $documentType.selectpicker('val', 0);
        $($dmsSearch).trigger('reset');
        $($workflowSearch).trigger('reset');
        $('.fg-line.fg-toggled').removeClass('fg-toggled');
        $search_tags.val(null).trigger("change");
        $wf_project_id.val('val', '');
        $wf_project_id.selectpicker('refresh');
        $var_gen_wrap.empty();
        $metaGenWrap.empty();
    }

    $(document).on('click', '#dms_reset_btn, #workflow_reset_btn', function (e) {
        e.preventDefault();
        reset();
//          document.location.href = search_result_url
    });
    $(document).on('click', '.search-back', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css("display", "none");
        $("#header").removeClass("search-toggled");
        searchReset();
    });

    $(document).on('click', '#main', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css("display", "none");
        $("#header").removeClass("search-toggled");
    });

    // $('#search_pagination').twbsPagination({
    //     totalPages: 35,
    //     visiblePages: 7,
    //     cssStyle: '',
    //     onPageClick: function (event, page) {
    //         // npbtn();
    //         console.log(page);
    //     }
    // });
    let $pagination = $("#search_pagination");
    $pagination.twbsPagination();
    let defaultOpts = {
        totalPages: 5,
        visiblePages: 5,
    };

    //------------------Select2-------------------------
    $search_tags.select2({
        tags: true,
        tokenSeparators: [',', ' ']
    });

    //--------Select Search on click event--------------
    $select_search.on('change', function () {
        if (this.value == 1) {
            reset();
            $(".wf_project_class").css('display', 'none');
            $workflowSearch.css('display', 'none');
            $dmsSearch.css('display', 'block');
        }
        else {
            reset();
            $(".wf_project_class").css('display', 'block');
            $workflowSearch.css('display', 'block');
            $dmsSearch.css('display', 'none');
            $var_gen_wrap.empty();
            genProject();
        }
    });

    //---------------Disable Search button-----------------------
    // $doccreated.keyup(function () {
    //     if (this.value != '') {
    //         $("#search_btn").removeAttr('disabled');
    //     } else {
    //         $("#search_btn").attr('disabled', 'disabled');
    //     }
    // });

    // $('#file_number, #docid, #docname, #search_tags, #documentType').bind('keyup change', function () {
    //     if (this.value != '') {
    //         $("#search_btn").removeAttr('disabled');
    //     } else {
    //         $("#search_btn").attr('disabled', 'disabled');
    //     }
    // });
    $('#wf_project_id, #wf_variables, #var_name, #var_size, #var_type, #var_default, #var_accepted_default').bind('keyup change', function () {
        if (this.value != '') {
            $("#workflow_search_btn").removeAttr('disabled');
        } else {
            $("#workflow_search_btn").attr('disabled', 'disabled');
        }
    });
    //--------------------Date Format-------------------------
    $doccreated.datetimepicker({
        format: 'YYYY-MM-DD',
        useCurrent: true,
    });

    $docexpired.datetimepicker({
        format: 'YYYY-MM-DD',
        useCurrent: true,
    });

    //----------Generate document type dropDown list----------
    function genDoc() {
        $.ajax({
            url: '/api/v1/dms/categorization/documenttype/',
            method: 'GET',
            success: function (data) {
                $.each(data, function (k, v) {
                    let $this = v;
                    let ancestors = $this.ancestors;

                    //console.log(ancestors);
                    let option = {};
                    let optionName = "";
                    if (ancestors.length > 0) {
                        $.each(ancestors, function (k, v) {
                            optionName += v.name + '&rarr;';
                        });
                    }
                    else {
                        optionName = "";
                    }
                    optionName = optionName + $this.name;
                    option[$this.id] = optionName;

                    let html = '<option value="' + $this.id + '">' + optionName + '</option>';

                    $('#documentType').append(html).selectpicker('refresh');
                });

            },
            error: function (response, jqXHR, textStatus, errorThrown) {
                console.log(response);
            }
        });
    }


    genDoc();
    //Get meta Datas and show on change
    $documentType.on('change', function () {
        $metaGenWrap.empty();
        $('#dms-search_form').parsley();
        let selectedVal = $('#documentType option:selected').val();
        let template;
        //console.log(selectedVal);
        if (selectedVal != '') {
            $.ajax({
                url: '/api/v1/dms/categorization/metafield/?doc_id=' + selectedVal,
                method: 'GET',
                success: function (data) {
                    if (data.length > 0) {
                        $.each(data, function (k, v) {
                            let metaId = v['title'].toLowerCase().split(" ");
                            if (metaId.length > 1) {
                                metaId = metaId.join('_');
                            } else {
                                metaId = metaId[0];
                            }
                            v.id = metaId;
                            switch (v.data_type) {
                                case 0:
                                    template = doT.template($('#string_input').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 1:
                                    template = doT.template($('#integer_input').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 2:
                                    template = doT.template($('#textArea_input').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 3:
                                    template = doT.template($('#dropDown_input').html());

                                    let optionArr = v.default_text.split('\n');

                                    let options = '';
                                    $.each(optionArr, function (k, v) {
                                        options += '<option value="' + v + '">' + v + '</option>';
                                    });

                                    v.options = options;
                                    $metaGenWrap.append(template(v));
                                    $metaGenWrap.find('.selectpicker').selectpicker();
                                    break;
                                case 4:
                                    template = doT.template($('#date_input').html());
                                    $metaGenWrap.append(template(v));
                                    $('.date-time-picker').datetimepicker({format: 'YYYY-MM-DD'});
                                    break;
                                case 5:
                                    template = doT.template($('#string_input').html());
                                    $metaGenWrap.append(template(v));
                                    console.log('Float');
                                    break;
                                default:
                                    $metaGenWrap.empty();
                                    break;
                            }
                        });
                    } else {
                        $metaGenWrap.empty();
                    }

                },
                error: function (response, jqXHR, textStatus, errorThrown) {
                    //console.log(response);
                }
            });
        } else {
            $metaGenWrap.empty();
        }
    });


    //-------------Sync Search----------------
    /*$('#file_number, #docid, #docname, #doccreated,#docexpire,#search_tags').bind('keyup', function () {
     $search_text.val(
     $file_number.attr('name')+":"+$file_number.val() + ' ' +
     $docid.attr('name')+":"+$docid.val() + ' '+
     $docname.attr('name')+":"+$docname.val()+' '+
     $doccreated.attr('name')+":"+$doccreated.val()+' '+
     $docexpired.attr('name')+":"+$docexpired.val()+' '+
     $search_tags.attr('name')+":"+$search_tags.val());
     });*/

    //---------------DMS search pagination---------
    // function dmsPagination() {
    //
    // }

    //-----------------DMS-post-----------------
    // let dms_process_form = $dmsSearch;
    $('#search_btn').on('click', (e) => {
        e.preventDefault();
        let data = {};
        let keyword = {};
        let doc_type_val = $('#documentType').val();

        keyword.metas = {};
        keyword.filename = $('#docname').val();
        keyword.uploader = $('#uploader').val();
        keyword.creation_date = $('#doccreated').val();
        keyword.expiry_date = $('#docexpire').val();
        keyword.box_number = $('#search_box_number').val();
        keyword.shelf_number = $('#search_shelf_number').val();
        keyword.match = $("#match_all").prop("checked");
        keyword.archived = $("#include_archive").prop("checked");
        keyword.tags = $('#search_tags').val();

        if (doc_type_val !== '0') {
            keyword.doc_type = doc_type_val;
        }

        data.user_id = userId;
        let $all_meta_data_fields = $('.meta-data-wrap input,.meta-data-wrap select');
        if ($all_meta_data_fields.length > 0) {
            $all_meta_data_fields.each(function () {
                $all_meta_data_fields.serializeArray().map(function (x) {
                    keyword.metas[x.name] = x.value;
                })
            })
        }
        data.search_type = "advanced";
        $_search_type = 2;
        data.draw = 1;
        data.start = 0;
        data.length = length;
        data.keyword = keyword;
        $_search_key.keys = data;
        resetSelection();

        $.ajax({
            url: "/api/v1/dms/documents/search/",
            method: 'POST',
            data: JSON.stringify(data),
            processData: false,
            headers: {
                "content-type": "application/json",
            },
            success: (res) => {
                dmsSearchResult(res);
                let totalPages = $_search_total_loop = Math.ceil(res.recordsTotal / length);
                let currentPage = $pagination.twbsPagination('getCurrentPage');
                $pagination.twbsPagination('destroy');
                if (totalPages > 0) {
                    $pagination.twbsPagination($.extend({}, defaultOpts, {
                        startPage: currentPage,
                        totalPages: totalPages,
                        first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                        prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                        next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                        last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                        initiateStartPageClick: false,
                        onPageClick: function (event, page) {
                            data.start = (page - 1) * length;
                            data.length = length;
                            data.draw = 1;
                            $.ajax({
                                url: "/api/v1/dms/documents/search/",
                                method: 'POST',
                                data: JSON.stringify(data),
                                processData: false,
                                headers: {
                                    "content-type": "application/json",
                                },
                                success: function (res) {
                                    dmsSearchResult(res);
                                }
                            });
                        }
                    }));
                }

            },
            error: (res) => {
            }
        });
    });

    //------------------Workflow-post----------------
    $('#workflow_search_btn').on('click', (e) => {
        e.preventDefault();
        let data = {};
        data.variable = {};
        data.start = 0;
        data.length = length;
        data.draw = 1;
        data.search_type = "advanced";
        data.project = $('#wf_project_id').val();
        let $var_gen_wrap = $('.var_gen_wrap input,.var_gen_wrap select');
        if ($var_gen_wrap.length > 0) {
            $var_gen_wrap.each(function () {
                $var_gen_wrap.serializeArray().map(function (x) {
                    data.variable[x.name] = x.value;
                })
            })
        }
        $.ajax({
            url: "/api/v1/workflow/search",
            method: 'POST',
            data: JSON.stringify(data),
            processData: false,
            headers: {
                "content-type": "application/json",
            },
            success: (data) => {
                $('#search_modal').modal().show();
                $search_history_content.empty();
            },
            error: (res) => {
                /*$.each(JSON.parse(res.responseText), (k, v) => {
                 notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger');
                 });*/
            }
        });
        // }
    });


    //-------------DMS-Normal-search------------

    $dms_normal_search.on('click', function (e) {
        e.preventDefault();
        let data = {};
        data.start = 0;
        data.length = length;
        data.draw = 1;
        data.user_id = userId;
        data.search_type = "standard";
        $_search_type = 1;
        data.keyword = $search_text.val();
        $_search_key.keys = data;
        resetSelection();

        $.ajax({
            url: "/api/v1/dms/documents/search/",
            method: 'POST',
            data: JSON.stringify(data),
            processData: false,
            headers: {
                "content-type": "application/json",
            },
            success: function (res) {
                dmsSearchResult(res);
                let totalPages = $_search_total_loop = Math.ceil(res.recordsTotal / length);
                let currentPage = $pagination.twbsPagination('getCurrentPage');
                $pagination.twbsPagination('destroy');
                if (totalPages > 0) {
                    $pagination.twbsPagination($.extend({}, defaultOpts, {
                        startPage: currentPage,
                        totalPages: totalPages,
                        first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                        prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                        next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                        last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                        initiateStartPageClick: false,
                        onPageClick: function (event, page) {
                            data.start = (page - 1) * length;
                            data.length = length;
                            data.draw = 1;
                            $.ajax({
                                url: "/api/v1/dms/documents/search/",
                                method: 'POST',
                                data: JSON.stringify(data),
                                processData: false,
                                headers: {
                                    "content-type": "application/json",
                                },
                                success: function (res) {
                                    dmsSearchResult(res);
                                }
                            });
                        }
                    }));
                }
            }
        });
    });

    function resetSelection() {
        $search_doc_id_list = [];
        $exclude_from_selection = [];
        $search_result_download.prop('disabled', true);
        $('.select_all_file').prop('checked', false);
        $select_all_status = false;

        $('.search_document_id').map(function () {
            $(this).prop('checked', false);
        });
    }

    function showHideSelectionTools(show = true) {
        let $_selectors = [$('.select_all_file_area'), $('.search_result_download')];

        for (let i in $_selectors) {
            if (show) {
                $_selectors[i].show();
            } else {
                $_selectors[i].hide();
            }
        }
    }

    function* select_and_download(data) {
        yield $.ajax({
            "url": '/api/v1/dms/documents/download_selected_files/',
            "method": 'POST',
            "data": data,
            "headers": {
                "content-type": "application/json",
            },
            "processData": false,
        }).done(function (data) {
            notify('', data.detail, '', 'success', 5000)
        }).fail(function (jqXHR) {
            notify('', JSON.parse(jqXHR.responseText).detail, '', 'danger', 5000);
        });

        yield resetSelection();
    }

    /* This method use to show search resutl */
    var dmsSearchResult = function (data) {
        $search_history_content.empty();
        let html = "";
        if (data.recordsTotal > 0) {
            $.each(data.data, function (k, v) {
                console.log(v);
                template = doT.template($('#search_list').html());
                v.applicationType = 'dms';
                $search_history_content.append(template(v));
            });
            showHideSelectionTools();
            $('#search_modal').modal().show();

            $('.search_document_id').map(function () {
                if ($select_all_status && $.inArray($(this).data('search-item-id'), $exclude_from_selection) === -1 ||
                    $.inArray($(this).data('search-item-id'), $search_doc_id_list) !== -1) {
                    $(this).prop('checked', true);
                } else {
                    $(this).prop('checked', false);
                }
            });

            // npbtn();
        } else {
            html = '<div class="card">' + '<div class="card-header ch-alt text-center">' + '<h3>No Search Result Found</h3>' + '</div>' + '</div>';
            $search_history_content.html(html);
            $('#search_modal').modal().show();
        }

        $(document).off('click.searchDocOnClick').on('click.searchDocOnClick', '.search_document_id', (e) => {
            let $el = $(e.target);
            let doc_id = $el.data('searchItemId');


            if ($el.prop('checked')) {
                if ($select_all_status) {
                    $exclude_from_selection.splice($.inArray(doc_id, $exclude_from_selection), 1);
                } else {
                    $search_doc_id_list.push(doc_id);
                    $search_result_download.prop('disabled', false);
                }
            } else {
                $search_doc_id_list.splice($.inArray(doc_id, $search_doc_id_list), 1);
                $exclude_from_selection.push(doc_id);

                if ($select_all_status) {
                    if (data.recordsTotal <= $exclude_from_selection.length) {
                        $search_result_download.prop('disabled', true);
                        $('.select_all_file').prop('checked', false);
                        $select_all_status = false;
                        $exclude_from_selection = [];

                    }
                } else {
                    if (!$search_doc_id_list.length) {
                        $search_result_download.prop('disabled', true);
                    }
                }
            }
        });

        $(document).off('click.select_all_file').on('click.select_all_file', '.select_all_file', (e) => {
            let $_status = $(e.target).prop('checked');
            let $_doc_id_checkbox = $('.search_document_id');
            $select_all_status = $_status;

            if ($_doc_id_checkbox.length) {
                $search_result_download.prop('disabled', !$_status);
                $_doc_id_checkbox.map(function () {
                    $(this).prop('checked', $_status);
                })
            }

            $exclude_from_selection = [];
            $search_doc_id_list = [];
        });

        $(document).off('click.SRD').on('click.SRD', '.search_result_download', (e) => {
            e.preventDefault();
            let $selection_type = 0;
            let data = {};

            if ($select_all_status) {
                $selection_type = 1;
                data.search_type = $_search_type;
                data.exclude_list = $exclude_from_selection;
            } else {
                data.doc_id_list = $search_doc_id_list;
            }

            data.selection_type = $selection_type;
            data.search_params = $_search_key.keys;
            data.search_total_loop = $_search_total_loop;
            let $_sad = select_and_download(JSON.stringify(data));
            $_sad.next();
            $_sad.next();
        })
    };

    /*This use for view document in modal*/
    var searchCsvToHtml = function ($selector, $file_path, $number_files) {
        var filePath = $file_path,
            page_ext = "_x_p_c";
        var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
        $('#search_doc_pagination').css('display', 'block');
        if (filePath.endsWith('.xls')) {
            filePath = filePath.replace('/tempfiles', '').replace('.xls', '')+ "/" + folder.replace('.xls', '').split(' ').join('_') + page_ext + "1.csv";
            search_csv_gen($selector, filePath);
        } else if (filePath.endsWith('.xlsx')) {
            filePath = filePath.replace('/tempfiles', '').replace('.xlsx', '')+ "/" + folder.replace('.xlsx', '').split(' ').join('_') + page_ext + "1.csv";
            search_csv_gen($selector, filePath);
            // filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
        }
        $('#search_doc_pagination').twbsPagination({
            totalPages: $number_files,
            visiblePages: 7,
            first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
            prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
            next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
            last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
            onPageClick: function (event, page) {
                var f_path = filePath.replace('/tempfiles', '').replace('.xlsx', '').replace('_x_p_c1.csv', '') + page_ext + page + ".csv";
                $('.search-doc-preview').empty();
                search_csv_gen2('.search-doc-preview', f_path);
            }
        });
        //'/media/repository/2017-07-31/556b10fc422946517bb6b889cefcfd8d.csv'
    };
    var search_csv_gen = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {

            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr({class:'preview-table'})
                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr({class:'preview-tr'})
                .text(function (d) {
                    return d;
                });
        });
    };
    var search_csv_gen2 = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {
            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr({class:'preview-table'})
                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr({class:'preview-td'})
                .text(function (d) {
                    return d;
                });
        });
    };
    $(document).on('click', '.viewDoc', function (e) {
        e.preventDefault();
        $modal = $('#searchViewFile');
        fileUrl = '/dms/document/file/view/#' + location.protocol + '//' + location.host + $(this).data('url');
        let doc_id = $(this).data('id');
        if (fileUrl.endsWith('.doc')) {
            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            $('#search_doc_pagination').hide();
        }
        else if (fileUrl.endsWith('.docx')) {
            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            $('#search_doc_pagination').hide();
        }
        if (fileUrl.endsWith('.xls')) {
            $.ajax({
                url: '/api/v1/dms/documents/version_preview/?doc_id=' + doc_id,
                method: 'GET',
                success: function (res) {
                    let filePath = res.filepath,
                        number_files = res.number_files;
                    searchCsvToHtml($('.search-doc-preview'), filePath, number_files);
                    $modal.modal('show');
                }
            });
        } else if (fileUrl.endsWith('.xlsx')) {
            $.ajax({
                url: '/api/v1/dms/documents/version_preview/?doc_id=' + doc_id,
                method: 'GET',
                success: function (res) {
                    let filePath = res.filepath,
                        number_files = res.number_files;
                    searchCsvToHtml($('.search-doc-preview'), filePath, number_files);
                    $modal.modal('show');
                }
            });
        }
        else {
            let iFrame = '<iframe id="docView" ' +
                'data-printurl="' + fileUrl + '" ' +
                'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
                'allowfullscreen webkitallowfullscreen ' +
                'src="' + fileUrl + '"></iframe>';
            $modal.find('.modal-preview').html(iFrame);
            $('#search_doc_pagination').hide();
        }
        $modal.modal('show');
    });

    $(document).on('click', '.openInNew', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = location.protocol + '//' + location.host + '/dms/document/view/' + $(this).data('id') + '/';
        if ($(this).data('archived') == true) {
            console.log("ok");
            var url = location.protocol + '//' + location.host + '/dms/document/view/archive/' + $(this).data('id') + '/';
        }
        var win = window.open(url, '_blank');
        if (win) {
            //Browser has allowed it to be opened
            win.focus();
        } else {
            //Browser has blocked it
            alert('Please allow popups for this website');
        }
    });

    //------------Workflow-Normal-Search--------------

    $workflow_normal_search.on('click', function (e) {
        e.preventDefault();
        let data = {};
        data.keyword = $search_text.val();
        data.start = 0;
        data.length = length;
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
                if (res.recordsTotal > 0) {
                    let template;
                    showHideSelectionTools(false);
                    $('#search_modal').modal().show();
                    $search_history_content.empty();
                    $("#search_pagination").css('display', 'block');
                    $.each(res.data, function (key, value) {
                        let extension;

                        if (value.extension == "pdf") {
                            extension = "<i class='fa fa-file-pdf-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                        } else if (value.extension == "csv") {
                            extension = "<i class='fa fa-file-text-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                        } else if (value.extension == "xls") {
                            extension = "<i class='fa fa-file-excel-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                        } else if (value.extension == "jpg" || value.extension == "jpeg" || value.extension == "png") {
                            extension = "<i class='fa fa-file-image-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                        }
                        // value.id = href;
                        value.extension = extension;
                        template = doT.template($('#wf_search_list').html());
                        $search_history_content.append(template(value));
                        let totalPages = Math.ceil(res.recordsTotal / length);
                        console.log(totalPages);
                        let currentPage = $pagination.twbsPagination('getCurrentPage');
                        $pagination.twbsPagination('destroy');
                        if (totalPages > 0) {
                            $pagination.twbsPagination($.extend({}, defaultOpts, {
                                startPage: currentPage,
                                totalPages: totalPages,
                                first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                                prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                                next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                                last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                                initiateStartPageClick: false,
                                onPageClick: function (event, page) {
                                    data.start = (page - 1) * length;
                                    data.length = length;
                                    data.draw = 1;
                                    $.ajax({
                                        url: "/api/v1/workflow/search/",
                                        method: 'POST',
                                        data: JSON.stringify(data),
                                        processData: false,
                                        headers: {
                                            "content-type": "application/json",
                                        },
                                        success: function (res) {
                                            $search_history_content.empty();
                                            $.each(res.data, function (key, value) {
                                                let extension;

                                                if (value.extension == "pdf") {
                                                    extension = "<i class='fa fa-file-pdf-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                                                } else if (value.extension == "csv") {
                                                    extension = "<i class='fa fa-file-text-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                                                } else if (value.extension == "xls") {
                                                    extension = "<i class='fa fa-file-excel-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                                                } else if (value.extension == "jpg" || value.extension == "jpeg" || value.extension == "png") {
                                                    extension = "<i class='fa fa-file-image-o' aria-hidden='true' style='font-size: 45px;font-weight: 100'></i>";
                                                }
                                                // value.id = href;
                                                value.extension = extension;
                                                template = doT.template($('#wf_search_list').html());
                                                $search_history_content.append(template(value));
                                            });
                                        }

                                    });
                                }
                            }));
                        }
                    })
                } else {
                    let html;
                    html = '<div class="card">' + '<div class="card-header ch-alt text-center">' + '<h3>No Search Result Found</h3>' + '</div>' + '</div>';
                    $search_history_content.html(html);
                    $('#search_modal').modal().show();
                    $("#search_pagination").css('display', 'none');
                }

            }
        });
    });
}

//--------Generate Project list for Workflow Advanced Search------
function genProject() {
    $.ajax({
        url: '/api/v1/workflow/project',
        method: 'GET',
        success: function (res) {
            $wf_project_id.empty();
            $wf_project_id.append($('<option>' + "CHOOSE" + '</option>'));
            $.each(res, function (i, d) {
                // $wf_project_id.empty();
                $wf_project_id.append($('<option value="' + d.id + '">' + d.title.toUpperCase() + '</option>'));
                $wf_project_id.selectpicker('refresh');
            });

        },
        error: function (res) {
            console.log(res);
        }
    });
}



//----Generate variable list for project-------
$wf_project_id.on('change', function () {
    $var_gen_wrap.empty();
    let project_id = this.value;
    $.ajax({
        method: 'GET',
        url: '/api/v1/workflow/variable/?project=' + project_id,
        success: function (res) {
            if (res.length > 0) {
                let template;
                $.each(res, function (i, v) {
                    if (JSON.parse(v.accepted_defaults).length > 0) {
                        // let html1 = '<label class="control-label">'+v.name+'</label>'+'<select class="selectpicker" name="accepted_defaults" id="accpeted_defaults"></select>';
                        // $var_gen_wrap.append(html1);
                        // $.each(JSON.parse(v.accepted_defaults), function (j,k) {
                        //     let html2 = '<option value = "'+k.value+'">'+k.label+'</option>';
                        //     $("#accpeted_defaults").append(html2);
                        //     $("#accepted_defaults").selectpicker('refresh');
                        // });
                        template = doT.template($('#search_dropdown').html());
                        let optionArr = JSON.parse(v.accepted_defaults);
                        let options = '';
                        $.each(optionArr, function (k, v) {
                            options += '<option value="' + v.value + '">' + v.label + '</option>';
                        });

                        v.options = options;
                        $var_gen_wrap.append(template(v));
                        $var_gen_wrap.find('.selectpicker').selectpicker();
                    } else {
                        template = doT.template($('#search_string_input').html());
                        $var_gen_wrap.append(template(v));
                    }
                    // $.each(JSON.parse(v.accepted_defaults), function (j, k) {
                    //     console.log(k);
                    // });
                    // switch (v.type) {
                    //     case "string":
                    //         template = doT.template($('#search_string_input').html());
                    //         $var_gen_wrap.append(template(v));
                    //         break;
                    //     case "integer":
                    //         template = doT.template($('#search_integer_input').html());
                    //         $var_gen_wrap.append(template(v));
                    //         break;
                    //     default:
                    //         $var_gen_wrap.empty();
                    //         break;
                    // }
                });
            }
            else {
                $var_gen_wrap.empty();
            }
        },
        error: function (res) {
            console.log(res);
        }
    })
});

//-----------Search Summary-----------
$(document).on('click', '.wf_search_link, #wf_app_number', function () {
    let uid = $(this).data('info');
    $("#search_process_map_tab").data('info', uid);
    $("#uploaded_document_tab").data('info', uid);
    $("#search_generated_document_tab").data('info', uid);
    SearchGeneralInfoCall(uid);
});
//----------------Process map tab on click------------------
$process_map_tab.on('click', function (i, v) {
    let id = $(this).data('info');
    SearchProcessMapCall(id);
});
$uploaded_document_tab.on('click', function (i, v) {
    let id = $(this).data('info');
    SearchUploadedDocCall(id);
});
$generated_document_tab.on('click', function (i, v) {
    let id = $(this).data('info');
    SearchGeneratedDocCall(id)
});
//----------Quick View----------------
// $(document).on('click', '.search_list', function () {
//     let file = $(this).data('info');
//     console.log(file);
//     let iFrame = '<iframe id="docView" ' +
//         'data-printurl="' + api.pdf.view + api.url.base + file + '" ' +
//         'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
//         'allowfullscreen webkitallowfullscreen ' +
//         'src="' + api.pdf.view + api.url.base + file + '"></iframe>';
//     $('.modal-preview').html(iFrame);
//     $('#searchViewFile').modal().show();
// });
SaveSearch.name_search();
SaveSearch.save_search();
SaveSearch.saved_search();
SaveSearch.delete_save_search();
Operations.get_data();
$("#new_password").on('keydown', function () {
    $('#confirm_password').val('').parsley().reset();
});
$("#new_password").on('keyup', function () {
    if ($("#password").val() != "") {
        $('#confirm_password').attr('data-parsley-required', 'true');
    } else {
        $('#confirm_password').removeAttr('data-parsley-required');
    }
});
$(document).on('click', '.change_pass', function () {
    $("#old_password").val('').parsley().reset();
    $("#new_password").val('').parsley().reset();
    $("#confirm_password").val('').parsley().reset();
    $('#change_pass').modal();
    $('#password_save').on('click', function (e) {
        e.preventDefault();
        console.log("ok");
        var pass_form_parsley = $("#change_pass_form").parsley();
        pass_form_parsley.validate();
        if (!pass_form_parsley.isValid()) {
            return;
        }
        var $form = new FormData($('#change_pass_form')[0]);
        console.log($form);
        $.ajax({
            method: "PATCH",
            processData: false,
            contentType: false,
            cache: false,
            data: $form,
            url: '/api/v1/auth/change_password/',
            success: function (res) {
                console.log(res);
                $("#change_pass").modal('hide');
                notify('', 'Password changed successfully', '', 'success', 2000);
                setTimeout(function () {
                    location.reload();
                }, 2500);
            },
            error: function (res) {
                var errors = res.responseText;
                $.each(JSON.parse(errors), function (key, value) {
                    var nMessage = value;
                    notify('', nMessage, '', 'danger');
                });
            }

        })
    });
});