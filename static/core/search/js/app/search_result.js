/**
 * Created by mrityunjoy on 2/8/17.
 */
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

    let template,
        $search_history_content = $("#search_history_content"),
        $next = $("#next"),
        $previous = $("#previous"),
        $paging = $("#paging"),
        api_url = location.host + '/api/v1/dms/';

    let param = {
        'start': 0,
        'length': 10,
        'draw': 1
    };

    //-----------List onclick events------
    $(document).on('click', '.search_list', function () {
        let info = $(this).data('info');
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            $('.search_list.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    //-----------Search List-------------

    $.ajax({
        /*url: 'http://' + api_url + 'categorization/root',*/
        url: search_result_url,
        method: 'GET',
        dataType: "json",
        data: param,
        success: function (data) {
            let $totalPages = Math.ceil(data.recordsTotal / param.length);
            console.log($totalPages);
            for (let i = 1; i <= $totalPages; i++) {
                $paging.append("<li><a href='#' class='page_num' data-num=" + i + ">" + i + "</a></li>");
            }
            $paging.find('li:nth-child(1)').addClass("active");
            $.each(data.data, function (key, value) {
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
                template = doT.template($('#search_list').html());
                $search_history_content.append(template(value));
            })
        }
    });
    $(document).on('click', '.page_num', function () {
        let page = $(this).data('num');
        let start_new = (page - 1) * param.length;
        if ($paging.find('li').hasClass('active')) {
            $paging.find('li').removeClass('active');
        }
        $(this).closest('li').addClass('active');
        param = {
            'start': start_new,
            'length': 10,
            'draw': 1
        };
        $.ajax({
            /*url: 'http://' + api_url + 'categorization/root',*/
            url: search_result_url,
            method: 'GET',
            datatype: "json",
            data: param,
            success: function (data) {
                $.each(data.data, function (key, value) {
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
                    template = doT.template($('#search_list').html());
                    $search_history_content.append(template(value));
                })
            }
        });
    });
    //---------Next btn Pagination----------
    /*$next.on('click', function () {
     $previous.removeClass("disabled_li");
     let start_new = parseInt(param.start) + parseInt(param.length);

     param = {
     'start': start_new,
     'length': 1,
     'draw': 1
     };
     $.ajax({
     url: 'http://' + api_url + 'categorization/root',
     method: 'GET',
     datatype: "json",
     data: param,
     success: function (data) {
     if (data.recordsTotal == param.start + data.data.length) {
     $next.addClass("disabled_li");
     }
     let page_number = Math.ceil(param.start / param.length) + 1;
     console.log(page_number);
     $("#page_number").empty().append("<a href='#'>"+ page_number +"</a>");
     }
     })
     });*/

    //------------Previous button on click------------
    /*$previous.on("click", function () {
     $next.removeClass("disabled_li");
     if (param.start - param.length == 0) {
     $previous.addClass("disabled_li");
     }
     let start_new = parseInt(param.start) - parseInt(param.length);
     param = {
     'start': start_new,
     'length': 1,
     'draw': 1
     };
     $.ajax({
     url: 'http://' + api_url + 'categorization/root',
     method: 'GET',
     datatype: "json",
     data: param,
     success: function (data) {
     let page_number = Math.ceil(param.start / param.length) + 1;
     console.log(page_number);
     $("#page_number").empty().append("<a href='#'>"+ page_number +"</a>");
     }
     });
     });*/
}