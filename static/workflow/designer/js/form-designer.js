/**
 * Created by mamun on 1/24/17.
 * @method init
 * @method list @desc It will load eform list and show on datatable
 *
 */

var EForm = (function () {
    let self = {};
    let $create;
    let $eform;
    let $datatable = {};
    self.api = '';

    self.init = function (showBuilder) {
        showBuilder = showBuilder || false;
        if (showBuilder) {
            self.builder();
        }
        $modal.on('hidden.bs.modal', function (event) {
            $datatable.clear().destroy();
            if (typeof $eform !== 'undefined') {
                $eform.reset();
                $($eform.$element.get(0))[0].reset();
            }
        });
        $(document).on('click', 'button', function (event) {
            event.preventDefault();
            if (this.id !== '') {
                var fn = self[this.id];
                if (typeof fn === 'function') {
                    fn($(this));
                }
            }
        });
        $(document).on('click', 'a', function (event) {
            event.preventDefault();
            if (this.id !== '') {
                var fn = self[this.id];
                if (typeof fn === 'function') {
                    fn($(this));
                }
            }
        });
    };
    //From builder Options
    var options = {
        controlPosition: 'left',
        showActionButtons: false,
        stickyControls: true
    };
    //Initial modal
    var $modal = $('.modal').modal({
        keyboard: false,
        backdrop: 'static',
        show: false
    });
    self.list = function () {
        $create = $('#create').modal('show');
        $datatable = $('#eform_list').DataTable({
            processing: true,
            serverSide: true,
            responsive: true,
            info: true,
            lengthChange: false,
            searching: false,
            deferRender: true,
            scroller: false,
            dom: 'lfrtip',
            select: true,
            fixedHeader: true,
            sort: false,
            pageLength: 5,
            ajax: $.fn.dataTable.pipeline({
                url: api.eform.list,
                pages: 10 // number of pages to cache
            }),
            order: [[0, "desc"]],
            columns: [
                {"title": "", "data": "label"},
            ],
            columnDefs: [
                {
                    "targets": 0,
                }
            ],
            createdRow: function (row, data, dataIndex) {
                $(row).data('content', data);
            },
            headerCallback: function (nHead, aData, iStart, iEnd, aiDisplay) {
                $(nHead).parent().remove();
            },
            footerCallback: function (nFoot, aData, iStart, iEnd, aiDisplay) {
                //console.log('fnFooterCallback: ',nFoot, aData, iStart, iEnd, aiDisplay);
            },
            initComplete: function (settings, json) {
                $(document).find('.length_change').hide();
                $(document).find('.dataTables_info').css({
                    'padding': '0px',
                    'margin': '20px 10px 10px',
                });
                $(document).find('.dataTables_paginate').css({
                    'padding': '0px',
                    'margin': '10px 5px 10px 10px',
                });
            },
            drawCallback: function (settings) {
                var api = this.api();
                api.$('tr').click(function (event) {
                    var content = $(this).data('content');
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                        $(document).find('.zmdi-edit, .zmdi-delete').removeClass('c-black');
                    } else {
                        api.$('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        $(document).find('.zmdi-edit, .zmdi-delete').parent().data('id', content.id);
                        $(document).find('.zmdi-edit, .zmdi-delete').addClass('c-black');
                    }
                });
                api.$('tr').dblclick(function (event) {
                    $('a#edit').click();
                });
            }
        });

    };
    self.create = function () {
        $create.find('.modal-body').children().eq(0).hide();
        $create.find('.modal-body').children().eq(1).show();
        $create.find('.modal-footer').children('button').removeAttr('disabled');
        $eform = $('#create_eform').parsley();
    };
    self.builder = function () {
        var promises = httpRequest(api.eform.edit);
        promises.success(function (response) {
            $('#back').data('project', response.project).removeAttr('disabled');
        });
        $('#form-builder').formBuilder();
    };
    self.edit = function ($that) {
        close();
        window.location = api.eform.edit + $that.data('id');
    };
    self.delete = function ($that) {
        var id = $that.data('id');
        if (typeof id == 'undefined') {
            notify('<strong>Error: </strong>', '<i>Please select a row first</i>', '', 'danger');
        } else {
            var promises = httpRequest(api.eform.delete + id + '/', 'DELETE');
            promises.success(function (response) {
                $datatable.clearPipeline().draw();
            });
        }
    };
    self.cancel = function () {
        $create.find('.modal-body').children().eq(0).show();
        $create.find('.modal-body').children().eq(1).hide();
        $create.find('.modal-footer').children('button').attr('disabled', 'disabled');
        if (typeof $eform !== 'undefined') {
            $eform.destroy();
            $eform.reset();
            $($eform.$element.get(0))[0].reset();
        }
    };
    self.saveOpen = function () {
        var redirect = api.eform.edit;
        self.save(redirect);
    };
    self.save = function (redirect) {
        var url = redirect || '';
        $eform.validate();
        if ($eform.isValid()) {
            var inputs = $($eform.$element.get(0)).serializeArray();
            var content = {};
            content.name = 'content';
            content.value = '{}';
            inputs.push(content);
            var project = {};
            project.name = 'project';
            project.value = api.project.id;
            inputs.push(project);
            var promises = httpRequest(api.eform.create, 'POST', inputs);
            promises.success(function (response) {
                    if (url != '') {
                        self.cancel();
                        $modal.modal('hide');
                        window.location = url + response.id;
                    } else {
                        self.cancel();
                        $datatable.clearPipeline().draw();
                    }
                })
                .error(function (response) {
                    $.each(response.responseJSON, (k, v) => {
                        notify('<strong>' + k + ':</strong>', '<i>' + v[0] + '</i>', '', 'danger');
                    });
                });
        }
    };
    self.back = function ($that) {
        /*var id = $that.data('project');
         window.location = api.project.diagram+id+'/';*/
        parent.history.back();
        return false;
    };
    var close = function () {
        $modal.modal('hide');
        self.cancel();
    };
    var httpRequest = function (url, method, inputs) {
        method = method || 'GET';
        inputs = inputs || '';
        return $.ajax({
            url: url,
            type: method,
            data: inputs,
            statusCode: {
                201: function (response, textStatus, jqXHR) {
                    notify('<strong>' + jqXHR.statusText.toUpperCase() + ':</strong>', '<b>' + textStatus + '</b>', '', 'success');
                },
                200: function (jqXHR, textStatus, statusText) {
                    //notify('<strong>' + textStatus.toUpperCase() + ':</strong>', '<b>' + statusText + '</b>', '', 'success');
                },
                204: function (jqXHR, textStatus, statusText) {
                    notify('<strong>Success:</strong>', '<b>Delete Successfully</b>', '', 'success');
                },
                404: function (jqXHR, textStatus, statusText) {
                    notify('<strong>' + textStatus.toUpperCase() + ': </strong>', '<b>' + statusText + '</b>', '', 'danger');
                },
                405: function (jqXHR, textStatus, statusText) {
                    notify('<strong>' + textStatus.toUpperCase() + ': </strong>', '<b>' + statusText + '</b>', '', 'danger');
                }
            }
        });
    };

    return self;
})();