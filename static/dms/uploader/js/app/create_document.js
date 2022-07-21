{
    //generate document type dropDown list
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

                $('#DocumentType').append(html).selectpicker('refresh');
            });

        },
        error: function (response, jqXHR, textStatus, errorThrown) {
            console.log(response);
        }
    });
    //
    $(document).on('ready', function () {
        $('.document_editor').css('display', 'block');
        $('#add_meta_data').parsley();

        $('#created_date').val(moment().format('YYYY-MM-DD')).datetimepicker({
            maxDate: moment(),
            format: 'YYYY-MM-DD',
            useCurrent: false
        }).on('dp.show', function () {
            $('#created_date').data("DateTimePicker").maxDate(moment());
        }).on('dp.change', function (ev) {
            console.log('hide');
        });

        $('#expires_on').datetimepicker({
            //minDate: moment(),
            format: 'YYYY-MM-DD'
        }).on('dp.show', function () {
            $('#expires_on').data("DateTimePicker").minDate(moment());
        }).on('focus', function () {
            $(this).val('');

        });
    });
//tags field with select2
    $("#meta_tags").select2({
        tags: true,
        tokenSeparators: [',', ' ']
    });

    $('#action_upon_expire').on('change', function () {

        let selectedVal = $('#action_upon_expire option:selected').val();
        let $expires_on = $('#expires_on');

        if (selectedVal != 0) {
            $expires_on.attr('required', 'required');
        } else {
            $expires_on.removeAttr('required');
        }
    });

    let $metaGenWrap = $('.meta-data-wrap');

//Get meta Datas and show on change
    $('#DocumentType').on('change', function () {
        $('#add_meta_data').parsley();
        $metaGenWrap.empty();

        let selectedVal = $('#DocumentType option:selected').val();

        let template;
        //console.log(selectedVal);
        if (selectedVal != '') {
            $.ajax({
                url: '/api/v1/dms/categorization/metafield/?doc_id=' + selectedVal,
                method: 'GET',
                success: function (data) {
                    if (data.length > 0) {
                        console.log(data);
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
                                    template = doT.template($('#inputString').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 1:
                                    template = doT.template($('#inputInteger').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 2:
                                    template = doT.template($('#inputTextArea').html());
                                    $metaGenWrap.append(template(v));
                                    break;
                                case 3:
                                    template = doT.template($('#inputDropDown').html());

                                    let optionArr = v.default_text.split('\r\n');

                                    let options = '';
                                    $.each(optionArr, function (k, v) {
                                        options += '<option value="' + v + '">' + v + '</option>';
                                    });

                                    console.log(options);
                                    v.options = options;
                                    $metaGenWrap.append(template(v));
                                    $metaGenWrap.find('.selectpicker').selectpicker();
                                    break;
                                case 4:
                                    template = doT.template($('#inputDate').html());
                                    $metaGenWrap.append(template(v));
                                    $('.date-time-picker').datetimepicker({format: 'YYYY-MM-DD'});
                                    break;
                                case 5:
                                    template = doT.template($('#inputString').html());
                                    $metaGenWrap.append(template(v));
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

//Create Document submission
    $('#add_meta_data').on('submit.pong', function (e) {
        e.preventDefault();
        let meta_data_form = $(this).parsley();
        meta_data_form.validate();

        if (meta_data_form.isValid()) {
            let $creat_document = $('#document').val();
            let data = {document: $creat_document, meta_data: {}};
            //let $_meta_data_row = $('.meta-data-list-document-field tbody tr');

            /*if($creat_document == ""){

             }*/
            if ($($creat_document).text() != "") {
                /*$_meta_data_row.each(function (k, v) {
                 data.files.push($(v).data('pending-doc-id'));
                 });*/
                data.meta_data.uploader = $('#uploader').val();
                //data.meta_data.filename = $('#file_name').val();
                data.meta_data.created_date = $('#created_date').val();
                data.meta_data.expires_on = $('#expires_on').val();
                data.meta_data.action_upon_expire = $('#action_upon_expire').val();
                data.meta_data.tags = ($('#meta_tags').val() == null) ? '' : $('#meta_tags').val();
                data.meta_data.DocumentType = $('#DocumentType').val();
                data.meta_data.metas = {};
                data.meta_data.metas_json = {};

                let $all_meta_data_fields = $('.meta-data-wrap input,.meta-data-wrap select');
                if ($all_meta_data_fields.length > 0) {
                    $all_meta_data_fields.each(function () {
                        $all_meta_data_fields.serializeArray().map(function (x) {
                            data.meta_data.metas[x.name] = x.value;
                        })
                    })
                }
            }

            if ($($creat_document).text() == "") {
                notify('Please write Something!', '', '', 'danger', '5000');
                return;
            }
            /*if (!data.files.length > 0) {
             notify('No file added for metadata entry!', '', '', 'danger', '1000');
             return;
             }*/
            if ($('#DocumentType').val() == '') {
                notify('No document type selected!', '', '', 'danger', '5000');
                return;
            }

            data = JSON.stringify(data);
            console.log(data);
            $.ajax({
                url: '/api/v1/dms/documents/attachmeta/',
                method: 'POST',
                data: data,
                contentType: "application/json",
                success: function (res) {
                    $('.meta-data-list-head, .meta-data-list-document-field, #move_all_btn').hide();
                    $('.table-empty').show();
                    $('.meta-data-list-document-field tbody').empty();

                },
                error: function (err) {
                    console.log(err);
                }
            });

        } else {
            console.log('is not okay!');
        }
    });
//meta data form clear
    $('#add_meta_data').on('reset.pong', function () {
        location.reload();
        /*$('#DocumentType, #action_upon_expire').val('').selectpicker('refresh');
        $("#meta_tags").val('').trigger('change')
        $metaGenWrap.empty();
        $('#add_meta_data').parsley().destroy();
        $('#document').code('');
        $('#document').val('');*/
    });

}