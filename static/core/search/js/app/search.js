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
        $metaGenWrap = $('.meta-data-wrap'),
        $dmsSearch = $("#dms_search_form"),
        $workflowSearch = $("#workflow_search_form"),
        $file_number = $("#file_number"),
        $docid = $("#docid"),
        $docname = $("#docname"),
        $doccreated = $("#doccreated"),
        $docexpired = $("#docexpire"),
        $search_tags = $("#search_tags"),
        $documentType = $("#documentType"),
        $dms_reset_btn = $("#dms_reset_btn"),
        $workflow_reset_btn = $("#workflow_reset_btn"),
        $dms_normal_search = $("#dms_normal_search"),
        $workflow_normal_search = $("#workflow_normal_search");

    //--------Search onclick functions------------

    $search_text.on('click', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css('display', 'block');
    });

    $search_drop_icon.on('click', function () {
        $(".search-menu-normal").css("display", "none");
        $($dmsSearch).parsley().destroy();
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
    $(document).on('click', '#dms_reset_btn, #workflow_reset_btn', function (e) {
        e.preventDefault();
        $documentType.selectpicker('refresh');
        $documentType.selectpicker('val', 0);
        $($dmsSearch).trigger('reset');
        $($workflowSearch).trigger('reset');
        $('.fg-line.fg-toggled').removeClass('fg-toggled');
        $search_tags.val(null).trigger("change");
        $metaGenWrap.empty();
    });
    $(document).on('click', '.search-back', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css("display", "none");
        $("#header").removeClass("search-toggled");
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
        $metaGenWrap.empty();
    });

    $(document).on('click', '#main', function () {
        $search_menu.css("display", "none");
        $(".search-menu-normal").css("display", "none");
        $("#header").removeClass("search-toggled");
    });

    //------------------Select2-------------------------
    $search_tags.select2({
        tags: true,
        tokenSeparators: [',', ' ']
    });

    //--------Select Search on click event--------------
    $select_search.on('change', function () {
        if (this.value == 1) {
            $workflowSearch.css('display', 'none');
            $dmsSearch.css('display', 'block');
        } else {
            $workflowSearch.css('display', 'block');
            $dmsSearch.css('display', 'none');
        }
    });

    //---------------Disable Search button-----------------------
    $doccreated.keyup(function () {
        if (this.value != '') {
            $("#search_btn").removeAttr('disabled');
        } else {
            $("#search_btn").attr('disabled', 'disabled');
        }
    });

    // $('#file_number, #docid, #docname, #search_tags, #documentType').bind('keyup change', function () {
    //     let allEmpty = true;
    //
    //     if ($(this).val() != '') {
    //         $("#search_btn").removeAttr('disabled');
    //     } else {
    //         $("#search_btn").attr('disabled', 'disabled');
    //     }
    // });

    let allEmpty = true;
    $('#file_number, #docid, #docname, #search_tags, #documentType').each(function (k,v) {
        let $this = $(v);
        $this.on('change', function (e) {
            if($this.length > 0){
                allEmpty = false;
            }
        });

    });
    console.log(allEmpty);

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

                                    let optionArr = v.default_text.split('\r\n');

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
                                    $('.date-time-picker').datetimepicker({format: 'DD/MM/YYYY'});
                                    console.log('Date');
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

    //-----------------DMS-post-----------------
    let dms_process_form = $dmsSearch.parsley();
    $('#search_btn').on('click', (e) => {
        e.preventDefault();
        dms_process_form.validate();
        if (dms_process_form.isValid()) {
            let data = {};
            data.metas = {};
            data.file_number = $('#file_number').val();
            data.docid = $('#docid').val();
            data.docname = $('#docname').val();
            data.doccreated = $('#doccreated').val();
            data.docexpire = $('#docexpire').val();
            data.match = $("#match_all").prop("checked");
            data.archived = $("#include_archive").prop("checked");
            data.tags = $('#search_tags').val();
            data.documentType = $('#documentType').val();
            let $all_meta_data_fields = $('.meta-data-wrap input,.meta-data-wrap select');
            if ($all_meta_data_fields.length > 0) {
                $all_meta_data_fields.each(function () {
                    $all_meta_data_fields.serializeArray().map(function (x) {
                        data.metas[x.name] = x.value;
                    })
                })
            }
            /*data = JSON.stringify(data);
             console.log(data);*/
            $.ajax({
                url: "",
                method: 'POST',
                data: JSON.stringify(data),
                processData: false,
                headers: {
                    "content-type": "application/json",
                },
                success: (data) => {
                    console.log(data);
                    $dmsSearch.trigger('reset');
                    window.location.href = "#"
                },
                error: (res) => {
                    /*$.each(JSON.parse(res.responseText), (k, v) => {
                     notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger');
                     });*/
                }
            });
        }
    });

    //------------------Workflow-post----------------
    let workflow_process_form = $workflowSearch.parsley();
    $('#workflow_search_btn').on('click', (e) => {
        e.preventDefault();

        workflow_process_form.validate();

        if (workflow_process_form.isValid()) {
            $.ajax({
                url: "#",
                method: 'POST',
                data: $workflowSearch.serialize(),
                success: (data) => {
                    console.log(data);
                    $workflowSearch.trigger('reset');
                    window.location = location.host + "/search";
                },
                error: (res) => {
                    /*$.each(JSON.parse(res.responseText), (k, v) => {
                     notify(`<strong>${k.substr(0, 1).toUpperCase() + k.substr(1) }:</strong> `, `<i>${v}</i>`, '', 'danger');
                     });*/
                }
            });
        }
    });


    //-------------DMS-Normal-search------------

    $dms_normal_search.on('click', function (e) {
        e.preventDefault();
        let kWard = $search_text.val();
        console.log(kWard);
        $.ajax({
            url: "",
            method: 'POST',
            data: JSON.stringify(kWard),
            processData: false,
            /*headers: {
             "content-type": "application/json",
             },*/
            success: function (res) {
                console.log(res);
            }
        });
    });

    //------------Workflow-Normal-Search--------------

    $workflow_normal_search.on('click', function (e) {
        e.preventDefault();
        let kWard = $search_text.val();
        console.log(kWard);
        $.ajax({
            url: "",
            method: 'POST',
            data: JSON.stringify(kWard),
            processData: false,
            /*headers: {
             "content-type": "application/json",
             },*/
            success: function (res) {
                console.log(res);
            }
        });
    });
}