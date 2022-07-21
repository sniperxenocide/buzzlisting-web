{
    function init() {
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

        let $table = $('.meta-data-list-document-field');
        let $tableBody = $('.meta-data-list-document-field tbody');
        let $emptyTable = $('.table-empty');

        function hidePaginationShowNothing() {
            $('.pagination, .delete_all_pending_docs').hide();
            $('.pending-meta-container').append('<div class="nothingPending">Nothing to display...!</div>');
        }

        function FadeOutRemove($elem) {
            if ($elem != undefined) {
                $elem.find('.c-item').fadeOut(30, function () {
                    $elem.remove();
                });
            }
        }

        function thumbHideShowRemove($removeElement) {
            if ($tableBody.find('tr').length > 0) {
                $emptyTable.hide();
                $table.show();
                //here
                $('.meta-data-list-head, #move_all_btn').show();

                FadeOutRemove($removeElement);
            }
            else {
                $emptyTable.show();
                $table.hide();
                $('.meta-data-list-head, #move_all_btn').hide();
            }
        }


        let api_url = location.origin + '/api/v1/';
        let pending_meta_list_url = api_url + 'dms/documents/pendingMetaList/';
        let true_pending_metalist = api_url + 'dms/documents/truependingMetaList/';
        let delete_all_pendings = api_url + 'dms/documents/delete_all_pendings/';
        // if(typeof app_id !== 'undefined'){
        //     let upload_document_url = api_url + '/api/v1/workflow/upload_document/?app_id='+app_id;
        // }

        //main html where pending files will be appended
        let $mainHtml = $('.pending-meta-container');

        //pagination request parameter for ajax request
        let param = {
            'start': 0,
            'length': 6,
            'draw': 1
        };

        // Check unique
        function checkUniqueMetafield() {
            var $metaFieldWrap = $('.meta-data-gen-wrap'),
                $date_input = $metaFieldWrap.find('.date-time-picker').attr('data-unique', 'unique'),
                $selectPicker = $metaFieldWrap.find('select[data-unique=unique]'),
                $inputTextarea = $metaFieldWrap.find('input[data-unique=unique], textarea[data-unique=unique]'),
                $documentType = $('#DocumentType');

            $inputTextarea.off('keyup.a').on('keyup.a', function () {
                postData($(this));
            });
            // $inputTextarea.off('change.aa').on('change.aa', function () {
            //     postData($(this));
            // });
            $date_input.off("dp.change.c").on("dp.change.c", function () {
                postData($(this));
            });
            ($selectPicker).off('change.b').on('change.b', function () {
                postData($(this));
            });

            function postData($element) {
                var $name = $element.attr('name'),
                    $value = $element.val();
                var $doc_id = $documentType.find("option:selected").val();
                console.log($doc_id, $name, $value);
                // /api/v1/dms/categorization/metafield/?doc_id=8&unique_id=uhid&value=po
                if ($value != '') {
                    $.ajax({
                        url: '/api/v1/dms/categorization/unique_metafield/?doc_id=' + $doc_id + '&unique_id=' + $name + '&value=' + $value,
                        method: 'GET',
                        success: function (data) {
                            if (data.exists == 'Y') {
                                if ($element.closest('.fg-line').siblings('.help-block').find('.parsley-duplicate').length < 1) {
                                    $element.parsley().addError('duplicate', {
                                        message: 'This field should be unique ',
                                        updateClass: true
                                    });
                                }
                                $element.attr('data-stopValidation', true);
                            } else {
                                $element.parsley().removeError('duplicate', {updateClass: true});
                                $element.attr('data-stopValidation', false);
                            }

                        },
                        error: function (response, jqXHR, textStatus, errorThrown) {

                        }
                    });
                }
            }
        }

        //reset pagination
        function resetPagination() {
            $('#pagination').css({'display': 'none'});
            $('.show-paging-info').css({'display': 'none'});
            $('.page_number_input').val('1');

            //$('.goPaged').trigger('click.paginate');
        }

        //resetPagination();

        //create pagination
        function createPagination(min, max, totalFiles) {
            if (totalFiles != undefined) {
                let $page_number_input = $('.page_number_input');
                let $show_page_number = $('.show-page-numb');
                let $total_pages = $('.total-pages');
                let $total_files = $('.total-files');
                let $showing_files = $('.showing-files');

                $page_number_input.attr({min: 1, max: max});
                //$show_page_number.text('1');
                //max == total page
                $total_pages.text(max);

                function generatePageFileNumbs() {
                    $show_page_number.text($page_number_input.val());
                    //show file start val = param.start
                    let fileShowingStart = param.start + 1;
                    let fileShowingLast = param.start + param.length;
                    //assign total files
                    $total_files.text(totalFiles);

                    if (fileShowingLast > $total_files.text()) {
                        fileShowingLast = $total_files.text();
                    }
                    $showing_files.text(fileShowingStart + '-' + fileShowingLast);
                };
                generatePageFileNumbs();


                $('#pagination').css({'display': 'inline-flex'});
                $('.show-paging-info').css({'display': 'inline'});

                //on go button click fire and changer ajax request
                $('.goPaged').off('click.paginate').on('click.paginate', function () {
                    param.start = Math.abs(Number($page_number_input.val()) - 1) * param.length;
                    generatePageFileNumbs();
                    //disable this button
                    $(this).attr('disabled', 'disabled');
                    //here
                    var $url;
                    if (typeof app_id !== 'undefined') {
                        $url = api_url + 'workflow/upload_document/?app_id=' + app_id;
                    } else {
                        $url = pending_meta_list_url;
                    }

                    function generateThumbnails() {
                        $.ajax({
                            method: 'GET',
                            url: $url,
                            data: param,
                            success: res => {
                                console.log('response length', res.data.length);
                                //empty main
                                $mainHtml.empty();

                                for (let i = 0; i < res.data.length; i++) {

                                    //console.log('response', res.data[i]);
                                    if (res.data[i]["attached"] == false) {
                                        //console.log('response', res.data[i]);
                                        let template = doT.template($('#singlethumb').html());
                                        $mainHtml.append(template(res.data[i]));
                                    }
                                }
                                //enable all the disabled buttons
                                $('.next, .prev, .first, .last, .goPaged').removeAttr('disabled');
                            }
                        });
                    }

                    generateThumbnails();


                    /*//only attached files //added list
                     function generateQuedTableList(){
                     $tableBody.empty();
                     $.ajax({
                     method: 'GET',
                     url: true_pending_metalist,
                     success: (res) => {
                     $tableBody.empty();

                     console.log('true attached files', res);
                     if (res.length > 0) {
                     $.each(res, function (k, v) {
                     let template = doT.template($('#added_file').html());
                     $tableBody.append(template(v));
                     });
                     $('.meta-data-list-head, #move_all_btn').show();
                     $table.show();
                     $emptyTable.hide();
                     }
                     },
                     error: (res) => {
                     console.log(res);
                     }
                     });
                     }
                     generateQuedTableList();*/


                    //disable current button
                    $(this).attr('disabled', 'disabled');
                });

                //trigger a click event on
                function goPagedTrigger() {
                    //hidePreloader();
                    $('.goPaged').trigger('click.paginate');
                };
                //trigger when pagination create happens
                //goPagedTrigger();

                //next button click event
                $(document).off('click.next').on('click.next', '.next', function (e) {
                    let pageNumber = Number($page_number_input.val());
                    console.log('pageNumber: ', pageNumber);

                    if (pageNumber < max) {
                        pageNumber++;
                        $page_number_input.val(pageNumber);
                        goPagedTrigger();
                    }
                    //disable current button
                    $(this).attr('disabled', 'disabled');
                });

                //previous button click event
                $(document).off('click.prev').on('click.prev', '.prev', function (e) {
                    let pageNumber = Number($page_number_input.val());
                    console.log('pageNumber: ', pageNumber);

                    if (pageNumber > min) {
                        pageNumber--;
                        $page_number_input.val(pageNumber);
                        goPagedTrigger();
                    }
                    //disable current button
                    $(this).attr('disabled', 'disabled');
                });
                //goto first page
                $(document).off('click.first').on('click.first', '.first', function (e) {
                    $page_number_input.val(min);
                    goPagedTrigger();

                    $(this).attr('disabled', 'disabled');
                });
                //goto last page
                $(document).off('click.last').on('click.last', '.last', function (e) {
                    $page_number_input.val(max);
                    goPagedTrigger();
                    //disable current button
                    $(this).attr('disabled', 'disabled');
                });

                /*$(document).on('keypress','.page_number_input', (e)=> {
                 if (e.which == 13) {
                 goPagedTrigger();
                 }
                 });*/
            }
        }


        function getAllPendingMetaPaged() {
            var $url;
            if (typeof app_id !== 'undefined') {
                $url = api_url + 'workflow/upload_document/?app_id=' + app_id + '&attach=false';
            } else {
                $url = pending_meta_list_url;
            }
            $.ajax({
                method: 'GET',
                url: $url,
                data: param,
                success: function (res) {
                    console.log('1');
                    let totalPages = Math.ceil(res.recordsTotal / param.length);
                    //location.reload();
                    //resetPagination();
                    //create pagination

                    if (totalPages > 0) {
                        if (res.data.length < 1) {
                            var $elem = $('.page_number_input');
                            var currPage = $elem.val();
                            $elem.val(currPage - 1);
                        }
                    }


                    if (res.recordsTotal == 0) {
                        hidePaginationShowNothing();
                        return;
                    }

                    createPagination(1, totalPages, res.recordsTotal);
                    $('.goPaged').trigger('click.paginate');
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }

        function onLoadFileThumbs() {
            var $url;
            if (typeof app_id !== 'undefined') {
                $url = api_url + 'workflow/upload_document/?app_id=' + app_id + '&attach=false';
            } else {
                console.log("hello else");
                $url = pending_meta_list_url;
            }
            //typeof api_url !== '' ? $url = api_url + 'workflow/upload_document/?app_id=' + app_id : $url = pending_meta_list_url;
            $.ajax({
                method: 'GET',
                url: $url,
                data: param,
                success: (res) => {
                    console.log('2');
                    //console.log(res);

                    //console.log(res.data);

                    //get total pages
                    let totalPages = Math.ceil(res.recordsTotal / param.length);
                    $('.delete_all_pending_docs').show();

                    if (res.recordsTotal == 0) {
                        hidePaginationShowNothing();
                    }

                    //create pagination
                    createPagination(1, totalPages, res.recordsTotal);

                    //meta-data-list-docs
                    $tableBody.empty();

                    for (let i = 0; i < res.data.length; i++) {
                        console.log("res.data[i]", res.data[i]);
                        if (res.data[i]["attached"] == false) {

                            //res.data[i]['docId'] = res.data[i].id;
                            //console.log('response', res.data[i].id);
                            let template = doT.template($('#singlethumb').html());
                            $mainHtml.append(template(res.data[i]));
                        } else if (res.data[i]["attached"] == true) {

                            let template = doT.template($('#added_file').html());
                            $tableBody.append(template(res.data[i]));
                        }
                    }

                    //only attached files //added list
                    function generateQuedTableList() {
                        $tableBody.empty();
                        var $url;
                        if (typeof app_id !== 'undefined') {
                            $url = api_url + 'workflow/upload_document/?app_id=' + app_id + '&attach=true';
                        } else {
                            $url = true_pending_metalist;
                        }
                        $.ajax({
                            method: 'GET',
                            url: $url,
                            success: (res) => {
                                $tableBody.empty();

                                console.log('true attached files', res);
                                if (res.length > 0) {
                                    $.each(res, function (k, v) {
                                        let template = doT.template($('#added_file').html());
                                        $tableBody.append(template(v));
                                    });
                                    $('.meta-data-list-head, #move_all_btn').show();
                                    $table.show();
                                    $emptyTable.hide();
                                }
                            },
                            error: (res) => {
                                console.log(res);
                            }
                        });
                    }

                    generateQuedTableList();
                }

            })
        }

        onLoadFileThumbs();

//Thumbnails add, view, delete
        var metaCsvToHtml = function ($selector, $file_path, $number_files) {
            var filePath = $file_path,
                page_ext = "_x_p_c";
            console.log(filePath);
            var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
            console.log(folder);
            $('#temp_doc_pagination').css('display', 'block');
            $('.temp-modal-preview').css('display', 'block');

            filePath = filePath.replace('.xlsx', '') + "/" + folder.replace('.xlsx', '').split(' ').join('_') + page_ext + "1.csv";

            meta_csv_gen($selector, filePath);
            // filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";

            $('#temp_doc_pagination').twbsPagination({
                totalPages: $number_files,
                visiblePages: 7,
                first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                onPageClick: function (event, page) {
                    var f_path = filePath.replace('.xlsx', '').replace('_x_p_c1.csv', '') + page_ext + page + ".csv";
                    $('.temp-modal-preview').empty();
                    meta_csv_gen2('.temp-modal-preview', f_path);
                }
            });
            //'/media/repository/2017-07-31/556b10fc422946517bb6b889cefcfd8d.csv'
        };
        var meta_csv_gen = function ($selector, fp) {
            d4.text('/media/' + fp, function (data) {

                var parsedCSV = d4.csv.parseRows(data);

                var container = d4.select('.temp-modal-preview')
                    .append("table").attr({class: 'preview-table'})

                    .selectAll("tr")
                    .data(parsedCSV).enter()
                    .append("tr")

                    .selectAll("td")
                    .data(function (d) {
                        return d;
                    }).enter()
                    .append("td").attr({class: 'preview-td'})
                    .text(function (d) {
                        return d;
                    });
            });
        };
        var meta_csv_gen2 = function ($selector, fp) {
            d4.text('/media/' + fp, function (data) {
                var parsedCSV = d4.csv.parseRows(data);

                var container = d4.select($selector)
                    .append("table").attr({class: 'preview-table'})

                    .selectAll("tr")
                    .data(parsedCSV).enter()
                    .append("tr")

                    .selectAll("td")
                    .data(function (d) {
                        return d;
                    }).enter()
                    .append("td").attr({class: 'preview-td'})
                    .text(function (d) {
                        return d;
                    });
            });
        };
        $(document).off('click.thumb').on('click.thumb', '.thumbnail-actions .delete-item, .thumbnail-actions .view-item, .thumbnail-actions .add-item, .ci-avatar', function () {
            let $this = $(this);
            let $pending_meta_elem = $this.closest('.pending-meta');

            let docId = $pending_meta_elem.data('pending-doc-id');
            let docName = $pending_meta_elem.data('pending-doc-name');
            let docExt = $pending_meta_elem.data('pending-doc-extension');
            let image_location = $pending_meta_elem.data('pending-doc-thumb-location');
            let toLog = '';

            let obj = {
                "id": docId,
                "name": docName,
                "extension": docExt,
                "thumb": image_location
            };
            //console.log(obj);
            let added_file_template = doT.template($('#added_file').html());

            if ($this.hasClass('delete-item')) {
                toLog = 'delete ' + docId;
                $.ajax({
                    url: '/api/v1/dms/documents/delpendingmeta/' + docId,
                    method: 'DELETE',
                    dataType: 'json',
                    success: function (data) {
                        //$table.fnDraw();
                        //console.log($table);
                        //$table.clearPipeline().draw();
                        FadeOutRemove($pending_meta_elem);
                        getAllPendingMetaPaged();

                        notify('', 'Removed from pending list', '', 'danger', 500);

                    },
                    error: function (response, jqXHR, textStatus, errorThrown) {
                        console.log(response);
                    }
                });
            }
            else if ($this.hasClass('view-item')) {
                toLog = 'view ' + docId;

                let title = obj.name;

                //title
                $('#viewFiles').find('.modal-title').text(title);
                if (obj.extension == "application/pdf") {
                    if (typeof app_id !== 'undefined') {
                        var $get_url = '/api/v1/dms/documents/filepreview/' + docId + '?source=workflow';
                    }else{
                        var $get_url = '/api/v1/dms/documents/filepreview/' + docId ;
                    }
                    //load file url from ajax
                    $('.temp-modal-preview').css('display', 'none');
                    $('#temp_doc_pagination').css('display', 'none');
                    $.ajax({
                        method: 'GET',
                        url: $get_url,
                        success: function (res) {
                            let fileUrl = res;
                            console.log('pdfURL ' + fileUrl);

                            //viewer js container

                            //using window ratio to determine the height of PDF
                            $('#viewFiles #file_container').html('<iframe id="docView" ' +
                                'data-printurl="' + fileUrl + '"' +
                                'src="/dms/document/pdf_view#' + fileUrl + '"' +
                                'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                        }
                    });
                }
                else if (obj.extension == "application/msword") {
                    //load file url from ajax
                    $('.temp-modal-preview').css('display', 'none');
                    $('#temp_doc_pagination').css('display', 'none');
                    $.ajax({
                        method: 'GET',
                        url: '/api/v1/dms/documents/filepreview/' + docId,
                        success: function (res) {
                            let fileUrl = res;
                            console.log("fu", fileUrl);
                            if (fileUrl.endsWith('.doc')) {
                                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                            }
                            else if (fileUrl.endsWith('.docx')) {
                                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                            }
                            //viewer js container

                            //using window ratio to determine the height of PDF
                            $('#viewFiles #file_container').html('<iframe id="docView" ' +
                                'data-printurl="' + fileUrl + '"' +
                                'src="/dms/document/pdf_view#' + fileUrl + '"' +
                                'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                        }
                    });
                }
                else if (obj.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    //load file url from ajax
                    $('.temp-modal-preview').css('display', 'none');
                    $('#temp_doc_pagination').css('display', 'none');
                    $.ajax({
                        method: 'GET',
                        url: '/api/v1/dms/documents/filepreview/' + docId,
                        success: function (res) {
                            let fileUrl = res;
                            console.log("fu", fileUrl);
                            if (fileUrl.endsWith('.doc')) {
                                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                            }
                            else if (fileUrl.endsWith('.docx')) {
                                fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                            }
                            //viewer js container

                            //using window ratio to determine the height of PDF
                            $('#viewFiles #file_container').html('<iframe id="docView" ' +
                                'data-printurl="' + fileUrl + '"' +
                                'src="/dms/document/pdf_view#' + fileUrl + '"' +
                                'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                        }
                    });
                }
                else if (obj.extension == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                    $("#file_container").empty();
                    $.ajax({
                        url: '/api/v1/dms/documents/temp_preview/?doc_id=' + docId,
                        method: 'GET',
                        success: function (res) {
                            let response = JSON.parse(res);
                            let filePath = response.file_path,
                                number_files = response.number_files;

                            $('.temp-modal-preview').empty();
                            metaCsvToHtml($('.temp-modal-preview'), filePath, number_files);

                        }
                    });
                }
                else {
                    //load file url from ajax
                    $('.temp-modal-preview').css('display', 'none');
                    $('#temp_doc_pagination').css('display', 'none');
                    $.ajax({
                        method: 'GET',
                        url: '/api/v1/dms/documents/filepreview/' + docId,
                        success: function (res) {
                            let fileUrl = res;
                            console.log('imageURLs ' + fileUrl);
                            $('#viewFiles #file_container').html('<img width="100%" src="' + fileUrl + '" align="' + title + '"/>');
                        }
                    });

                }
                $('#viewFiles').modal('show');
            }
            else if ($this.hasClass('add-item') || $this.hasClass('ci-avatar')) {
                toLog = 'add ' + docId;
                //$tableBody.empty();
                //make attached true agains current Id

                if ($('.added_item_row').length > 0) {
                    console.log($($('.added_item_row')[0]).data('pending-doc-extension'));
                    var firstRowData = $($('.added_item_row')[0]).data('pending-doc-extension').split('/')[0];
                    if (firstRowData != obj.extension.split('/')[0]) {
                        notify('You can only add same type of files!', '', '', 'danger', 3500);
                        return;
                    }
                    if ($($('.added_item_row')[0]).data('pending-doc-extension') == 'application/msword') {
                        notify('You can add only one doc file at a time!', '', '', 'danger', 3500);
                        return;
                    }
                    if ($($('.added_item_row')[0]).data('pending-doc-extension') == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        notify('You can add only one doc file at a time!', '', '', 'danger', 3500);
                        return;
                    }
                    if ($($('.added_item_row')[0]).data('pending-doc-extension') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                        notify('You can add only one doc file at a time!', '', '', 'danger', 3500);
                        return;
                    }
                    if ($($('.added_item_row')[0]).data('pending-doc-extension') == 'application/vnd.ms-excel') {
                        notify('You can add only one doc file at a time!', '', '', 'danger', 3500);
                        return;
                    }
                }
                var $url;
                if (typeof app_id !== 'undefined') {
                    $url = api_url + 'workflow/upload_document/';
                } else {
                    console.log("hello else");
                    $url = pending_meta_list_url;
                }
                $.ajax({
                    method: "PATCH",
                    url: $url + docId + '/',
                    data: {"attached": true},
                    success: function (res) {
                        //console.log(res);

                        //$('.goPaged').trigger('click.paginate');
                        //location.reload();
                        //get total pages
                        getAllPendingMetaPaged();
                    }
                });

                $tableBody.append(added_file_template(obj));
                //console.log($pending_meta_elem);
                thumbHideShowRemove($pending_meta_elem);
            }

            console.log(toLog);
        });

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
                            optionName += v.name + ' &rarr; ';
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

//remove items from metadata table
        $(document).on('click', '.added_item_row .delete-item', function () {
            let $this = $(this);
            let $parent = $this.closest('.added_item_row');

            let obj = {
                id: $parent.data('pending-doc-id'),
                name: $parent.data('pending-doc-name'),
                extension: $parent.data('pending-doc-extension'),
                thumbnail: $parent.data('pending-doc-thumb-location')
            };


            /*let template = doT.template($('#singlethumb').html());
             $('.pending-meta-container').append(template(obj));*/
            $parent.remove();
            thumbHideShowRemove();

            //on remove functionality
            var $url;
            if (typeof app_id !== 'undefined') {
                $url = api_url + 'workflow/upload_document/';
            } else {
                $url = true_pending_metalist;
            }
            $.ajax({
                method: "PATCH",
                url: $url + obj.id + '/',
                data: {"attached": false},
                success: function (res) {
                    console.log(res);
                    //$('.goPaged').trigger('click.paginate');
                    //get total pages
                    var $url;
                    if (typeof app_id !== 'undefined') {
                        $url = api_url + 'workflow/upload_document/?app_id=' + app_id + '&attach=false';
                    } else {
                        $url = pending_meta_list_url;
                    }
                    $.ajax({
                        method: 'GET',
                        url: $url,
                        data: param,
                        success: function (res) {

                            let totalPages = Math.ceil(res.recordsTotal / param.length);
                            //location.reload();
                            //resetPagination();
                            //create pagination

                            $('.pagination').show();
                            createPagination(1, totalPages, res.recordsTotal);
                            $('.goPaged').trigger('click.paginate');
                            $('.delete_all_pending_docs').show();
                        },
                        error: function (err) {
                            console.log(err);
                        }
                    })
                }
            });
        });

        $(document).on('ready', function () {
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


        let $metaGenWrap = $('.meta-data-gen-wrap');

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
                            $.each(data, function (k, v) {
                                let metaId = v['title'].toLowerCase().split(" ");
                                if (metaId.length > 1) {
                                    metaId = metaId.join('_');
                                } else {
                                    metaId = metaId[0];
                                }
                                v.id = metaId;
                                console.log(v);
                                switch (v.data_type) {
                                    case 0:
                                        template = doT.template($('#stringInput').html());
                                        $metaGenWrap.append(template(v));
                                        console.log('string');
                                        break;
                                    case 1:
                                        template = doT.template($('#integerInput').html());
                                        $metaGenWrap.append(template(v));
                                        break;
                                    case 2:
                                        template = doT.template($('#textAreaInput').html());
                                        $metaGenWrap.append(template(v));
                                        break;
                                    case 3:
                                        template = doT.template($('#dropDownInput').html());

                                        let optionArr = v.default_text.split('\n');

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
                                        template = doT.template($('#dateInput').html());
                                        $metaGenWrap.append(template(v));
                                        $('.date-time-picker').datetimepicker({format: 'YYYY-MM-DD'});
                                        break;
                                    case 5:
                                        template = doT.template($('#stringInput').html());
                                        $metaGenWrap.append(template(v));
                                        break;
                                    default:
                                        $metaGenWrap.empty();
                                        break;
                                }

                                //check unique
                                //checkUniqueMetafield();

                                if (customer == 'z8t5y67') {
                                    DocumentNameSet();
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

//fixed wrapper css + show
        function fixedWrappCss(selectElem) {
            let positionLeft = $(selectElem).offset().left;
            let width = $(selectElem).width();
            return {width: width, left: positionLeft};
        };

        function fixedWrapperShow() {
            let pendingMetaWrapCSS = fixedWrappCss('.pending-meta-container');
            let $fixed_wrapper = $('.fixed_wrapper_for_doc_show');

            $fixed_wrapper.css(pendingMetaWrapCSS);

            if (!$fixed_wrapper.hasClass('shown')) {
                $fixed_wrapper.addClass('shown').fadeIn(100);
            }
        };

//move all to thumbnail view from added list
        $('#move_all_btn').on('click', function () {
            $(document).find('.added_item_row .delete-item').click();
        });
//show fixed wrapper
        $(document).off('click.added_row').on('click.added_row', '.meta-data-list-document-field tr.added_item_row td:nth-child(2),' +
            '.meta-data-list-document-field tr.added_item_row td:nth-child(3)', function () {
            let $this = $(this);
            let $parent = $this.closest('.added_item_row');

            let obj = {
                docId: $parent.data('pending-doc-id'),
                name: $parent.data('pending-doc-name'),
                extension: $parent.data('pending-doc-extension'),
                thumbnail: $parent.data('pending-doc-thumb-location')
            };


            if (obj.extension == "application/pdf") {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: '/api/v1/dms/documents/filepreview/' + obj.docId,
                    success: function (res) {
                        let fileUrl = res;
                        console.log('pdfURL ' + fileUrl);

                        //viewer js container

                        //using window ratio to determine the height of PDF
                        $('.img-container').html('<div class="centerer"></div><iframe id="docView" ' +
                            'data-printurl="' + fileUrl + '"' +
                            'src="/dms/document/pdf_view#' + fileUrl + '"' +
                            'style="width:100%;height:' + window.innerHeight / 1.1741379310344828 + 'px;border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                    }
                });
                fixedWrapperShow();
            }
            else if (obj.extension == "application/msword") {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: '/api/v1/dms/documents/filepreview/' + obj.docId,
                    success: function (res) {
                        let fileUrl = res;
                        if (fileUrl.endsWith('.doc')) {
                            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                        }
                        else if (fileUrl.endsWith('.docx')) {
                            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                        }
                        //viewer js container

                        //using window ratio to determine the height of PDF
                        $('.img-container').html('<div class="centerer"></div><iframe id="docView" ' +
                            'data-printurl="' + fileUrl + '"' +
                            'src="/dms/document/pdf_view#' + fileUrl + '"' +
                            'style="width:100%;height:' + window.innerHeight / 1.1741379310344828 + 'px;border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                    }
                });
                fixedWrapperShow();
            }
            else if (obj.extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: '/api/v1/dms/documents/filepreview/' + obj.docId,
                    success: function (res) {
                        let fileUrl = res;
                        if (fileUrl.endsWith('.doc')) {
                            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                        }
                        else if (fileUrl.endsWith('.docx')) {
                            fileUrl = fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf";
                        }
                        //viewer js container

                        //using window ratio to determine the height of PDF
                        $('.img-container').html('<div class="centerer"></div><iframe id="docView" ' +
                            'data-printurl="' + fileUrl + '"' +
                            'src="/dms/document/pdf_view#' + fileUrl + '"' +
                            'style="width:100%;height:' + window.innerHeight / 1.1741379310344828 + 'px;border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                    }
                });
                fixedWrapperShow();
            }
            else if (obj.extension == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                $("#file_container").empty();
                $.ajax({
                    url: '/api/v1/dms/documents/temp_preview/?doc_id=' + obj.docId,
                    method: 'GET',
                    success: function (res) {
                        let response = JSON.parse(res);
                        let filePath = response.file_path,
                            number_files = response.number_files;

                        $('.temp-modal-preview').empty();
                        metaCsvToHtml($('.temp-modal-preview'), filePath, number_files);
                        $('#viewFiles').modal('show');
                    }
                });
            }
            else {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: '/api/v1/dms/documents/filepreview/' + obj.docId,
                    success: function (res) {
                        let fileUrl = res;
                        console.log('imageURL ' + fileUrl);
                        $('.img-container').html('<div class="centerer"></div><img style="margin-top: -100px;" width="100%" src="' + fileUrl + '" align="' + obj.name + '"/>');
                    }
                });
                fixedWrapperShow();
            }

        });
//hide fixed wrapper
        $(document).on('click', '#hide_self_fixed', function (e) {
            e.preventDefault();
            var $fixed_wrapper = $('.fixed_wrapper_for_doc_show');
            $fixed_wrapper.hide();
            if ($fixed_wrapper.hasClass('shown')) {
                $fixed_wrapper.removeClass('shown');
            }
        });


//meta data form submission
        $('#add_meta_data').off('submit.pong').on('submit.pong', function (e) {
            e.preventDefault();
            let meta_data_form = $(this).parsley();
            meta_data_form.validate();
            if (meta_data_form.isValid()) {
                var $status = 0;
                var $uniqueElement = $('.meta-data-gen-wrap').find('input[data-parsley-unique_meta=unique], textarea[data-parsley-unique_meta=unique], select[data-parsley-unique_meta=unique]');
                $.each($uniqueElement, function (k, v) {
                    var $name = $(v).attr('name'),
                        $value = $(v).val(),
                        $doc_id = $('#DocumentType').find("option:selected").val();
                    var $label = $(v).closest('.form-group').find('label').text();
                    if ($value != '') {
                        $.ajax({
                            url: '/api/v1/dms/categorization/unique_metafield/?doc_id=' + $doc_id + '&unique_id=' + $name + '&value=' + $value,
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
                        let data = {files: [], meta_data: {}, source: 'dms', app: ''};
                        if (typeof app_id !== 'undefined') {
                            data.source = 'workflow',
                                data.app = app_id
                        }
                        let $_meta_data_row = $('.meta-data-list-document-field tbody tr');

                        if ($_meta_data_row.length > 0) {
                            $_meta_data_row.each(function (k, v) {
                                data.files.push($(v).data('pending-doc-id'));
                            });
                            data.meta_data.uploader = request_user;
                            data.meta_data.filename = $('#file_name').val();
                            data.meta_data.created_date = $('#created_date').val();
                            data.meta_data.expires_on = $('#expires_on').val();
                            data.meta_data.box_number = $('#box_number').val();
                            data.meta_data.shelf_number = $('#shelf_number').val();
                            data.meta_data.action_upon_expire = $('#action_upon_expire').val();
                            data.meta_data.tags = ($('#meta_tags').val() == null) ? '' : $('#meta_tags').val();
                            data.meta_data.DocumentType = $('#DocumentType').val();
                            data.meta_data.metas = [];
                            data.meta_data.metas_json = {};

                            /*let $all_meta_data_fields = $('.meta-data-gen-wrap input,.meta-data-gen-wrap select, .meta-data-gen-wrap .displayname');
                             if ($all_meta_data_fields.length > 0) {
                             $all_meta_data_fields.each(function (k,v) {
                             console.log(v);
                             $all_meta_data_fields.serializeArray().map(function (x) {
                             data.meta_data.metas[x.name] = x.value;
                             })
                             })
                             }*/

                            // $.each($('.meta-data-gen-wrap .fg-line'),function(k,v){
                            //     var $this = $(v);
                            //     var obj = {};
                            //     $this.find('input').serializeArray().map(function (x) {
                            //         obj[x.name] = x.value;
                            //     });
                            //     data.meta_data.metas.push(obj);
                            // });
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
                                    if (input.data('parsley-unique_meta') == "unique") {
                                        data.meta_data.metas_json[input.data('title')] = input.val();
                                    }
                                }
                                if (select.length > 0) {
                                    obj['name'] = select.attr('name');
                                    obj['value'] = select.val();
                                    obj['displayname'] = select.data('displayname');
                                    if (select.data('parsley-unique_meta') == "unique") {
                                        data.meta_data.metas_json[select.data('title')] = select.val();
                                    }
                                }
                                if (textarea.length > 0) {
                                    obj['name'] = textarea.attr('name');
                                    obj['value'] = textarea.val();
                                    obj['displayname'] = textarea.data('displayname');
                                    if (textarea.data('parsley-unique_meta') == "unique") {
                                        data.meta_data.metas_json[textarea.data('title')] = textarea.val();
                                    }
                                }
                                data.meta_data.metas.push(obj);
                            });
                        }

                        if (!data.files.length > 0) {
                            notify('No file added for metadata entry!', '', '', 'danger', '1000');
                            return;
                        }
                        if ($('#DocumentType').val() == '') {
                            notify('No document type selected!', '', '', 'danger', '1000');
                            return;
                        }

                        data = JSON.stringify(data);
                        $.ajax({
                            url: '/api/v1/dms/documents/attachmeta/',
                            method: 'POST',
                            data: data,
                            contentType: "application/json",
                            success: function (res) {
                                $('.meta-data-list-head, .meta-data-list-document-field, #move_all_btn').hide();
                                $('.table-empty').show();
                                $('.meta-data-list-document-field tbody').empty();
                                notify('Metadata attached successfully', '', '', 'success', '1000');
                            },
                            error: function (err) {
                                console.log(err);
                            }
                        });
                    }
                }, 500)

            }
            else {
                console.log('is not okay!');
            }

            // if (meta_data_form.isValid()) {
            //     let meta_data_form_again = $(this).parsley();
            //     meta_data_form_again.validate();
            //
            //
            // }
        });
//meta data form clear
        $('#add_meta_data').on('reset.pong', function () {
            $('#DocumentType, #action_upon_expire').val('').selectpicker('refresh');
            $('#meta_tags').val('').trigger('change');
            $metaGenWrap.empty();
            $('#add_meta_data').parsley().destroy();
        });


        /*on window resize, also resize,position the '.fixed_wrapper_for_doc_show'
         according to '.pending-meta-container' */
        $(window).on('resize', function () {
            if ($('.fixed_wrapper_for_doc_show').hasClass('shown')) {
                fixedWrapperShow();
                //using window ratio to determine the height of PDF
                if ($('#docView').length > 0) {
                    $('#docView').css({
                        height: window.innerHeight / 1.1741379310344828
                    });
                }
                console.log(window.innerHeight);
            }
        });

        //onclick remove all bttuon
        $(document).off('click.removeAllDocs').on('click.removeAllDocs', '.delete_all_pending_docs', function () {
            $.ajax({
                method: 'GET',
                url: delete_all_pendings,
                success: function (res) {
                    console.log('3');
                    $('.pending-meta-container').empty();
                    hidePaginationShowNothing();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        });
    }

    init();
}
