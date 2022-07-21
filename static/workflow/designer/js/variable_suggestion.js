/**
 * Created by rawnak on 12/4/17.
 */

var $element = $('#inner_container').find('input');
$element.autocomplete({
    minLength: 1,
    source: function (request, response) {
        $.ajax({
            url: "/api/v1/workflow/query_variable/?project=1",
            dataType: "json",
            method: 'GET',
            success: function (data) {
                var term = request.term;

                if (term.indexOf(', ') > 0) {
                    var index = term.lastIndexOf(', ');
                    term = term.substring(index + 2);
                }

                var re = $.ui.autocomplete.escapeRegex(term);
                var matcher = new RegExp('^' + re, 'i');
                var regex_validated_array = $.grep(data, function (item, index) {
                    return matcher.test(item);
                });

                response(regex_validated_array,
                    extractLast(term));
            }
        })
    },
    focus: function () {
        return false;
    },
    select: function (event, ui) {
        var terms = split(this.value);
        terms.pop();
        terms.push(ui.item);
        terms.push('');
        this.value = terms.join(', ');
        return false;
    }
})
    .data("ui-autocomplete")._renderItem = function (ul, item) {
    return $("<li>")
        .data("ui-autocomplete-item", item)
        .append("<a>" + item + "</a>")
        .appendTo(ul);
};

function split(val) {
    return val.split(/,\s*/);
}

function extractLast(term) {
    return split(term).pop();
}


// $(function () {
//
//     function split(val) {
//         return val.split(/,\s*/);
//     }
//
//     function extractLast(term) {
//         return split(term).pop();
//     }
//
//     $("#marico_mail_cc")
//         .autocomplete({
//             minLength: 1,
//             delay: 0,
//             source: function (request, response) {
//                 $.ajax({
//                     url: "/api/v1/user/",
//                     dataType: "json",
//                     method: 'GET',
//                     success: function (data) {
//                         var term = request.term;
//
//                         // substring of new string (only when a comma is in string)
//                         if (term.indexOf(', ') > 0) {
//                             var index = term.lastIndexOf(', ');
//                             term = term.substring(index + 2);
//                         }
//
//                         // regex to match string entered with start of suggestion strings
//                         var re = $.ui.autocomplete.escapeRegex(term);
//                         var matcher = new RegExp('^' + re, 'i');
//                         var regex_validated_array = $.grep(data, function (item, index) {
//                             return matcher.test(item.first_name);
//                         });
//                         // pass array `regex_validated_array ` to the response and
//                         // `extractLast()` which takes care of the comma separation
//
//                         response($.ui.autocomplete.filter(regex_validated_array,
//                             extractLast(term)));
//                     }
//                 });
//                 // response($.ui.autocomplete.filter(
//                 //     items, extractLast(request.term)));
//             },
//             focus: function () {
//                 return false;
//             },
//             select: function (event, ui) {
//                 console.log(ui.item);
//                 var terms = split(this.value);
//                 terms.pop();
//                 terms.push(ui.item.value);
//                 terms.push('');
//                 this.value = terms.join(', ');
//                 return false;
//             }
//         })
//         .data("ui-autocomplete")._renderItem = function (ul, item) {
//         return $("<li>")
//             .data("ui-autocomplete-item", item.first_name)
//             .append("<a> " + item.first_name + "</a>")
//             .appendTo(ul);
//     };
// });
// $(function () {
//     var items = ['France', 'Italy', 'Malta', 'England',
//         'Australia', 'Spain', 'Scotland'];
//
//     function split(val) {
//         return val.split(/,\s*/);
//     }
//
//     function extractLast(term) {
//         return split(term).pop();
//     }
//
//     $("#marico_mail_cc")
//         .autocomplete({
//             minLength: 1,
//             delay: 0,
//             source: function (request, response) {
//                 response($.ui.autocomplete.filter(
//                     items, extractLast(request.term)));
//             },
//             focus: function () {
//                 return false;
//             },
//             select: function (event, ui) {
//                 var terms = split(this.value);
//                 // remove the current input
//                 terms.pop();
//                 // add the selected item
//                 terms.push(ui.item.value);
//                 // add placeholder to get the comma-and-space at the end
//                 terms.push("");
//                 this.value = terms.join(", ");
//                 return false;
//             }
//         })
//         .data("ui-autocomplete")._renderItem = function (ul, item) {
//         return $("<li>")
//             .data("ui-autocomplete-item", item)
//             .append("<a> " + item.value + "</a>")
//             .appendTo(ul);
//     };
// })