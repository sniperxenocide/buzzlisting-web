/**
 * Created by mamun on 2/20/17.
 */
var Document = (function () {
    let number_files = $('#number_files').val();
    let file_list = $('#file_list').val();
    let self = {};
    let $document;
    let noOfComment = 0;
    let $linkFileIds = [];
    var $inputs = [];
    var checked = [];
    var excel_doctype;
    let $lastVersion;
    let $categories;
    let $metafield;
    let $dataType = ['String', 'Integer', 'TextArea', 'DropDown', 'Date', 'Float']
    var pdf_function = 'annotation'
    self.init = function () {
        self.current();
        buttonClick();
        href();
        $('.date-picker').datetimepicker({
            format: 'YYYY-MM-DD'
        });
        $('select').on('changed.bs.select', function (e) {
            var action = $(this).data('type');
            var val = $(this).val();
            if ($.isFunction(self[action])) {
                self[action](e, val);
            }
        });
    };
    self.current = function () {
        HttpClient.reset();
        HttpClient.url = api.document.detail;
        HttpClient.inputs = {'doc_id': api.document.id};
        var result = HttpClient.call();
        result.success(function (res) {
            if (res.length > 0) {
                excel_doctype = res[0].doc_type;
                $document = res[0];
                if ($document.filepath.endsWith('.pdf') === true) {
                    $('.watermark_display').show();
                    $('.annotation_display').show();
                    $('.redaction_display').show();
                }
                $lastVersion = $document.version;
                let blockHeader = doT.template($('#block-header').html());
                $('.block-header').html(blockHeader($document));
                let metadata = doT.template($('#metadata').html());
                let metaTags = {};
                metaTags.metas = $.parseJSON($document.metadata);
                metaTags.tags = JSON.parse($document.tags);
                $('#metaData').html(metadata(metaTags));
                $('.media-body h2').children('small').text('Created on ' + Helper.utcToLocal($document.uploaded_at, 'Do MMMM YYYY') + ' at ' + Helper.utcToLocal($document.uploaded_at, 'hh:ss a'));
                //let fileUrl = api.pdf.view+api.url.base+'/'+api.pdf.read+document.id+'/';
                let li = $('.doc-action').children('li');
                if ($document.locked) {
                    if (checkout_permission < 0) {
                        disableAction(li);
                    } else {
                        var html = '<a role="menuitem" tabindex="-1" href="#" data-action="cancelCheckOut">' + '<i class="zmdi zmdi-close-circle-o"></i>' + "Cancel Check Out" + '</a>';
                        $("#checkout").empty().append(html);
                    }
                }
                // if ($document.archived) {
                //     $.each(li, function (key, val) {
                //         var action = $(val).children('a').data('action');
                //         //console.log(action);
                //         switch (action) {
                //             case 'achive':
                //                 console.log("ra", $(val));
                //                 $(val).remove();
                //                 break;
                //         }
                //         ;
                //     })
                // }
                if ($document.watermark !== '0') {
                    viewDocument('.wi-preview', $document.watermark_file_path);
                } else {
                    viewDocument('.wi-preview', $document.filepath);
                }

                // relatedFile();
                // versions();
                user($document.uploader);
                categories();
                metafield($document.doc_type);
                comments($document.id);
            }
            else {
                window.close();
                // setTimeout(function () {
                //     window.location = "/dms/document/explorer/";
                // }, 1000);
            }
        });
    };
    self.submitComment = function ($that) {
        var $comment = $('textarea#comment');
        $comment.parsley().validate();
        if ($comment.parsley().isValid()) {
            var result = saveComment($comment, $(document).find('#submit_comment').attr('data-file'));
            if (typeof result !== 'undefined') {
                result.success(function (comments) {
                    noOfComment++;
                    $('.block-header').children('h2').children('small').children('strong').first().children('span').text(noOfComment);
                    let html = doT.template($('#comments').html());
                    $('.wi-comments > .list-group').append(html([comments]));
                    $('textarea#comment').val('');
                    $('textarea#comment').parsley().reset();
                    $('textarea#comment').parsley().destroy();
                });
            }
        }
    };
    $('#addRelated').on('hidden.bs.modal', function () {
        location.reload();
    });
    self.version = function () {
        var majorVersion = (Math.round($lastVersion) + 1.00);
        var minorVersion = Math.round($lastVersion) + 0.01;
        let versionSelect = $('select#version');
        let options = '<option value="' + majorVersion.toFixed(2) + '">Major ' + majorVersion.toFixed(2) + '</option>';
        options += '<option value="' + minorVersion.toFixed(2) + '">Minor ' + minorVersion.toFixed(2) + '</option>';
        versionSelect.find('option').remove().end().append(options);
        versionSelect.selectpicker('refresh');
        $('#addVersion').modal('show');
        //$('#uploadVersion')[0].reset();
        $('#uploadVersion').parsley().reset();
    };
    // self.related = function () {
    //     var result = userDocuments(api.user.loggedIn);
    //     result.success(function (res) {
    //         let $select = $('select#documents');
    //         $select.find('option').remove().end();
    //         $.each(res, function (key, doc) {
    //             if ($.inArray(doc.id, $linkFileIds) === -1) {
    //                 $select.append($('<option>', {value: doc.id, text: doc.filename}));
    //             }
    //         });
    //         $select.selectpicker('refresh');
    //
    //         console.log(res);
    //     });
    //     $('#addRelated').modal('show');
    // };
    self.related = function () {
        $inputs = [];
        var param = {
            'start': 0,
            'length': 5,
            'draw': 1
        };
        // var result = userDocuments(api.user.loggedIn);
        // result.success(function (res) {
        //     $('#linked_file_content').empty();
        //     let html = "";
        //     $.each(res.data, function (k, v) {
        //         if ($.inArray(v.id, $linkFileIds) === -1) {
        //             template = doT.template($('#linked_list').html());
        //             $('#linked_file_content').append(template(v));
        //         }
        //     });
        // });
        $.ajax({
            url: '/api/v1/dms/documents/related/?user=' + userId + '&docid=' + $document.id,
            method: 'GET',
            data: param,
            success: (res) => {
                $('#linked_file_content').empty();
                // $("input:checkbox[name=type]").change(function () {
                $inputs = [];
                var checked = [];
                $(document).on('change', 'input:checkbox[name=type]', function () {
                    if ($(this).is(":checked")) {
                        var linkfile = {};
                        linkfile.name = 'linkfile';
                        linkfile.value = $(this).data('id');
                        $inputs.push(linkfile);
                        checked.push($(this).data('id'));
                    } else {
                        for (var i = 0; i < $inputs.length; i++) {
                            if ($inputs[i].value == $(this).data('id')) {
                                $inputs.splice(i, 1);
                                break;
                            }
                        }
                        for (var j = 0; j < checked.length; j++) {
                            if (checked[i] == $(this).data('id')) {
                                checked.splice(i, 1);
                            }
                        }
                    }
                });
                let $pagination = $('#linkedfile_pagination');
                let html = "";
                if (res.recordsTotal > 0) {
                    $.each(res.data, function (k, v) {
                        if ($.inArray(v.id, $linkFileIds) === -1) {
                            template = doT.template($('#linked_list').html());
                            $('#linked_file_content').append(template(v));
                        }
                    });
                } else {
                    html = '<div class="card">' + '<div class="card-header ch-alt text-center">' + '<h3>No File Left to Link</h3>' + '</div>' + '</div>';
                    $('#linked_file_content').html(html);
                    $('#addRelated').modal('show');
                }

                let totalPages = Math.ceil(res.recordsTotal / 5);
                let currentPage = $pagination.twbsPagination('getCurrentPage');
                $pagination.twbsPagination('destroy');
                if (totalPages > 0) {
                    $pagination.twbsPagination($.extend({}, {
                        startPage: currentPage,
                        totalPages: totalPages,
                        first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                        prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                        next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                        last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                        initiateStartPageClick: false,
                        onPageClick: function (event, page) {
                            param.start = (page - 1) * 5;
                            param.length = 5;
                            param.draw = 1;
                            $.ajax({
                                url: '/api/v1/dms/documents/related/?user=' + userId + '&docid=' + $document.id,
                                method: 'GET',
                                data: param,
                                headers: {
                                    "content-type": "application/json",
                                },
                                success: function (res) {
                                    $('#linked_file_content').empty();
                                    let html = "";
                                    $.each(res.data, function (k, v) {
                                        if ($.inArray(v.id, $linkFileIds) === -1) {
                                            template = doT.template($('#linked_list').html());
                                            $('#linked_file_content').append(template(v));
                                        }
                                    });

                                    $("input:checkbox[name=type]").each(function () {
                                        for (var i = 0; i < checked.length; i++) {
                                            if (checked[i] == $(this).data('id')) {
                                                $(this).prop('checked', true);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }));
                }
            }
        });
        $('#addRelated').modal('show');
    };

    self.uploadVersion = function () {
        saveVersion();
    };
    self.addLinkedFile = function () {
        // var $inputs = [];
        var sourcefile = {};
        // $("input:checkbox[name=type]:checked").each(function () {
        //     var linkfile = {};
        //     linkfile.name = 'linkfile';
        //     linkfile.value = $(this).data('id');
        //     $inputs.push(linkfile);
        // });
        sourcefile.name = 'sourcefile';
        sourcefile.value = api.document.id;
        $inputs.push(sourcefile);
        var params = {};
        params.doc_id = api.document.id;
        HttpClient.url = buildUrl(api.document.related, params);
        HttpClient.inputs = $inputs;
        HttpClient.method = 'POST';
        var result = HttpClient.call();
        result.success(function (response) {
            $linkFileIds.push(response.linkfile);
            relatedFile();
            $('#addRelated').modal('hide');
            setTimeout(function () {
                location.reload();
            }, 1000);
            notify('', 'File Linked successfully', '', 'success', 3000);

        });

    };
    // self.addLinkedFile = function () {
    //     var $from = $('#addRelated').find('form');
    //     $from.parsley().validate();
    //     if ($from.parsley().isValid()) {
    //         var $inputs = $from.serializeArray();
    //         var sourcefile = {};
    //         sourcefile.name = 'sourcefile';
    //         sourcefile.value = api.document.id;
    //         $inputs.push(sourcefile);
    //         var params = {};
    //         params.doc_id = api.document.id;
    //         HttpClient.url = buildUrl(api.document.related, params);
    //         HttpClient.inputs = $inputs;
    //         HttpClient.method = 'POST';
    //         var result = HttpClient.call();
    //         console.log("inputs", $inputs);
    //         result.success(function (response) {
    //             console.log("res", response);
    //             return;
    //             $from[0].reset();
    //             $from.parsley().reset();
    //             $linkFileIds.push(response.linkfile);
    //             relatedFile();
    //             $('#addRelated').modal('hide');
    //         });
    //     }
    // };
    self.viewPreview = function ($that) {
        var file = $that.data('file');
        let doc_id = $that.data('doc-id');
        if (file.endsWith('.doc') || file.endsWith('.docx')) {
            $('.ver-modal-preview').css('display', 'none');
            $('#ver_pagination').css('display', 'none');
            file = file.substr(0, file.lastIndexOf(".")) + ".pdf";
        }
        if (file.endsWith('.xls')) {
            $('.ver-modal-preview').css('display', 'block');
            $('#ver_pagination').css('display', 'block');
            $('.modal-preview').css('display', 'none');
            $.ajax({
                url: '/api/v1/dms/documents/version_preview/?doc_id=' + doc_id,
                method: 'GET',
                success: function (res) {
                    let filePath = res.filepath,
                        number_files = res.number_files;
                    VerCsvToHtml('.ver-modal-preview', filePath, number_files);
                }
            });
        } else if (file.endsWith('.xlsx')) {
            $('.ver-modal-preview').css('display', 'block');
            $('.modal-preview').css('display', 'none');
            $('#ver_pagination').css('display', 'block');
            $.ajax({
                url: '/api/v1/dms/documents/version_preview/?doc_id=' + doc_id,
                method: 'GET',
                success: function (res) {
                    let filePath = res.filepath,
                        number_files = res.number_files;
                    VerCsvToHtml('.ver-modal-preview', filePath, number_files);
                }
            });
        } else {
            $('.ver-modal-preview').css('display', 'none');
            $('#ver_pagination').css('display', 'none');
            let iFrame = '<iframe id="docView" ' +
                'data-printurl="' + api.pdf.view + api.url.base + file + '" ' +
                'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
                'allowfullscreen webkitallowfullscreen ' +
                'src="' + api.pdf.view + api.url.base + file + '"></iframe>';
            $('.modal-preview').css('display', 'block');
            $('.modal-preview').html(iFrame);
        }
        $('#viewFile').modal('show');
    };

    function versionComment(versionId) {
        $.ajax({
            url: '/api/v1/dms/documents/comments/?doc_id=' + versionId,
            method: 'GET',
            success: function (res) {
                noOfComment = res.length;
                $('.doc_comment_count').text(noOfComment);
                if (res.length > 0) {
                    let html = doT.template($('#comments').html());
                    $('.wi-comments > .list-group').html(html(res));
                }
            }
        });
    }

    self.versionView = function ($that) {
        var file = $that.data('file');
        $('#preview_without_pdfjs').css('display', 'block');
        $('#will_show_annotate').css('display', 'none');
        if(latest_version_id == $that.data('id')){
            $('.watermark_display').css('display', 'block');
            $('.annotation_display').css('display', 'block');
            $('.redaction_display').css('display', 'block');
        }else{
            $('.watermark_display').css('display', 'none');
            $('.annotation_display').css('display', 'none');
            $('.redaction_display').css('display', 'none');
        }
        viewDocument('.wi-preview', file);
        $('.doc_version_no').text($that.data('v'));
        var filepath = api.url.base + '/media/' + file;
        if (file.endsWith('.xls')) {
            var xl_filePath = file,
                filepath = api.url.base + '/media/' + xl_filePath.substr(0, xl_filePath.lastIndexOf(".")) + ".csv";
        } else if (file.endsWith('.xlsx')) {
            var xl_filePath = file,
                page_ext = "_x_p_c";
            var folder = file.substring(file.lastIndexOf("/") + 1);
            filepath = api.url.base + '/media/' + xl_filePath.replace('/tempfiles', '').replace('.xlsx', '') + "/" + folder.split(' ').join('_');
        }
        $('#v_download').attr('data-v_id', $that.data('id'));
        $('#v_delete').attr('data-v', $that.data('v'));
        $('#v_delete').attr('data-v_id', $that.data('id'));
        $('#file_view_link').attr('data-filepath', filepath);
        $('#submit_comment').attr('data-file', $that.data('id'));
        $('.comment_list').empty();
        versionComment($that.data('id'));
    };
    self.editMeta = function ($that) {
        var modal = $('#editMeta').modal({
            keyboard: true,
            backdrop: true,
            show: true
        });
        $.each($document, function (k, v) {
            switch (k) {
                case 'filename':
                    modal.find('#filename').val(v);
                    break;
                case 'creation_date':
                    modal.find('input#creation_date').val(v);
                    $('input#creation_date').data("DateTimePicker").maxDate(moment());
                    break;
                case 'box_number':
                    modal.find('input#edit_box_number').val(v);
                    break;
                case 'shelf_number':
                    modal.find('input#edit_shelf_number').val(v);
                    break;
                case 'expiry_date':
                    if (v == null) {
                        modal.find('input#expiry_date').val('');
                    }
                    modal.find('input#expiry_date').val(v).datetimepicker({
                        format: 'YYYY-MM-DD',
                        minDate: moment(),
                        useCurrent: false
                    });

                    // $('input#expiry_date').data("DateTimePicker").value("");
                    break;
                case 'action_upon_expiry':
                    modal.find('#action_upon_expire').selectpicker('val', v);
                    modal.find('#action_upon_expire').selectpicker('render');
                    break;
                case 'tags':
                    var tags = $.parseJSON(v);
                    var select = modal.find('select#meta_tags');
                    select.empty();
                    $.each(tags, function (t, tag) {
                        select.append($("<option>", {value: tag, html: tag, selected: true}));
                    });
                    select.select2({
                        tags: true,
                        tokenSeparators: [',', ' ']
                    });
                    break;
                case 'metadata':
                    var mData = $.parseJSON(v);
                    var $metaGenWrap = $('.meta-data-gen-wrap');
                    $metaGenWrap.empty();
                    $.each($metafield, function (k, v) {
                        // v.value = mData[v.title] || v.default_text;
                        v.value = "";
                        $.each(mData, function (index, value) {
                            if (v.title == value.name) {
                                if (value.value != "") {
                                    v.value = value.value;
                                } else {
                                    v.value = value.displayname;
                                }
                            }
                        });
                        var type = ($dataType[v.data_type]).toLowerCase();
                        var field = doT.template($('#' + type).html());
                        switch (type) {
                            case 'date':
                                $metaGenWrap.append(field(v));
                                $('.date-picker').datetimepicker({
                                    format: 'YYYY-MM-DD'
                                });
                                break;
                            case 'dropdown':
                                v.options = v.default_text.split("\n");
                                $metaGenWrap.append(field(v));
                                $('.selectpicker').selectpicker();
                                break;
                            default:
                                $metaGenWrap.append(field(v));
                        }
                    });
                    break;
                case 'doc_type':
                    var doc_types = docType($categories);
                    var select = modal.find('select#doc_type');
                    select.empty();
                    $.each(doc_types, function (t, type) {
                        if (typeof type != 'undefined') {
                            select.append($("<option>", {value: t, html: type}));
                        }
                    });
                    select.selectpicker('val', v);
                    select.selectpicker('render');
                    select.selectpicker('refresh');
                    break;
            }
        });
    };
    self.sendForReview = function ($that) {
        //console.log('sendForReview: ', $that);
    };
    self.checkOut = function ($that) {
        swal({
            title: "Are you sure?",
            text: "Want to check out!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
        }).then(function (isConfirm) {
            if (isConfirm) {
                var result = checkoutDoc();
                result.success(function (response) {
                    notify('', 'Document checkout successfully', '', 'success', 3000)
                    let li = $that.parentsUntil('li.dropdown', 'ul').children('li');
                    // disableAction(li);
                    setTimeout(function () {
                        location.reload();
                    }, 3000);
                });
            }
        });
    };

    self.annotation = function ($that) {
        var url = ($that).attr('data-filepath')
        pdf_function = 'annotation'
        viewDocument('.pdfViewer', url);
    };
    self.redaction = function ($that) {
        var url = ($that).attr('data-filepath')
        pdf_function = 'redaction'
        viewDocument('.pdfViewer', url);
    };
    self.selectUser = function () {
        let get_viewers_info = api.url.base+api.document.document_viewer;
        $.ajax({
            type: 'GET',
            url: get_viewers_info,
            success: function (res) {
                $("#document_viewer_select").empty()
                $.each(res.users, function (i, d) {
                    $("#document_viewer_select").append($('<option>', {
                        value: d.id,
                        text: d.name,
                    }));
                });
                $("#document_viewer_select").selectpicker('refresh');
                $('#document_viewer_select').selectpicker('val',res.users[0].id);
                $('#document_viewer').modal().show();

            }
        });
    };
    $('#save_viewers').on('click', (e) => {
        console.log("clicked save", $('#document_viewer_select').val(), api.document.id)
        var data = {'redacted_user':''};
        data['redacted_user'] = $('#document_viewer_select').val()
        data = JSON.stringify(data);
        console.log("Clicked data", data, api.url.base+api.document.redacted_user)
        $.ajax({
            url: api.url.base+api.document.redacted_user,
            method: 'POST',
            data: data,
            contentType: "application/json",
            success: function (res) {
                console.log('success', res)
                $('#document_viewer').modal('hide');
                },
            error: function (err) {
                console.log("failure", err);
                $('#document_viewer').modal('hide');
            }
        });
            /*let doc_id = $(this).data('self');
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
            });*/
    });
    /*self.setRedaction = function () {
        console.log("setRedaction")
        let media = api.url.base + api.url.media + $document.filepath
        var redaction = localStorage.getItem(media + '/text/size')
        console.log("redaction", redaction, media)
    };*/
    self.showPage = function () {
        console.log("page number")
        /*var filepath = api.url.base + api.url.media + $document.filepath
        var _2 = _interopRequireDefault(_);
        var UI = _2.default.UI;
        var RENDER_OPTIONS = {
            documentId: filepath,
            pdfDocument: null,
            scale: parseFloat(localStorage.getItem(filepath + '/scale'), 10) || 1.18,
            rotate: parseInt(localStorage.getItem(filepath + '/rotate'), 10) || 0
        };
        UI.renderPage(10, RENDER_OPTIONS);*/
    }

    self.saveAnnotation = function () {
        var url = ""
        var information = ""
        var filepath = api.url.base + api.url.media + $document.filepath
        console.log('filepath', filepath)
        if(pdf_function == 'annotation'){
            url = api.url.base+api.document.save_annotation_redaction+"/annotation"
            information = JSON.parse(localStorage.getItem(filepath + '/annotations')) || [];
        }
        else{
            url = api.url.base+api.document.save_annotation_redaction+"/redaction"
            information = JSON.parse(localStorage.getItem(filepath + '/redactions')) || [];
        }
        console.log("IMPORTNAT", information)
        var data = {'information':''};
        data['information'] = information
        data = JSON.stringify(data);
        console.log("Clicked url",url)
        $.ajax({
            url: url,
            method: 'POST',
            data: data,
            contentType: "application/json",
            success: function (res) {
                console.log('success', res)
                //$('#document_viewer').modal('hide');
                },
            error: function (err) {
                console.log("failure", err);
                //$('#document_viewer').modal('hide');
            }
        });
    };
    /*Private mathod*/
    /*var setAnnotation = function (id) {
        let media = $document.filepath.split("workflow");
        let documentId = api.url.base + media[1];
        console.log("media document", media, documentId, id)
        var annotation = localStorage.getItem(id + '/annotations');
        console.log("annotation", annotation)
        HttpClient.reset();
        HttpClient.url = buildUrl(api.document.annotation, {doc_id: id});
        var result = HttpClient.call();
        result.success(function (res) {
            if (res.length > 0) {
                localStorage.removeItem(documentId + '/annotations');
                localStorage.setItem(documentId + '/annotations',res[0].annotation)
                $.getScript(api.pdf.js, function (data, textStatus, jqxhr) {});
                });
            }
        });
    };*/
    self.cancelCheckOut = function ($that) {
        swal({
            title: "Are you sure?",
            text: "Want to cancel check out!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
        }).then(function (isConfirm) {
            if (isConfirm) {
                var result = checkinDoc();
                result.success(function (response) {
                    notify('', 'Checkout cancel successfully', '', 'success', 3000)
                    let li = $that.parentsUntil('li.dropdown', 'ul').children('li');
                    enableAction(li);
                    setTimeout(function () {
                        location.reload();
                    }, 3000);
                });
            }
        });
    };
    self.download = function ($that) {
        let version = $that.data('v_id');
        window.location = api.url.base + api.document.download + $document.id + '/?operation=download';
        if (version) {
            window.location = api.url.base + api.document.download + version + '/?operation=download';
        }
    };
    jQuery.fn.extend({
        printElem: function () {
            var cloned = this.clone();
            var printSection = $('#printSection');
            if (printSection.length == 0) {
                printSection = $('<div id="printSection"></div>')
                $('body').append(printSection);
            }
            printSection.append(cloned);
            var toggleBody = $('body *:visible');
            toggleBody.hide();
            $('#printSection, #printSection *').show();
            window.print();
            printSection.remove();
            toggleBody.show();
        }
    });
    self.print = function ($that) {
        let media = $document.filepath.split("/workflow");
        let fileUrl = api.pdf.view + api.url.base + media[1];
        console.log(media[0]);
        if (media[0] != null) {
            if (media[0].endsWith('.xlsx')) {
                console.log("ok");
                $('.wi-preview').printElem();
            }
            else {
                window.frames['docView'].focus();
                window.frames['docView'].print();
            }
        }

        return false;
    };
    self.delete = function ($that) {
        let version = $that.data('v_id');
        if ($that.data('v') == "1" || $that.data('v') == "1.0") {
            swal({
                title: "Are you sure?",
                text: "<b>All versions of this file including version 1.0 will be deleted.</b>",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete!",
                cancelButtonText: "No, cancel!",
            }).then(function (isConfirm) {
                if (isConfirm) {
                    var result = deleteDoc(version);
                    result.success(function (response) {
                        notify('', 'Document Delete successfully', '', 'success', 3000);
                        self.current();

                        // version delete check parent
                        if ($that.data('v') == "1") {
                            window.close();
                        }
                        // setTimeout(function () {openInNew
                        //     window.location = "/dms/document/workspace/";
                        // }, 2000);
                    });
                }
            });
        } else {
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this file!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete!",
                cancelButtonText: "No, cancel!",
            }).then(function (isConfirm) {
                if (isConfirm) {
                    var result = deleteDoc(version);
                    result.success(function (response) {
                        notify('', 'Document Delete successfully', '', 'success', 3000);
                        self.current();

                        // version delete check parent

                        setTimeout(function () {
                            location.reload();
                        }, 3000);
                    });
                }
            });
        }

    };
    self.achive = function ($that) {
        swal({
            title: "Are you sure?",
            text: "Want to archive this!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, archive!",
            cancelButtonText: "No, cancel!",
        }).then(function (isConfirm) {
            if (isConfirm) {
                var result = archiveDoc();
                result.success(function (response) {
                    notify('', 'Document archive successfully', '', 'success', 3000);
                    // self.current();
                    setTimeout(function () {
                        location.reload();
                    }, 3000);
                });
            }
        });
    };
    // $(document).on('click', '#print', function (e) {
    //     var params = {};
    //     params.doc_id = $document.id;
    //     HttpClient.url = api.document.restoreArchive + $document.id + '/?operation=print';
    //     HttpClient.method = 'GET';
    //     return HttpClient.call();
    // });
    $(document).on('click', '#restore_archive', function (e) {
        swal({
            title: "Are you sure?",
            text: "This File may have versions!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete!",
            cancelButtonText: "No, cancel!",
        }).then(function (isConfirm) {
            if (isConfirm) {
                var result = restoreArchive();
                result.success(function (response) {
                    notify('', 'Document Restored from Archive successfully', '', 'success', 3000);
                    setTimeout(function () {
                        location.reload();
                    }, 3000);
                });
            }
        });
    });
    self.updateMeta = function () {
        //var result = updateMeta();
        var $from = $('#editMeta').find('form');
        $from.parsley().validate();
        if ($from.parsley().isValid()) {
            var $status = 0;
            var $uniqueElement = $('.meta-data-gen-wrap').find('input[data-parsley-unique_meta=unique], textarea[data-parsley-unique_meta=unique], select[data-parsley-unique_meta=unique]');
            $.each($uniqueElement, function (k, v) {
                var $name = $(v).attr('name'),
                    $value = $(v).val(),
                    $doc_id = $('#doc_type').find("option:selected").val();
                var $label = $(v).closest('.form-group').find('label').text();
                if ($value != '') {
                    $.ajax({
                        url: '/api/v1/dms/categorization/unique_metafield/?doc_id=' + $doc_id + '&unique_id=' + $name + '&value=' + $value + '&ind_doc=' + $document.id,
                        method: 'GET',
                        success: function (data) {
                            if (data.exists != 'N') {
                                notify('', $label + ' value already exists', '', 'danger', '6000');
                                $status = $status + 1;
                            }
                        },
                        error: function (response, jqXHR, textStatus, errorThrown) {
                        }
                    });
                }
            });

            setTimeout(function () {
                if ($status == 0) {
                    var inputs = {};
                    var tmp = $from.find('#doc_data input, #doc_data select').serializeArray();
                    $.each(tmp, function (key, val) {
                        inputs[val.name] = val.value;
                    });
                    inputs.tags = $('#meta_tags').val();
                    inputs.box_number = $('#edit_box_number').val();
                    inputs.shelf_number = $('#edit_shelf_number').val();
                    // var tmpMeta = $from.find('.meta-data-gen-wrap input, .meta-data-gen-wrap select, .meta-data-gen-wrap textarea').serializeArray();
                    // console.log(tmpMeta);
                    // inputs.meta_data = {};
                    // $.each(tmpMeta, function (k, v) {
                    //     inputs.meta_data[v.name] = v.value;
                    // });
                    inputs.meta_data = [];
                    $.each($('.meta-data-gen-wrap .fg-line'), function (k, v) {
                        var $this = $(v);
                        var obj = {};
                        var input = $this.find('input');
                        var textarea = $this.find('textarea');
                        var select = $this.find('select');
                        if (input.length > 0) {
                            obj['name'] = input.attr('name');
                            obj['value'] = input.val();
                            obj['displayname'] = input.data('displayname');
                        }
                        if (select.length > 0) {
                            obj['name'] = select.attr('name');
                            obj['value'] = select.val();
                            obj['displayname'] = select.data('displayname');
                        }
                        if (textarea.length > 0) {
                            obj['name'] = textarea.attr('name');
                            obj['value'] = textarea.val();
                            obj['displayname'] = textarea.data('displayname');
                        }
                        inputs.meta_data.push(obj);
                    });
                    HttpClient.url = api.document.updatemeta + $document.id + '/';
                    HttpClient.method = 'PUT';
                    HttpClient.setContentType('application/json');
                    HttpClient.inputs = JSON.stringify(inputs);
                    var result = HttpClient.call();
                    result.success(function (response) {
                        notify('', 'update successfully', '', 'success', 2000);
                        HttpClient.reset();
                        self.current();
                        $('#editMeta').modal('hide');
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        notify('', errorThrown, '', 'danger', 2000);
                    });
                }
            }, 500);

        }
    };
    self.docType = function (e, doc_type) {
        var result = metafield(doc_type);
        result.success(function (res) {
            bulidMeta(res);
        });
    };

    /*Private mathod*/
    var enableAction = function (li) {
        $.each(li, function (key, val) {
            let aTag = $(val).children('a');
            let action = aTag.data('action');
            switch (action) {
                case 'cancelCheckOut':
                    aTag.data('action', 'checkOut');
                    aTag.html('<i class="zmdi zmdi-badge-check"></i> Check Out')
                    break;
                case 'sendForReview':
                    break;
                default:
                    aTag.removeClass('not-allowed')
            }
        })
    };
    var disableAction = function (li) {
        $.each(li, function (key, val) {
            let aTag = $(val).children('a');
            let action = aTag.data('action');
            switch (action) {
                case 'checkOut':
                    aTag.data('action', 'cancelCheckOut');
                    aTag.html('<i class="zmdi zmdi-close-circle-o"></i> Cancel Check Out');
                    if (api.user.role != 1) {
                        if (api.user.loggedIn !== $document.locked_by.id) {
                            aTag.addClass('not-allowed');
                        }
                    }
                    break;
                case 'sendForReview':
                    break;
                default:
                    aTag.addClass('not-allowed');
            }
        });
    };
    var csv_gen = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {
            console.log(fp);
            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr("class","csv_table")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr("class","csv_td")
                .text(function (d) {
                    return d;
                });
        });
    };
    var csv_gen2 = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {
            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr("class","csv_table")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr("class","csv_td")
                .text(function (d) {
                    return d;
                });
        });
    };
    var csvToHtml = function ($selector, $file_path) {
        var filePath = $file_path,
            page_ext = "_x_p_c";
        var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
        if (filePath.endsWith('.xls')) {
            filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
            $('.wi-preview').empty();
            csv_gen($selector, filePath);
        } else if (filePath.endsWith('.xlsx')) {
            filePath = filePath.replace('/tempfiles', '').replace('.xlsx', '') + "/" + folder.split(' ').join('_').replace('.xlsx', '') + page_ext + "1.csv";
            $('.wi-preview').empty();
            csv_gen($selector, filePath);
            // filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
        }
        $('#doc_pagination').twbsPagination({
            totalPages: number_files,
            visiblePages: 7,
            first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
            prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
            next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
            last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
            initiateStartPageClick: false,
            onPageClick: function (event, page) {
                var fp = $file_path.replace('/tempfiles', '') + "/";
                var f_path = fp.replace('.xlsx', '') + folder.replace('.xlsx', '').split(' ').join('_') + page_ext + page + ".csv";
                $('.wi-preview').empty();
                csv_gen2($selector, f_path);
            }
        });
        //'/media/repository/2017-07-31/556b10fc422946517bb6b889cefcfd8d.csv'
    };
    var VerCsvToHtml = function ($selector, $file_path, $number_files) {
        var filePath = $file_path,
            page_ext = "_x_p_c";
        var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
        $('#ver_pagination').css('display', 'block');
        if (filePath.endsWith('.xls')) {
            filePath = filePath.replace('/tempfiles', '').replace('.xls', '') + "/" + folder.replace('.xls', '').split(' ').join('_') + page_ext + "1.csv";
            $('.ver-modal-preview').empty();
            ver_csv_gen($selector, filePath);
        } else if (filePath.endsWith('.xlsx')) {
            filePath = filePath.replace('/tempfiles', '').replace('.xlsx', '') + "/" + folder.replace('.xlsx', '').split(' ').join('_') + page_ext + "1.csv";
            $('.ver-modal-preview').empty();
            ver_csv_gen($selector, filePath);
            // filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
        }
        $('#ver_pagination').twbsPagination({
            totalPages: $number_files,
            visiblePages: 7,
            first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
            prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
            next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
            last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
            initiateStartPageClick: false,
            onPageClick: function (event, page) {
                var f_path = filePath.replace('/tempfiles', '').replace('.xlsx', '').replace('_x_p_c1.csv', '') + page_ext + page + ".csv";
                $('.ver-modal-preview').empty();
                ver_csv_gen2('.ver-modal-preview', f_path);
            }
        });
        //'/media/repository/2017-07-31/556b10fc422946517bb6b889cefcfd8d.csv'
    };
    var ver_csv_gen = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {

            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr("class","csv_table")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr("class","csv_td")
                .text(function (d) {
                    return d;
                });
        });
    };
    var ver_csv_gen2 = function ($selector, fp) {
        d4.text('/media/' + fp, function (data) {
            var parsedCSV = d4.csv.parseRows(data);

            var container = d4.select($selector)
                .append("table").attr("class","csv_table")

                .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

                .selectAll("td")
                .data(function (d) {
                    return d;
                }).enter()
                .append("td").attr("class","csv_td")
                .text(function (d) {
                    return d;
                });
        });
    };
    var viewDocument = function ($selector, filepath) {
        var fileUrl = api.pdf.view + api.url.base + '/media/' + filepath;
        if ($selector.toString() == '.pdfViewer') {
            $('#super-wrapper').css('display', 'block');
            $('#super-wrapper').html('<div id="content-wrapper">\n' +
                '                         <div id="pdf"></div>\n' +
                '                         <div id="viewer" class="pdfViewer"></div>\n' +
                '                      </div>');
            $('#preview_without_pdfjs').css('display', 'none');
            $(document).find('#pdf').attr('data-file', api.url.base + filepath);
            $('#will_show_annotate').css('display', 'block');
            if (pdf_function == 'annotation') {
                localStorage.setItem(api.url.base + filepath + '/tooltype', 'highlight');
            }
            else {
                localStorage.setItem(api.url.base + filepath + '/tooltype', 'area');
            }
            $.getScript(api.pdf.js, function (data, textStatus, jqxhr) {
                if (pdf_function == 'annotation') {
                    $('#pdfjs_rectangle').attr('class', 'rectangle');
                    $('#pdfjs_rectangle').attr('disabled', 'disabled');
                    $('#pdfjs_highlight').attr('class', 'highlight active');
                    $('#pdfjs_highlight').removeAttr('disabled');
                    $('#select_user').attr('disabled','disabled');
                }else{
                    $('#pdfjs_highlight').attr('class','highlight');
                    $('#pdfjs_highlight').attr('disabled','disabled');
                    $('#pdfjs_rectangle').removeAttr('disabled');
                    $('#pdfjs_rectangle').attr('class','rectangle active');
                    $('#select_user').removeAttr('disabled');
                }
            })
        } else {
            $('#super-wrapper').css('display', 'none');
            $('#will_show_annotate').css('display', 'none');
            $('#preview_without_pdfjs').css('display', 'block');
            if (fileUrl.endsWith('.doc')) {
                $('#doc_pagination').css('display', 'none');
                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            }
            else if (fileUrl.endsWith('.docx')) {
                $('#doc_pagination').css('display', 'none');
                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            }
            if (filepath.endsWith('.xls') || filepath.endsWith('.xlsx')) {
                $('#doc_pagination').css('display', 'block');
                csvToHtml($selector, filepath);
            } else {
                $('#doc_pagination').css('display', 'none');
                let iFrame = '<iframe id="docView" name="docView" ' +
                    'style="width:95%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
                    'allowfullscreen webkitallowfullscreen ' +
                    'src="' + fileUrl + '"></iframe>';
                $($selector).html(iFrame);
            }
        }


        /*$(document).find('#pdf').attr('data-file','http://127.0.0.1:8000/media/repository/2017-12-27/2251df3b7a7c55657526155222d2743a.pdf');
        $.getScript(api.pdf.js, function (data, textStatus, jqxhr) {

        });*/

    };
    /*var viewDocument = function ($selector, filepath) {
        let media = filepath.split("workflow");
        let fileUrl = 'http://0.0.0.0:8088/media/repository/2017-12-27/d5f9e8f25bf8a91faadac7ffdfb18308watermarked.pdf';
        console.log("filename",fileUrl)
        $(document).find('#pdf').attr('data-file', filepath);
        $.getScript(api.pdf.js, function (data, textStatus, jqxhr) {

        });
    };*/
    var metafield = function (docType) {
        HttpClient.url = buildUrl(api.document.metafield, {doc_id: docType});
        HttpClient.inputs = {};
        var result = HttpClient.call();
        result.success(function (response) {
            $metafield = response;
            $.each($metafield, function (k, v) {
                console.log(v.displayname);
            })
        });

        return result
    };
    var updateMeta = function () {
        var $from = $('#editMeta').find('form');
        $from.parsley().validate();
        if ($from.parsley().isValid()) {
            var $status = 0;
            var $uniqueElement = $('.meta-data-gen-wrap').find('input[data-parsley-unique_meta=unique], textarea[data-parsley-unique_meta=unique], select[data-parsley-unique_meta=unique]');
            $.each($uniqueElement, function (k, v) {
                var $name = $(v).attr('name'),
                    $value = $(v).val(),
                    $doc_id = $('#doc_type').find("option:selected").val();
                var $label = $(v).closest('.form-group').find('label').text();
                if ($value != '') {
                    $.ajax({
                        url: '/api/v1/dms/categorization/unique_metafield/?doc_id=' + $doc_id + '&unique_id=' + $name + '&value=' + $value + '&ind_doc=' + $document.id,
                        method: 'GET',
                        success: function (data) {
                            if (data.exists != 'N') {
                                notify('', $label + ' value already exists', '', 'danger', '6000');
                                $status = $status + 1;
                            }
                        },
                        error: function (response, jqXHR, textStatus, errorThrown) {
                        }
                    });
                }
            });

            //setTimeout(function () {
            if ($status == 0) {
                var inputs = {};
                var tmp = $from.find('#doc_data input, #doc_data select').serializeArray();
                $.each(tmp, function (key, val) {
                    inputs[val.name] = val.value;
                });
                inputs.tags = $('#meta_tags').val();
                // var tmpMeta = $from.find('.meta-data-gen-wrap input, .meta-data-gen-wrap select, .meta-data-gen-wrap textarea').serializeArray();
                // console.log(tmpMeta);
                // inputs.meta_data = {};
                // $.each(tmpMeta, function (k, v) {
                //     inputs.meta_data[v.name] = v.value;
                // });
                inputs.meta_data = [];
                $.each($('.meta-data-gen-wrap .fg-line'), function (k, v) {
                    var $this = $(v);
                    var obj = {};
                    var input = $this.find('input');
                    var textarea = $this.find('textarea');
                    var select = $this.find('select');
                    if (input.length > 0) {
                        obj['name'] = input.attr('name');
                        obj['value'] = input.val();
                        obj['displayname'] = input.data('displayname');
                    }
                    if (select.length > 0) {
                        obj['name'] = select.attr('name');
                        obj['value'] = select.val();
                        obj['displayname'] = select.data('displayname');
                    }
                    if (textarea.length > 0) {
                        obj['name'] = textarea.attr('name');
                        obj['value'] = textarea.val();
                        obj['displayname'] = textarea.data('displayname');
                    }
                    inputs.meta_data.push(obj);
                });
                HttpClient.url = api.document.updatemeta + $document.id + '/';
                HttpClient.method = 'PUT';
                HttpClient.setContentType('application/json');
                HttpClient.inputs = JSON.stringify(inputs);
                return HttpClient.call();
            }
            //}, 200);

        }
    };
    var userDocuments = function (uid) {
        var param = {
            'start': 0,
            'length': 10,
            'draw': 1
        };
        HttpClient.url = api.user.document;
        HttpClient.inputs = {user: uid, docid: $document.id, start: 0, length: 10, draw: 1};
        return HttpClient.call();
    };
    var buttonClick = function () {
        $('button').on('click', function (e) {
            e.preventDefault();
            var action = $(this).data('type');
            if ($.isFunction(self[action])) {
                self[action]($(this));
            }
        });
    };
    var href = function () {
        $(document).on('click', 'a', function (e) {
            e.preventDefault();
            var action = $(this).data('action');
            if ($.isFunction(self[action])) {
                self[action]($(this));
            } else {
                var url = $(this).attr('href');
                if (url) {
                    window.location = url;
                }
            }
        });
    };
    var categories = function () {
        HttpClient.url = api.document.category;
        var result = HttpClient.call();
        result.success(function (res) {
            $categories = res;
        });
    };
    var docType = function (res) {
        let category = [];
        $.each(res, function (k, v) {
            let cat = [];
            $.each(v.ancestors, function (a, ancestor) {
                cat.push(ancestor.name);
            });
            cat.push(v.name);
            category[v.id] = cat.join('&rarr;');
        });
        return category;
    };
    var deleteDoc = function (version) {
        var params = {};
        params.doc_id = $document.id;
        if (version == "version") {
            HttpClient.url = api.document.delete + $document.id + '/';
        } else {
            HttpClient.url = api.document.delete + version + '/';
        }
        HttpClient.method = 'DELETE';
        return HttpClient.call();
    };
    var archiveDoc = function () {
        var params = {};
        params.doc_id = $document.id;
        HttpClient.url = api.document.archive + $document.id + '/?operation=archive';
        HttpClient.method = 'GET';
        return HttpClient.call();
    };
    var checkoutDoc = function () {
        var params = {};
        params.doc_id = $document.id;
        HttpClient.url = api.document.checkout + $document.id + '/?operation=check_out';
        HttpClient.method = 'GET';
        return HttpClient.call();
    };
    var checkinDoc = function () {
        var params = {};
        params.doc_id = $document.id;
        HttpClient.url = api.document.checkin + $document.id + '/?operation=check_in';
        HttpClient.method = 'GET';
        return HttpClient.call();
    };
    var restoreArchive = function () {
        var params = {};
        params.doc_id = $document.id;
        HttpClient.url = api.document.restoreArchive + $document.id + '/?operation=restore_archive';
        HttpClient.method = 'GET';
        return HttpClient.call();
    };
    var saveVersion = function () {
        $.ajaxSetup({
            processData: false,
            contentType: false
        });
        var $from = $('#addVersion').find('form');
        $from.parsley().validate();
        if ($from.parsley().isValid()) {
            var $inputs = new FormData($from[0]);
            $inputs.append('filename', $document.filename);
            $inputs.append('uploader', api.user.loggedIn);
            $inputs.append('creation_date', moment().format('YYYY-MM-DD'));
            $inputs.append('doc_type', $document.doc_type);
            $inputs.append('metadata', $document.metadata);
            $inputs.append('tags', $document.tags);
            $inputs.append('version_uploader_id', api.user.loggedIn);
            $inputs.append('extension', $document.extension);
            var params = {};
            params.doc_id = api.document.id;
            HttpClient.url = buildUrl(api.document.versions, params);
            HttpClient.inputs = $inputs;
            HttpClient.method = 'POST';
            var result = HttpClient.call();
            result.success(function (res) {
                HttpClient.reset();
                var response = $.parseJSON(res);
                $lastVersion = parseFloat(response.version);
                $document.id = response.id;
                viewDocument('.wi-preview', response.filepath);
                comments(response.id);
                versions();
                $('#addVersion').modal('hide');
                notify('', 'Version update successfully', '', 'success', 2000);
                setTimeout(function () {
                    location.reload();
                }, 2000);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                notify(jqXHR.responseJSON.message, '', '', 'danger', 2000);
            });
        }
    };
    var user = function (uid) {
        HttpClient.url = api.user.get + uid + '/';
        HttpClient.inputs = {};
        var result = HttpClient.call();
        result.statusCode({
            404: function (res) {
                //console.log(res.statusText);
            },
            200: function (res) {
                //$('.media-body h2').children('label').text(res.first_name + ' ' + res.last_name);
                if (res.avatar) {
                    //$('.media').children('.pull-left').children('.avatar-img').attr('src', res.avatar);
                }
            }
        });
    };
    var relatedFile = function (docId) {
        docId = docId || api.document.id;
        HttpClient.method = 'GET';
        HttpClient.url = api.document.related;
        HttpClient.inputs = {'doc_id': docId};
        var result = HttpClient.call();
        result.success(function (relatedFile) {
            if (relatedFile.length > 0) {
                $('#relatedFiles').empty();
                let files = doT.template($('#related-file').html());
                $.each(relatedFile, function (key, val) {
                    $linkFileIds.push(val.linkfile);
                    HttpClient.url = api.document.category + val.document.doc_type + '/';
                    var category = HttpClient.call();
                    category.success(function (res) {
                        val.document.category = res;
                        let cat = [];
                        $.each(res.ancestors, function (k, v) {
                            cat.push(v.name);
                        });
                        cat.push(res.name);
                        val.document.type = cat.join('&rarr;');
                        $('#relatedFiles').append(files(val));
                    });
                });
            } else {
                $('#relatedFiles').html('<span>No related files. </span>');
            }
        });
    };
    var comments = function (docId) {
        docId = docId || api.document.id;
        HttpClient.url = api.comments.list;
        HttpClient.inputs = {'doc_id': docId};
        var result = HttpClient.call();
        result.success(function (comments) {
            noOfComment = comments.length;
            // $('.block-header').children('h2').children('small').children('strong').first().children('span').text(noOfComment);
            $('.doc_comment_count').text(noOfComment);
            if (comments.length > 0) {
                let html = doT.template($('#comments').html());
                $('.wi-comments > .list-group').html(html(comments));
            }
        });
    };
    var versions = function (docId) {
        docId = docId || api.document.id;
        var params = {};
        params.parent_id = docId;
        HttpClient.method = 'GET';
        HttpClient.url = buildUrl(api.document.versions, params);
        HttpClient.inputs = '';
        var result = HttpClient.call();
        // result.success(function (res) {
        //     console.log("ver", res);
        //     $('#versionHistory').empty();
        //     if (res.length > 0) {
        //         console.log("ok");
        //         // let files = doT.template($('#versions').html());
        //         // $('#versionHistory').append(files(res));
        //     } else {
        //         $('#versionHistory').append('<span>No version uploaded. </span>');
        //     }
        // });
    };
    var buildUrl = function (base, params) {
        var sep = (base.indexOf('?') > -1) ? '&' : '?';
        var param = [];
        $.each(params, function (key, val) {
            var tmp = key + '=' + val;
            param.push(tmp);
        });
        return base + sep + param.join('&');
    };
    var saveComment = function ($comment, docid) {
        docid = docid || api.document.id;
        var params = {};
        HttpClient.url = api.comments.list;
        params.document = docid;
        params.commentor = api.user.loggedIn;
        params.comment = $comment.val();
        HttpClient.inputs = params;
        HttpClient.method = 'POST';
        return HttpClient.call();
    };
    var bulidMeta = function (meta) {
        var $metaGenWrap = $('.meta-data-gen-wrap');
        $metaGenWrap.empty();
        $.each(meta, function (k, v) {
            v.value = v.default_text;
            var type = ($dataType[v.data_type]).toLowerCase()
            var field = doT.template($('#' + type).html());
            switch (type) {
                case 'date':
                    $metaGenWrap.append(field(v));
                    $('.date-picker').datetimepicker({
                        format: 'YYYY-MM-DD'
                    });
                    break;
                case 'dropdown':
                    v.options = v.default_text.split("\n");
                    $metaGenWrap.append(field(v));
                    $('.selectpicker').selectpicker();
                    break;
                default:
                    $metaGenWrap.append(field(v));
            }
        });
    };
    $(document).on('click', '#del_link', function (e) {
        e.stopPropagation();
        var linkid = $(this).data('id');
        swal({
            title: "Are you sure?",
            text: "You can link this file letter!",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Unlink!",
            cancelButtonText: "No, cancel!",
        }).then(function (isConfirm) {
            if (isConfirm) {

                $.ajax({
                    url: '/api/v1/dms/documents/linkeddocument/' + linkid,
                    method: 'DELETE',
                    success: function (res) {
                        notify('', 'Document Unlinked Successfully', '', 'success', 1000);
                        setTimeout(function () {
                            location.reload();
                        }, 2000);
                    }
                });

            }
        });
    });
    $(document).on('click', '.watermark', function (e) {
        e.preventDefault();
        let value = $(this).data('value'), doc_id = $document.id;
        $.ajax({
            url: '/api/v1/dms/documents/attach_watermark/?doc_id=' + doc_id + '&value=' + value,
            method: 'GET',
            success: function (res) {
                notify('', 'Document Watermarked Successfully', '', 'success', 2000);
                setTimeout(function () {
                    location.reload();
                }, 2000);
            },
            error: (res) => {
                $.each(JSON.parse(res.responseText), function (key, value) {
                    var nMessage = value;
                    notify('', '' + nMessage, '', 'danger', '5000');
                });
            }
        });
    });
    $(document).on('click', '.free_text', function (e) {
        e.preventDefault();
        $('#free_text_val').val('');
        $('#free_text_modal').modal('show');
    });
    $(document).on('click', '#attach_free_text', function (e) {
        e.preventDefault();
        let free_text = $('#free_text_val').val(), doc_id = $document.id;
        $.ajax({
            url: '/api/v1/dms/documents/attach_watermark/?doc_id=' + doc_id + '&value=free_text&free_text=' + free_text,
            method: 'GET',
            success: function (res) {
                notify('', 'Document Watermarked Successfully', '', 'success', 2000);
                setTimeout(function () {
                    location.reload();
                }, 2000);
            },
            error: (res) => {
                $.each(JSON.parse(res.responseText), function (key, value) {
                    var nMessage = value;
                    notify('', '' + nMessage, '', 'danger', '5000');
                });
            }
        })
    });

    function loadViewLink(watermark, watermark_file_path, file_path) {
        var fileUrl = api.url.base + '/media/' + file_path;
        if (watermark !== '0') {
            fileUrl = api.url.base + '/media/' + watermark_file_path;
        } else {
            if (fileUrl.endsWith('.doc')) {
                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            }
            else if (fileUrl.endsWith('.docx')) {
                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
            }
            else if (file_path.endsWith('.xls') || file_path.endsWith('.xlsx')) {
                var filePath = file_path,
                    page_ext = "_x_p_c";
                var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
                if (filePath.endsWith('.xls')) {
                    fileUrl = api.url.base + '/media/' + filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
                } else if (filePath.endsWith('.xlsx')) {
                    fileUrl = api.url.base + '/media/' + filePath.replace('/tempfiles', '').replace('.xlsx', '') + "/" + folder.split(' ').join('_').replace('.xlsx', '') + page_ext + "1.csv";
                }
            }
        }
        $(document).find('#file_view_link').attr('data-filepath', fileUrl)
    }

    loadViewLink(latest_file_watermark, latest_watermark_path, latest_file_path);
    $(document).on('click', '#file_view_link', function (e) {
        e.preventDefault();
        let fileUrl = $(this).attr('data-filepath');
        window.open(fileUrl, '_blank');
    });

    function getSelectionDimensions() {
        var sel = $(document).selection, range;
        var width = 0, height = 0;
        if (sel) {
            if (sel.type != "Control") {
                range = sel.createRange();
                width = range.boundingWidth;
                height = range.boundingHeight;
            }
        } else if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0).cloneRange();
                if (range.getBoundingClientRect) {
                    var rect = range.getBoundingClientRect();
                    width = rect.right - rect.left;
                    height = rect.bottom - rect.top;
                }
            }
        }
        return {width: width, height: height};
    }

    $('#docView').mouseup = function () {
        var selDimensions = getSelectionDimensions();
        console.log("Selection width: " + selDimensions.width + ", height: " + selDimensions.height);
    };

      // Summary
    $('#summary_show').off('click').on('click', function () {
        var $summary_modal = $('#summary_modal'),
        $comment_count_span = $('#comment_count'),
        $query_count_span = $('#query_count');
        if ($(this).data('case-id')) {
            var id = $(this).data('case-id');
            $('a[data-toggle="tab"]').off('shown.bs.tab').on('shown.bs.tab', function (e) {
                var $target = $(e.target).attr("href");

                if (($target == '#general_info')) {
                    GeneralInfoCall(id);
                }
                else if ($target == '#process_map') {
                    ProcessMapCall(id)
                }
                else if ($target == '#upload_doc') {
                    UploadDocumentCall(id);
                }
                else if ($target == '#comment_tab') {
                    CommentCall(id);
                }
                else if ($target == '#query_tab') {

                    QueryCall(id)
                }
            });
            $('.tab-nav a[href="#general_info"]').tab('show');
            $summary_modal.find('.printing_button').off('click.fang').on('click.fang', function () {
                window.open("/printer/app_view/"+id, "PrintWindow");
            });
            $summary_modal.find($comment_count_span).text($(this).data('comment_count'));
            $summary_modal.find($query_count_span).text($(this).data('query_count'));
            $summary_modal.modal().show();

        } else {
            notify('No case selected!!! ', 'Please select a case first', '', 'danger', 5000);
        }
    });
    return self;
})();
