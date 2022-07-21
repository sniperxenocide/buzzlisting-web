/**
 * Created by mrityunjoy on 5/11/17.
 */
{
    $(function () {
        if ($("#n_po_vendor_name_").length > 0) {
            $("#n_po_vendor_name_").autocomplete({
                minLength: 3,
                delay: 0,
                appendTo: $("#non_po_add_form_"),
                // ajaxGetAll: { get: 'all' },
                source: function (request, response) {
                    $.ajax({
                        url: "/api/v1/workflow/vendor/",
                        dataType: "json",
                        data: {
                            q: request.term
                        },
                        success: function (data) {
                            // response(data);
                            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                            var a = $.grep(data, function (value) {
                                return matcher.test(value.label || value.name || value);
                            });
                            response(a);
                        }
                    });
                },
                focus: function (event, ui) {
                    $("#n_po_vendor_name_").val(ui.item.label);
                    return false;
                },
                select: function (event, ui) {
                    $("#n_po_vendor_name_").val(ui.item.name);
                    $('.n_po_line').addClass('fg-toggled');
                    $("#n_po_vendor_code_").val(ui.item.code);
                    // $("#n_po_I").val(ui.item.code);
                    return false;
                },
                open: function () {
                    setTimeout(function () {
                        $('.ui-autocomplete').css('z-index', 99999999999999);
                    }, 0);
                }
            })
                .data("ui-autocomplete")._renderItem = function (ul, item) {
                return $("<li>")
                    .data("ui-autocomplete-item", item)
                    .append("<a> " + item.name + "</a>")
                    .appendTo(ul);
            };
        }
    });
    $(function () {
        if ($("#po_vendor_name_").length > 0) {
            $("#po_vendor_name_").autocomplete({
                minLength: 3,
                delay: 0,
                appendTo: $("#po_add_form_"),
                // ajaxGetAll: { get: 'all' },
                source: function (request, response) {
                    $.ajax({
                        url: "/api/v1/workflow/vendor/",
                        dataType: "json",
                        data: {
                            q: request.term
                        },
                        success: function (data) {
                            // response(data);
                            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                            var a = $.grep(data, function (value) {
                                return matcher.test(value.label || value.name || value);
                            });
                            response(a);
                        }
                    });
                },
                focus: function (event, ui) {
                    $("#po_vendor_name_").val(ui.item.label);
                    return false;
                },
                select: function (event, ui) {
                    $("#po_vendor_name_").val(ui.item.name);
                    $('.po_line').addClass('fg-toggled');
                    $("#po_vendor_code_").val(ui.item.code);
                    // $("#n_po_I").val(ui.item.code);
                    return false;
                },
                open: function () {
                    setTimeout(function () {
                        $('.ui-autocomplete').css('z-index', 99999999999999);
                    }, 0);
                }
            })
                .data("ui-autocomplete")._renderItem = function (ul, item) {
                return $("<li>")
                    .data("ui-autocomplete-item", item)
                    .append("<a> " + item.name + "</a>")
                    .appendTo(ul);
            };
        }
    });

}