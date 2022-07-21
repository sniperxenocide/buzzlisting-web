{
    let $save_name = $('#save_search_name'),
        $search_name = $('#search_name'),
        $name_search_modal = $('#name_search'),
        $save_search = $('#save_searchsave_search'),
        $dms_search_form = $('#dms_search_form'),
        $selectpicker = $('.selectpicker'),
        $saved_search_btn = $('#saved_search'),
        $saved_search_modal = $('#seved_search_modal'),
        $saved_search_loop = 0,
        saved_search_metafield,
        saved_doctype_id,
        $saved_dataType = ['String', 'Integer', 'TextArea', 'DropDown', 'Date', 'Float'],
        data = {};
    var Operations = {
        get_data: () => {
            $(document).on('dblclick', '.saved_tr', function (e) {
                e.preventDefault();
                // $("#seved_search_modal .close").click();
                $saved_search_modal.modal('hide');
                $('body').removeClass('modal-open');
                setTimeout(function () {
                    $(document).find('.modal-backdrop').remove();
                }, 100);
                let id = $(this).data('id');
                let url = '/api/v1/dms/documents/save_search/' + id;
                var modal = $('#dms-search-content').modal({
                    keyboard: true,
                    backdrop: true,
                    show: true
                });
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function (res) {
                        $.each(res, function (k, v) {
                            switch (k) {
                                case 'docName':
                                    modal.find('#docname').val(v);
                                    break;
                                case 'doccreated':
                                    modal.find('input#doccreated').val(v);
                                    $('input#doccreated').data("DateTimePicker").maxDate(moment());
                                    break;
                                case 'docexpired':
                                    if (v == null) {
                                        modal.find('input#docexpired').val('');
                                    }
                                    modal.find('input#docexpired').val(v).datetimepicker({
                                        format: 'YYYY-MM-DD',
                                        minDate: moment(),
                                        useCurrent: false
                                    });
                                    break;
                                case 'tags':
                                    var tags = $.parseJSON(v);
                                    var select_t = modal.find('select#search_tags');
                                    select_t.empty();
                                    $.each(tags, function (t, tag) {
                                        select_t.append($("<option>", {value: tag, html: tag, selected: true}));
                                    });
                                    select_t.select2({
                                        tags: true,
                                        tokenSeparators: [',', ' ']
                                    });
                                    break;
                                case 'DocumentType':
                                    var select = modal.find('select#documentType');
                                    saved_doctype_id = v;
                                    select.selectpicker('val', v);
                                    select.selectpicker('render');
                                    select.selectpicker('refresh');
                                    break;
                                case 'box_number':
                                    modal.find('#search_box_number').val(v);
                                    break;
                                case 'shelf_number':
                                    modal.find('#search_shelf_number').val(v);
                                    break;
                                case 'metadata':
                                    $.ajax({
                                        url: '/api/v1/dms/categorization/metafield/?doc_id=' + saved_doctype_id,
                                        method: 'GET',
                                        success: function (res) {
                                            saved_search_metafield = res;
                                            var mData = $.parseJSON(v);
                                            var $search_metaGenWrap = $('.meta-data-wrap');
                                            $search_metaGenWrap.empty();
                                            $.each(saved_search_metafield, function (k, v) {
                                                $.each(mData, function (index, value) {
                                                    if (v.title === value.name) {
                                                        v.value = value.value;
                                                    }
                                                });
                                                let template;
                                                switch (v.data_type) {
                                                    case 0:
                                                        template = doT.template($('#save_string_input').html());
                                                        $search_metaGenWrap.append(template(v));
                                                        break;
                                                    case 1:
                                                        template = doT.template($('#save_integer_input').html());
                                                        $search_metaGenWrap.append(template(v));
                                                        break;
                                                    case 2:
                                                        template = doT.template($('#save_textArea_input').html());
                                                        $search_metaGenWrap.append(template(v));
                                                        break;
                                                    case 3:
                                                        template = doT.template($('#save_dropDown_input').html());
                                                        v.options = v.default_text.split("\n");
                                                        $search_metaGenWrap.append(template(v));
                                                        $('.selectpicker').selectpicker();
                                                        break;
                                                    case 4:
                                                        template = doT.template($('#save_date_input').html());
                                                        $search_metaGenWrap.append(template(v));
                                                        $('.date-time-picker').datetimepicker({format: 'YYYY-MM-DD'});
                                                        break;
                                                    case 5:
                                                        template = doT.template($('#save_string_input').html());
                                                        $search_metaGenWrap.append(template(v));
                                                        break;
                                                    default:
                                                        $search_metaGenWrap.empty();
                                                        break;
                                                }
                                            });
                                        }
                                    });
                                    break;
                                case 'archived':
                                    if (v === true) {
                                        modal.find('input#include_archive').prop("checked", true);
                                    } else {
                                        modal.find('input#include_archive').prop("checked", false);
                                    }
                                    break;
                                case 'match':
                                    if (v === true) {
                                        modal.find('input#match_all').prop("checked", true);
                                    } else {
                                        modal.find('input#match_all').prop("checked", false);
                                    }
                                    break;
                            }
                        });
                    }
                })
            })
        }
    };
    var SaveSearch = {
        name_search: () => {
            $save_name.on('click', function (e) {
                e.preventDefault();
                let $form = $("form#dms_search_form :input");
                let count = [];
                $.each($form.serializeArray(), function (k, v) {
                    if(v.name !== "csrfmiddlewaretoken"){
                        if(v.name === "DocumentType"){
                            if(v.value !== "0"){
                                count.push("DocumentType");
                            }
                        }else{
                            if(v.value !== ""){
                                count.push(v.name)
                            }
                        }
                    }
                });
                if (count.length) {
                    $search_name.val('');
                    $name_search_modal.modal();
                } else {
                    notify('', 'Please fill up at least one field', '', 'danger', 8000);
                    return false
                }
            });
        },
        save_search: () => {
            $(document).on('click', '#save_search', function (e) {
                e.preventDefault();
                data.archived = $('#include_archive').prop('checked');
                data.match = $('#match_all').prop('checked');
                data.search_name = $search_name.val();
                data.box_number = $('#search_box_number').val();
                data.shelf_number = $('#search_shelf_number').val();
                var tmp = $dms_search_form.find('.doc_data input, .doc_data select').serializeArray();
                $.each(tmp, function (key, val) {
                    let value = val.value === '' ? null : val.value;
                    data[val.name] = value;
                });
                data.user = userId;
                data.tags = ($('#search_tags').val() == null) ? '' : $('#search_tags').val();
                let metadata = [];
                $.each($('.meta-data-wrap .fg-line'), function (k, v) {
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
                    metadata.push(obj);
                });
                if (metadata.length <= 0) {
                    data.metadata = '';
                } else {
                    data.metadata = metadata;
                }
                let save_search_url = '/api/v1/dms/documents/save_search/';
                $name_search_modal.modal('hide');
                $.ajax({
                    url: save_search_url,
                    method: 'POST',
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    success: (data) => {
                        notify('', 'Search data saved successfully', '', 'success', 5000);
                    },
                    error: (data) => {
                        $.each(JSON.parse(data.responseText), function (key, value) {
                            var nMessage = value;
                            notify('', '' + nMessage, '', 'danger', '5000');
                        });
                    }
                });
            });
        },
        saved_search: () => {
            $saved_search_btn.on('click', function (e) {
                e.preventDefault();
                $saved_search_modal.modal();
                let $savedpagination = $("#saved_search_pagination");
                $savedpagination.twbsPagination();
                let defaultOpts = {
                    totalPages: 5,
                    visiblePages: 5,
                };
                let saved_search_url = '/api/v1/dms/documents/save_search/';
                $.ajax({
                    url: saved_search_url,
                    method: 'GET',
                    success: function (res) {
                        if (res.length > 0) {
                            $('.save_search_table').show();
                            $('.save_search_no_data').hide();
                            let html = '';
                            $.each(res, function (k, v) {
                                let created_at = moment(v.created_at).format('DD-MM-YYYY');
                                html += `<tr class="saved_tr" data-id="${v.id}">
                                <td>${v.search_name}</td>
                                    <td>${created_at}</td>
                                    <td data-id="${v.id}" align="center"><button class="btn btn-danger waves-effect delete_save_search" data-id="${v.id}"><i class="zmdi zmdi-delete"></i></button></i></td>
                            </tr>`
                            });
                            $('.saved_search_tbody').empty().append(html);
                        }
                        else {
                            $('.save_search_table').hide();
                            $('.save_search_no_data').show();
                        }
                    },
                    error: function (res) {
                        $.each(JSON.parse(res.responseText), function (key, value) {
                            var nMessage = value;
                            notify('', '' + nMessage, '', 'danger', '5000');
                        });
                    }
                })
            })
        },
        delete_save_search: () => {
            $(document).on('click', '.delete_save_search', function (e) {
                e.stopPropagation();
                e.preventDefault();
                let $this = $(this);
                let url_id = $(this).data('id');
                swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this information!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                }).then(function () {
                    $.ajax({
                        type: "DELETE",
                        url: '/api/v1/dms/documents/save_search/' + url_id,
                        data: "csrfmiddlewaretoken=" + getCookie("csrftoken"),
                        success: function (res) {
                            $this.closest('tr').empty();
                            notify('', 'Search Deleted successfully', '', 'danger', 5000);
                        }
                        ,
                        error: function (response) {
                            var errors = response.responseText;
                            $.each(JSON.parse(errors), function (key, value) {
                                var nMessage = value;
                                notify('', nMessage, '', 'danger');
                            });
                        }
                    });
                });
            })
        }
    }
}