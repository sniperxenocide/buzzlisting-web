/**
 * Created by asif on 3/23/17.
 */
{
    let init = function () {
        let jstree_api = location.origin + '/api/v1/dms/categorization/jstreeroot/';

        let category_api = location.origin + '/api/v1/dms/categorization/jstreecategory/';
        let file_api = location.origin + '/api/v1/dms/documents/documentlist/';

        let $mainWindow = $('#explorer #main-window');
        let $pagination = $('#paginate_explorer');
        let defaultOpts = {};

        $('#explorer').hide();
        $('#nothing').hide();

        //load and build js tree
        $.ajax({
            method: "GET",
            url: jstree_api,
            success: function (res) {
                //console.log(res);

                $('#left').jstree({
                    'core': {
                        'data': res
                    },
                    "types": {
                        "#": {
                            "max_children": 1,
                            "valid_children": ["root"]
                        },
                        "root": {
                            "icon": "fa fa-tree",
                            "valid_children": ["cat", "doc"]
                        },
                        "doc": {
                            "icon": "fa fa-leaf",
                            "valid_children": ["cat", "doc"]
                        },
                        "default": {
                            "valid_children": ["cat", "doc"]
                        },
                    },
                    "plugins": ["types"]
                });

                //check if jstree exists
                if ($('#explorer').find('.jstree-container-ul').length > 0) {
                    $('#explorer').show();
                    $('#nothing').hide();
                } else {
                    $('#explorer').hide();
                    $('#nothing').show();
                }
            },
            error: function (err) {
                console.log(err);
            }
        });

        //jstree
        $('#left').on('changed.jstree', function (e, data) {
            console.log(data);
            let selectedItem = data.selected;
            $mainWindow.empty();
            //selected item if exists
            if (selectedItem.length) {
                $(selectedItem).each(function (k) {
                    let item = data.instance.get_node(selectedItem[k]);
                    let id = item.id;
                    let type = item.original.type;
                    if (type == 'cat' || type == 'root') {
                        //hide pagination
                        $pagination.hide();

                        $.ajax({
                            method: 'GET',
                            url: category_api + '?id=' + id,
                            success: function (res) {

                                if (res.length > 0) {
                                    //empty main
                                    $mainWindow.empty();

                                    //console.log(res);
                                    let parent = res.id;

                                    $.each(res, (k, v) => {
                                        v.parent = parent;
                                        v.root = (v.parent == null) ? 'Yes' : 'No';
                                        //console.log(v);

                                        let template;
                                        if (v.type == 'cat' || v.type == 'doc') {

                                            template = doT.template($('#folder-view-template').html());
                                        }
                                        $mainWindow.append(template(v));
                                    });

                                } else {
                                    $mainWindow.append('<div class="no-files-to-show text-center">No category/document type found.</div>');
                                }
                            }
                        });
                    }
                    else if (type == 'doc') {
                        //aajax param
                        let param = {
                            'doc_id': id,
                            'start': 0,
                            'length': 10,
                            'draw': 1
                        };

                        $.ajax({
                            method: 'GET',
                            url: file_api,
                            data: param,
                            success: res => {
                                //console.log(res.data);

                                if (res.data.length > 0) {
                                    //show pagination
                                    $pagination.show();
                                    //hide no data text

                                    console.log('response length', res.data.length);
                                    //get total pages
                                    let totalPages = Math.ceil(res.recordsTotal / param.length);
                                    defaultOpts.totalPages = totalPages;

                                    let currentPage = $pagination.twbsPagination('getCurrentPage');

                                    $pagination.twbsPagination('destroy');
                                    if (totalPages > 0) {
                                        //generate pagination
                                        $pagination.twbsPagination($.extend({}, defaultOpts, {
                                            startPage: currentPage,
                                            totalPages: totalPages,
                                            visiblePages: 3,
                                            initiateStartPageClick: false,
                                            first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                                            prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                                            next: '<span> <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                                            last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                                            onPageClick: function (event, page) {
                                                param.start = (page - 1) * param.length;

                                                console.log(param.start);
                                                $.ajax({
                                                    method: 'GET',
                                                    url: file_api,
                                                    data: param,
                                                    success: function (res) {
                                                        //console.log(res);
                                                        getPagedData(res);
                                                    }
                                                });
                                            }
                                        }));
                                    }


                                    function getPagedData(res) {
                                        //empty main
                                        $mainWindow.empty();
                                        for (let i = 0; i < res.data.length; i++) {
                                            //console.log('response', res.data[i]);
                                            if (res.data[i].versions.length > 0) {
                                                //console.log('response data id filename', res.data[i].id, res.data[i].name);
                                                //console.log('response version last', res.data[i].versions[0].id);
                                                res.data[i].vId = res.data[i].versions[0].id;
                                            }
                                            let template = doT.template($('#file-view-template').html());
                                            if (res.data[i].extension == "application/pdf") {
                                                res.data[i].icon = 'file-pdf-o';
                                            } else {
                                                res.data[i].icon = 'file-image-o';
                                            }
                                            //console.log('for showing thumbnail',res.data[i]);
                                            $mainWindow.append(template(res.data[i]));
                                        }
                                    }

                                    getPagedData(res);

                                } else {
                                    //show no data text
                                    $mainWindow.append('<div class="no-files-to-show text-center">No file found.</div>');
                                    //hide pagination
                                    $pagination.hide();
                                }

                            },
                            error: error => {
                                console.log(error);
                            }
                        });
                    }
                })
            }
        });
        //quick view
        var explorer_csv_gen2 = function ($selector, fp) {
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
        var explorerCsvToHtml = function ($selector, $file_path, $number_files) {
            var filePath = $file_path,
                page_ext = "_x_p_c";
            var folder = filePath.substring(filePath.lastIndexOf("/") + 1);
            $('#explorer_doc_pagination').css('display', 'block');
            if (filePath.endsWith('.xls')) {
                filePath = filePath.replace('/tempfiles', '').replace('.xls', '') + "/" + folder.replace('.xls', '').split(' ').join('_') + page_ext + "1.csv";
                explorer_csv_gen($selector, filePath);
            } else if (filePath.endsWith('.xlsx')) {
                filePath = filePath.replace('/tempfiles', '').replace('.xlsx', '') + "/" + folder.replace('.xlsx', '').split(' ').join('_') + page_ext + "1.csv";
                explorer_csv_gen($selector, filePath);
                // filePath = filePath.substr(0, filePath.lastIndexOf(".")) + ".csv";
            }
            $('#explorer_doc_pagination').twbsPagination({
                totalPages: $number_files,
                visiblePages: 7,
                first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                next: '<span>  <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                onPageClick: function (event, page) {
                    var f_path = filePath.replace('/tempfiles', '').replace('.xlsx', '').replace('_x_p_c1.csv', '') + page_ext + page + ".csv";
                    $('.explorer-doc-preview').empty();
                    explorer_csv_gen2('.explorer-doc-preview', f_path);
                }
            });
            //'/media/repository/2017-07-31/556b10fc422946517bb6b889cefcfd8d.csv'
        };
        var explorer_csv_gen = function ($selector, fp) {
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
                    .append("td").attr({class: 'preview-tr'})
                    .text(function (d) {
                        return d;
                    });
            });
        };
        $(document).on('click', '.quick_view', function (e) {
            e.preventDefault();
            let $this = $(this);
            let fileThumb = $this.closest('.file-thumb');
            let fileId = fileThumb.data('file-id');
            let title = fileThumb.find('.c-info strong').text();
            $('#viewFiles').find('.modal-title').text(title);
            let fileUrl;
            console.log(fileThumb.data('extension'));

            if (fileThumb.data('extension') == "application/pdf") {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: location.origin + '/api/v1/dms/documents/documentpreview/' + fileId,
                    success: function (res) {
                        fileUrl = res;
                        console.log('pdfURL ' + fileUrl);

                        //viewer js container

                        //using window ratio to determine the height of PDF
                        $('#viewFiles #file_container').html('<iframe id="docView" ' +
                            'data-printurl="' + fileUrl + '"' +
                            'src="/dms/document/pdf_view#' + fileUrl + '"' +
                            'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                    },
                    error: function (response) {
                        console.log(response);
                    }

                });
                $('#viewFiles').modal('show');
            }
            else if (fileThumb.data('extension') == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileThumb.data('extension') == 'application/pdf') {
                $.ajax({
                    method: 'GET',
                    url: location.origin + '/api/v1/dms/documents/documentpreview/' + fileId,
                    success: function (res) {
                        let fileUrls = res;
                        fileUrl = fileUrls.substr(0, fileUrls.lastIndexOf(".")) + ".pdf";
                        console.log('imageURL ' + fileUrl.substr(0, fileUrl.lastIndexOf(".")) + ".pdf");
                        $('#viewFiles #file_container').html('<iframe id="docView" ' +
                            'data-printurl="' + fileUrl + '"' +
                            'src="/dms/document/pdf_view#' + fileUrl + '"' +
                            'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" allowfullscreen webkitallowfullscreen></iframe>');
                    }
                });
                $('#viewFiles').modal('show');
            }
            else if (fileThumb.data('extension') == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                $('#explorer_doc_pagination').show();
                $.ajax({
                    url: '/api/v1/dms/documents/version_preview/?doc_id=' + fileId,
                    method: 'GET',
                    success: function (res) {
                        let filePath = res.filepath,
                            number_files = res.number_files;
                        explorerCsvToHtml($('.explorer-doc-preview'), filePath, number_files);
                    }
                });
                $('#explorer_excel_ViewModal').modal('show');
            }
            else {
                //load file url from ajax
                $.ajax({
                    method: 'GET',
                    url: location.origin + '/api/v1/dms/documents/documentpreview/' + fileId,
                    success: function (res) {
                        fileUrl = res;
                        console.log('imageURL ' + fileUrl);
                        $('#viewFiles #file_container').html('<img width="100%" src="' + fileUrl + '" align="' + title + '"/>');
                    }
                });
                $('#viewFiles').modal('show');
            }

        });
        $(document).on('dblclick', '.folder-thumb', function (e) {
            $mainWindow.empty();
            let type = $(this).data('type'), id = $(this).data('cat-id');
            if (type == 'cat' || type == 'root') {
                //hide pagination
                $pagination.hide();

                $.ajax({
                    method: 'GET',
                    url: category_api + '?id=' + id,
                    success: function (res) {

                        if (res.length > 0) {
                            //empty main
                            $mainWindow.empty();

                            //console.log(res);
                            let parent = res.id;

                            $.each(res, (k, v) => {
                                v.parent = parent;
                                v.root = (v.parent == null) ? 'Yes' : 'No';
                                //console.log(v);

                                let template;
                                if (v.type == 'cat' || v.type == 'doc') {

                                    template = doT.template($('#folder-view-template').html());
                                }
                                $mainWindow.append(template(v));
                            });

                        } else {
                            $mainWindow.append('<div class="no-files-to-show text-center">No category/document type found.</div>');
                        }
                    }
                });
            }
            else if (type == 'doc') {
                //aajax param
                let param = {
                    'doc_id': id,
                    'start': 0,
                    'length': 10,
                    'draw': 1
                };

                $.ajax({
                    method: 'GET',
                    url: file_api,
                    data: param,
                    success: res => {
                        console.log("r", res);

                        if (res.data.length > 0) {
                            //show pagination
                            $pagination.show();
                            //hide no data text

                            console.log('response length', res.data.length);
                            //get total pages
                            let totalPages = Math.ceil(res.recordsTotal / param.length);
                            defaultOpts.totalPages = totalPages;

                            let currentPage = $pagination.twbsPagination('getCurrentPage');

                            $pagination.twbsPagination('destroy');
                            if (totalPages > 0) {
                                //generate pagination
                                $pagination.twbsPagination($.extend({}, defaultOpts, {
                                    startPage: currentPage,
                                    totalPages: totalPages,
                                    visiblePages: 3,
                                    initiateStartPageClick: false,
                                    first: '<span> <i class="ace-icon fa fa-angle-double-left bigger-140"></i> </span>',
                                    prev: '<span> <i class="ace-icon fa fa-angle-left bigger-150"></i></i></span>',
                                    next: '<span> <i class="ace-icon fa fa-angle-right bigger-150"></i></i></span>',
                                    last: '<span> <i class="ace-icon fa fa-angle-double-right bigger-140"></i></span>',
                                    onPageClick: function (event, page) {
                                        param.start = (page - 1) * param.length;
                                        $.ajax({
                                            method: 'GET',
                                            url: file_api,
                                            data: param,
                                            success: function (res) {
                                                //console.log(res);
                                                getPagedData(res);
                                            }
                                        });
                                    }
                                }));
                            }


                            function getPagedData(res) {
                                //empty main
                                $mainWindow.empty();
                                for (let i = 0; i < res.data.length; i++) {
                                    //console.log('response', res.data[i]);
                                    if (res.data[i].versions.length > 0) {
                                        //console.log('response data id filename', res.data[i].id, res.data[i].name);
                                        //console.log('response version last', res.data[i].versions[0].id);
                                        res.data[i].vId = res.data[i].versions[0].id;
                                    }
                                    let template = doT.template($('#file-view-template').html());
                                    if (res.data[i].extension == "application/pdf") {
                                        res.data[i].icon = 'file-pdf-o';
                                    } else {
                                        res.data[i].icon = 'file-image-o';
                                    }
                                    //console.log('for showing thumbnail',res.data[i]);
                                    $mainWindow.append(template(res.data[i]));
                                }
                            }

                            getPagedData(res);

                        } else {
                            //show no data text
                            $mainWindow.append('<div class="no-files-to-show text-center">No file found.</div>');
                            //hide pagination
                            $pagination.hide();
                        }

                    },
                    error: error => {
                        console.log(error);
                    }
                });
            }
        });
    };
    init();
}