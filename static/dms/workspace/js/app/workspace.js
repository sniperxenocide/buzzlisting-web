{
    function init() {

        //categorization url
        let api_url = location.origin + '/api/v1/';
        let categorization_url = api_url + 'dms/categorization/';

        //main html where category, files will be appended
        let $mainHtml = $('.append_cat_files');

        //pagination request parameter for ajax request
        let param = {
            'start': 0,
            'length': 15,
            'draw': 1
        };


        // preloader
        function hidePreloader(){
            $('#preloader_wrap').hide();
        }

        function showPreloader(){
            $('#preloader_wrap').show();
        }
        // no data wrap
        function hideNodata(){
            $('.no-data-available').hide();
        }

        function showNodata(){
            $('.no-data-available').show();
        }

        //reset pagination
        function resetPagination() {
            $('#pagination').css({'display': 'none'});
            $('.show-paging-info').css({'display': 'none'});
            $('.page_number_input').val('1');

            //$('.goPaged').trigger('click.paginate');
        }
        resetPagination();

        //create pagination
        function createPagination(min, max, totalFiles) {
            if (totalFiles != undefined) {
                let $page_number_input = $('.page_number_input');
                let $show_page_number = $('.show-page-numb');
                let $total_pages = $('.total-pages');
                let $total_files = $('.total-files');
                let $showing_files = $('.showing-files');

                $page_number_input.val('1').attr({min: min, max: max});
                $show_page_number.text('1');
                //max == total page
                $total_pages.text(max);

                function generatePageFileNumbs(){
                    $show_page_number.text($page_number_input.val());
                    //show file start val = param.start
                    let fileShowingStart = param.start + 1;
                    let fileShowingLast = param.start + param.length;
                    //assign total files
                    $total_files.text(totalFiles);

                    if(fileShowingLast > $total_files.text()){
                        fileShowingLast = $total_files.text();
                    }
                    $showing_files.text(fileShowingStart + '-' + fileShowingLast);
                };
                generatePageFileNumbs();


                $('#pagination').css({'display': 'inline-flex'});
                $('.show-paging-info').css({'display': 'inline'});

                //on go button click fire and changer ajax request
                $('.goPaged').on('click.paginate', function() {
                    param.start = (Number($page_number_input.val()) - 1) * param.length;
                    generatePageFileNumbs();
                    //disable this button
                    $(this).attr('disabled','disabled');

                    $.ajax({
                        method: 'GET',
                        url: api_url + 'dms/documents/documentlist/',
                        data: param,
                        success: res => {
                            console.log('response length', res.data.length);
                            //empty main
                            $mainHtml.empty();

                            for (let i = 0; i < res.data.length; i++) {
                                //console.log('response', res.data[i]);
                                if (res.data[i].versions.length > 0) {
                                    console.log('response data id filename', res.data[i].id, res.data[i].filename);
                                    console.log('response version last', res.data[i].versions[0].id);
                                    res.data[i].vId = res.data[i].versions[0].id;
                                }
                                let template = doT.template($('#file-view-template').html());

                                if (res.data[i].extension == "application/pdf") {
                                    res.data[i].icon = 'file-pdf-o';
                                } else {
                                    res.data[i].icon = 'file-image-o';
                                }
                                console.log(res.data[i].extension);
                                $mainHtml.append(template(res.data[i]));
                            }
                            //enable all the disabled buttons
                            $('.next, .prev, .first, .last, .goPaged').removeAttr('disabled');
                        }
                    });
                    //disable current button
                    $(this).attr('disabled','disabled');
                });

                //trigger a click event on
                function goPagedTrigger() {
                    hidePreloader();
                    $('.goPaged').trigger('click.paginate');
                };
                //trigger when pagination create happens
                goPagedTrigger();

                //next button click event
                $(document).off('click.next').on('click.next', '.next', function(e) {
                    let pageNumber = Number($page_number_input.val());
                    console.log('pageNumber: ',pageNumber);

                    if (pageNumber < max) {
                        pageNumber++;
                        $page_number_input.val(pageNumber);
                        goPagedTrigger();
                    }
                    //disable current button
                    $(this).attr('disabled','disabled');
                });

                //previous button click event
                $(document).off('click.prev').on('click.prev', '.prev', function(e) {
                    let pageNumber = Number($page_number_input.val());
                    console.log('pageNumber: ',pageNumber);

                    if (pageNumber > min) {
                        pageNumber--;
                        $page_number_input.val(pageNumber);
                        goPagedTrigger();
                    }
                    //disable current button
                    $(this).attr('disabled','disabled');
                });
                //goto first page
                $(document).on('click.first', '.first', function(e) {
                    $page_number_input.val(min);
                    goPagedTrigger();

                    $(this).attr('disabled','disabled');
                });
                //goto last page
                $(document).on('click.last', '.last', function(e) {
                    $page_number_input.val(max);
                    goPagedTrigger();
                    //disable current button
                    $(this).attr('disabled','disabled');
                });

                /*$(document).on('keypress','.page_number_input', (e)=> {
                    if (e.which == 13) {
                        goPagedTrigger();
                    }
                });*/
            }
        }

        //number with min max let not be less/bigger
        $(document).on("change", ".numberBox", function() {
            var max = parseInt($(this).attr('max'));
            var min = parseInt($(this).attr('min'));
            if ($(this).val() > max) {
                $(this).val(max);
            }
            else if ($(this).val() < min) {
                $(this).val(min);
            }
        });

        //can only input numeric
        jQuery.fn.ForceNumericOnly =
        function () {
            return this.each(function () {
                $(this).keydown(function (e) {
                    var key = e.charCode || e.keyCode || 0;
                    // allow backspace, tab, delete, enter, arrows, numbers and keypad numbers ONLY
                    // home, end, period, and numpad decimal
                    return (
                    key == 8 ||
                    key == 9 ||
                    key == 13 ||
                    key == 46 ||
                    (key >= 35 && key <= 40) ||
                    (key >= 48 && key <= 57) ||
                    (key >= 96 && key <= 105));
                });
            });
        };
        $('.numberBox').ForceNumericOnly();

        //load view on ajax on document load
        $.ajax({
            url: categorization_url + 'root/',
            method: 'GET',
            success: data => {

                $mainHtml.html('');
                hidePreloader();

                $.each(data, (k, v)=> {
                    v.root = (v.parent == null) ? 'Yes' : 'No';

                    let template;
                    if (v.type == 'cat' || v.type == 'doc') {

                        template = doT.template($('#folder-view-template').html());
                    }
                    $mainHtml.append(template(v));
                });
            }
        });

        //-----------folder double click-----------
        $(document).on('dblclick', '.folder-thumb', function() {
            let $this = $(this);
            let info = new Function("return" + $($this).data('info'))();
            let id = info.self;

            $mainHtml.html('');
            showPreloader(100);

            //resetting pagination
            resetPagination();

            $.ajax({
                url: categorization_url + 'category/' + id,
                method: 'GET',
                success: res => {

                    hidePreloader();
                    $mainHtml.html('');
                    //console.log('success: ',res);
                    //back button
                    $('#back_button').data({'href': info.self, 'parent': res.name}).show();

                    console.log('res.children: ', res.children.length);
                    //if has any children
                    let template;
                    let parent = res.id;
                    if (res.children.length > 0) {
                        $.each(res.children, (k, v)=> {
                            v.parent = parent;
                            //console.log('res.children: ', res.children);

                            //console.log(v.type.toLowerCase());

                            /*if (v.published == true) {*/
                                template = doT.template($('#folder-view-template').html());
                                $mainHtml.append(template(v));
                            /*}*/
                        });
                    } else {
                        if (res.type == 'doc') {
                            param['doc_id'] = res.id;
                            console.log('doc_id', param['doc_id']);
                            $.ajax({
                                method: 'GET',
                                url: api_url + 'dms/documents/documentlist/',
                                data: param,
                                success: res => {
                                    console.log(res.data);

                                    if(res.data.length > 0){
                                        hideNodata();

                                        console.log('response length', res.data.length);
                                        //get total pages
                                        let totalPages = Math.ceil(res.recordsTotal / param.length);

                                        //create pagination
                                        createPagination(1, totalPages, res.recordsTotal);
                                        for (let i = 0; i < res.data.length; i++) {
                                            //console.log('response', res.data[i]);
                                            if (res.data[i].versions.length > 0) {
                                                console.log('response data id filename', res.data[i].id, res.data[i].name);
                                                console.log('response version last', res.data[i].versions[0].id);
                                                res.data[i].vId = res.data[i].versions[0].id;
                                            }
                                            let template = doT.template($('#file-view-template').html());
                                            if(res.data[i].extension == "application/pdf"){
                                                res.data[i].icon = 'file-pdf-o';
                                            }else{
                                                res.data[i].icon = 'file-image-o';
                                            }
                                            $mainHtml.append(template(res.data[i]));
                                        }
                                    }else{
                                        showNodata();
                                    }

                                },
                                error: error => {
                                    console.log(error);
                                }
                            });
                        }
                        else{
                            //empty category
                            $mainHtml.append('<div style="text-align:center;">Sorry, No data available.</div>');
                        }
                    }
                }
            });
        });

        //-----------top back button on click-----------
        $(document).on('click', '#back_button', function() {
            var $this = $(this);
            var href = $this.data('href');
            console.log(href);

            //resetting pagination
            resetPagination();
            $mainHtml.html('');
            showPreloader(100);
            showNodata();

            $.ajax({
                url: categorization_url + 'siblings/' + href,
                method: 'GET',
                success: res => {
                    $mainHtml.html('');
                    hidePreloader();
                    hideNodata();

                    //back button
                    if (res.parent != null) {
                        $('#back_button').data('href', res.parent).show();
                    } else {
                        $('#back_button').data('href', '').hide();
                    }

                    if (res.siblings != undefined) {
                        //if has any children
                        if (res.siblings.length > 0) {
                            let parent = res.parent;

                            $.each(res.siblings, function (k, v) {
                                v.parent = parent;
                                let template;
                                if (v.type.toLowerCase() == 'cat') {
                                    template = doT.template($('#folder-view-template').html());
                                    console.log('folder', template);
                                }
                                else if(v.type == 'doc'){
                                    if (v.published == true) {
                                        template = doT.template($('#folder-view-template').html());
                                        console.log('folder', template);
                                    }
                                }
                                else {
                                    //if (v.published == true) {
                                        template = doT.template($('#file-view-template').html());

                                        if (res.data[i].extension == "application/pdf") {
                                            res.data[i].icon = 'file-pdf-o';
                                        } else {
                                            res.data[i].icon = 'file-image-o';
                                        }
                                        console.log('files', template);
                                    //}
                                }
                                console.log(template);
                                console.log(v);
                                $mainHtml.append(template(v));
                            });
                        }
                    }

                }
            });
        });

        $(document).on('click', '.quick_view_button', function (e) {
            e.preventDefault();
            var $this = $(this);
            var fileThumb = $this.closest('.file-thumb');
            var fileId = fileThumb.data('file-id');
            var title = fileThumb.find('.c-info strong').text();
            $('#viewFiles').find('.modal-title').text(title);

            console.log(fileThumb.data('extension'))

            if (fileThumb.data('extension') == "application/pdf") {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: location.origin + '/api/v1/dms/documents/documentpreview/' + fileId,
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
            else {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: location.origin + '/api/v1/dms/documents/documentpreview/' + fileId,
                    success: function (res) {
                        let fileUrl = res;
                        console.log('imageURL ' + fileUrl);
                        $('#viewFiles #file_container').html('<img width="100%" src="' + fileUrl + '" align="' + title + '"/>');
                    }
                });

            }
            $('#viewFiles').modal('show');
        });

    }

    init();
}