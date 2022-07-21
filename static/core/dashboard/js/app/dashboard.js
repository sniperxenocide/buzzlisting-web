/**
 * Created by Md.Abdullah Al Mamun.
 * Project: workflow
 * File:
 * Email: mamun@infosapex.com, dev.mamun@gmail.com
 * Date: 11/14/17
 */
var single_new_case = $('#applications').find('.media');
class Dashboard {

    constructor() {
        let $object = this;
        this._baseUrl = location.origin;
    }


    /*
    var workflow_api_ulr = '/api/v1/workflow/count/';
    var  get_promises = this.httpRequest(workflow_api_ulr);
    get_promises.done(function (response) {
        $('#tr > h2').text(response.totaltask);
        $('#or > h2').text(response.overdue);
    });*/

    getKPI(pending, overdue, query, completed) {
        $('#tr > h2').text(query);
        $('#or > h2').text(overdue);
        $('#cr > h2').text(completed);
        $('#pr > h2').text(pending);
        // let url = this._baseUrl + '/api/v1/workflow/getkpi/'
        // let promises = this.httpRequest(url);
        // promises.done(function (response) {
        //     $('#tr > h2').text(response.totaltask);
        //     $('#or > h2').text(response.overdue);
        // });
        //
        // url = this._baseUrl + '/api/v1/workflow/app_count/'
        // promises = this.httpRequest(url);
        // promises.done(function (response) {
        //     $('#cr > h2').text(response.completed);
        //     $('#pr > h2').text(response.todo);
        // });
    }

    applications() {
        let url = this._baseUrl + '/api/v1/workflow/task/?init=true';
        let promises = this.httpRequest(url);
        promises.done(function (response) {
            if (response.length > 0) {
                $.each(response, function (key, val) {
                    let html = '';
                    html = '<a class="list-group-item media" data-process-id="' + val.id + '" href="#">';
                    html += '<div class="pull-right"><i class="zmdi zmdi-eye f-20 c-green"></i></div>'
                    html += '<div class="media-body">';
                    html += '<div class="lgi-heading">' + val.project_name + ' ( ' + val.name + ' )</div>';
                    // html += '<small class="lgi-text">';
                    // html += val.name;
                    // html += '</small>';
                    html += '</div>';
                    html += '</a>';
                    $('#applications').prepend(html);
                })
            }
        });
    }

    monthlyStatistics(data) {
        Highcharts.chart('monthly_statistics', {
            chart: {
                type: 'column'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                categories: [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec'
                ],
                crosshair: true
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px"><strong>{point.key}</strong></span><br><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: &nbsp;</td>' +
                '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                name: data[0].name,
                color: '#8BC34A',
                data: data[0].data,
                /*[49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]*/
                shadow: {
                    color: '#8BC34A',
                    width: 2,
                    offsetX: 0,
                    offsetY: 0
                }

            }, {
                name: data[1].name,
                color: '#00BCD4',
                data: data[1].data,
                /*[83.6, 78.8, 98.5, 93.4, 106.0, 84.5, 105.0, 104.3, 91.2, 83.5, 106.6, 92.3]*/
                shadow: {
                    color: '#00BCD4',
                    width: 2,
                    offsetX: 0,
                    offsetY: 0
                }

            }, {
                name: data[2].name,
                color: '#FF9800',
                data: data[2].data,
                /*[48.9, 38.8, 39.3, 41.4, 47.0, 48.3, 59.0, 59.6, 52.4, 65.2, 59.3, 51.2]*/
                shadow: {
                    color: '#FF9800',
                    width: 2,
                    offsetX: 0,
                    offsetY: 0
                }

            }]
        });
    }

    initVSComplete(data) {
        $('#InorOp').text(data.x_axis);
        Highcharts.chart('init_vs_comp', {
            chart: {
                type: 'line'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: {
                title: {
                    text: 'Process'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: [{
                name: data.x_axis,
                color: '#26A69A',
                data: data.graph_data[0].data
                /*[7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]*/
            }, {
                name: 'Completed',
                color: '#FFC107',
                data: data.graph_data[1].data
            }]
        });
    }

    docSummary(){
        var apiUrl = location.origin;
        var doc_summary_api = apiUrl + '/api/v1/dms/documents/documentsummary/';

        /*
         var pieData = [
         {
         "label": "Toyota",
         "value": 80,
         "color": "#7e3838"
         },
         {
         "label": "Suzuki",
         "value": 30,
         "color": "#7e6538"
         },
         {
         "label": "Toyota",
         "value": 80,
         "color": "#7e3838"
         },
         {
         "label": "Suzuki",
         "value": 30,
         "color": "#7e6538"
         },
         {
         "label": "Toyota",
         "value": 80,
         "color": "#7e3838"
         },
         {
         "label": "Suzuki",
         "value": 30,
         "color": "#7e6538"
         },
         {
         "label": "Mitsubishi",
         "value": 30,
         "color": "#7c7e38"
         },
         {
         "label": "Volkswagon",
         "value": 30,
         "color": "#587e38"
         },
         {
         "label": "BMW",
         "value": 5,
         "color": "#387e45"
         },
         {
         "label": "Tata",
         "value": 40,
         "color": "#387e6a"
         },
         {
         "label": "Marcedes",
         "value": 30,
         "color": "#386a7e"
         }
         ];
         */
        var doc_summary_pi;
        $.ajax({
            method: 'GET',
            url: doc_summary_api,
            success: function (res) {
                if (res.length > 0) {


                    doc_summary_pi = new d3pie("pieChart", {
                        //"header": {
                        //	"title": {
                        //		"text": "Spousal Resentment",
                        //		"fontSize": 22,
                        //		"font": "verdana"
                        //	},
                        //	"subtitle": {
                        //		"text": "Comments my wife has made when I tell her I'm working on this script instead of doing something \"fun\".",
                        //		"color": "#999999",
                        //		"fontSize": 10,
                        //		"font": "verdana"
                        //	},
                        //	"titleSubtitlePadding": 12
                        //},
                        //"footer": {
                        //	"text": "Source: me, my room, the last couple of months.",
                        //	"color": "#999999",
                        //	"fontSize": 11,
                        //	"font": "open sans",
                        //	"location": "bottom-center"
                        //},
                        "size": {
                            "canvasHeight": 230,
                            "canvasWidth": 530,
                            "pieOuterRadius": "80%"
                        },
                        "data": {
                            "content": res
                        },
                        "labels": {
                            "outer": {
                                "pieDistance": 32
                            },
                            "inner": {
                                "format": "value"
                            },
                            "mainLabel": {
                                "font": "verdana"
                            },
                            "percentage": {
                                "color": "#e1e1e1",
                                "font": "verdana",
                                "decimalPlaces": 0
                            },
                            "value": {
                                "color": "#e1e1e1",
                                "font": "verdana"
                            },
                            "lines": {
                                "enabled": true,
                                "color": "#cccccc"
                            },
                            "truncation": {
                                "enabled": true
                            }
                        },
                        "effects": {
                            "pullOutSegmentOnClick": {
                                "effect": "linear",
                                "speed": 400,
                                "size": 8
                            }
                        }
                    });

                    $(window).on('resize', resizePiechart);

                    function resizePiechart() {
                        var $piechart = $('#pieChart');
                        var width = $piechart.closest('.card').width();

                        //console.log(width);
                        //console.log(pie.setSize());


                        $piechart.find('svg').attr({
                            width: width,
                            position: 'absolute',
                            left: '-40%',
                            preserveAspectRatio: "xMinYMin meet",
                            viewBox: "0 0 400 400"
                        });
                    }

                    resizePiechart();

                } else {
                    // for empty response
                    $('#pieChart').addClass('text-center').text('No document available.');
                }
            },
            error: function (err) {
                //console.log(err);
            }
        });
    }

    taskSummary(task_count){
        $('#ORPB').width(task_count.open_request);
        $('#ARPB').width(task_count.approve_request);
        $('#RRPB').width(task_count.reject_request);
        $('#QPB').width(task_count.query_request);
        $('#RCPB').width(task_count.recheck_request);
    }

    DMSCount(data){
        $('#dms_CODN').text(data.checked_out_document);
        $('#dms_ex').text(data.doc_expired);
        $('#dms_PDN').text(data.pending_document);
        $('#dms_TDN').text(data.total_document);
        $('#dms_US').text(data.used_space);
        $('#dms_FS').text(data.free_space);
    }

    httpRequest(url, method, inputs) {
        method = method || 'GET';
        inputs = inputs || '';
        return $.ajax({
            url: url,
            type: method,
            cache: true,
            data: inputs
        });
    }
}

$(document).find('#applications').on('click', '.media', function (e) {
    e.preventDefault();
    var outer_new = {
        process: $(this).data('process-id')
    };
    localStorage.setItem("outer_new", JSON.stringify(outer_new));
    var tasks_url = "/workflow/case/new_case";
    window.location = tasks_url;
});

// //------------------------------------------------------------------------
// {
//     var apiUrl = location.origin;
//     var dateTimeInputFormat = 'DD/MM/YYYY hh:mm A';
//
//     $(document).off('click.todoSubmit').on('click.todoSubmit', '.save-todo', function (e) {
//         var text = $('#todo-text').val();
//
//         //send ajax post
//
//         var template = doT.template($('#todoList').html());
//         //console.log('hhh');
//
//         $('#todo .list-group').append(template({"text": text}));
//         $(this).prev('a').trigger('click');
//     });
//
//     $('.dashboard-data-table').each(function (k, v) {
//         var $this = $(v);
//
//         if ($this.find('tbody').length > 0) {
//             $this.DataTable({
//                 "bSort": false,
//                 "pageLength": 5,
//                 scrollY: 130,
//                 deferRender: true,
//                 scroller: true
//             });
//         }
//     });
//
//     var doc_summary_api = apiUrl + '/api/v1/dms/documents/documentsummary/';
//
//     /*
//      var pieData = [
//      {
//      "label": "Toyota",
//      "value": 80,
//      "color": "#7e3838"
//      },
//      {
//      "label": "Suzuki",
//      "value": 30,
//      "color": "#7e6538"
//      },
//      {
//      "label": "Toyota",
//      "value": 80,
//      "color": "#7e3838"
//      },
//      {
//      "label": "Suzuki",
//      "value": 30,
//      "color": "#7e6538"
//      },
//      {
//      "label": "Toyota",
//      "value": 80,
//      "color": "#7e3838"
//      },
//      {
//      "label": "Suzuki",
//      "value": 30,
//      "color": "#7e6538"
//      },
//      {
//      "label": "Mitsubishi",
//      "value": 30,
//      "color": "#7c7e38"
//      },
//      {
//      "label": "Volkswagon",
//      "value": 30,
//      "color": "#587e38"
//      },
//      {
//      "label": "BMW",
//      "value": 5,
//      "color": "#387e45"
//      },
//      {
//      "label": "Tata",
//      "value": 40,
//      "color": "#387e6a"
//      },
//      {
//      "label": "Marcedes",
//      "value": 30,
//      "color": "#386a7e"
//      }
//      ];
//      */
//     var doc_summary_pi;
//     $.ajax({
//         method: 'GET',
//         url: doc_summary_api,
//         success: function (res) {
//             if (res.length > 0) {
//
//
//                 doc_summary_pi = new d3pie("pieChart", {
//                     //"header": {
//                     //	"title": {
//                     //		"text": "Spousal Resentment",
//                     //		"fontSize": 22,
//                     //		"font": "verdana"
//                     //	},
//                     //	"subtitle": {
//                     //		"text": "Comments my wife has made when I tell her I'm working on this script instead of doing something \"fun\".",
//                     //		"color": "#999999",
//                     //		"fontSize": 10,
//                     //		"font": "verdana"
//                     //	},
//                     //	"titleSubtitlePadding": 12
//                     //},
//                     //"footer": {
//                     //	"text": "Source: me, my room, the last couple of months.",
//                     //	"color": "#999999",
//                     //	"fontSize": 11,
//                     //	"font": "open sans",
//                     //	"location": "bottom-center"
//                     //},
//                     "size": {
//                         "canvasHeight": 230,
//                         "canvasWidth": 530,
//                         "pieOuterRadius": "80%"
//                     },
//                     "data": {
//                         "content": res
//                     },
//                     "labels": {
//                         "outer": {
//                             "pieDistance": 32
//                         },
//                         "inner": {
//                             "format": "value"
//                         },
//                         "mainLabel": {
//                             "font": "verdana"
//                         },
//                         "percentage": {
//                             "color": "#e1e1e1",
//                             "font": "verdana",
//                             "decimalPlaces": 0
//                         },
//                         "value": {
//                             "color": "#e1e1e1",
//                             "font": "verdana"
//                         },
//                         "lines": {
//                             "enabled": true,
//                             "color": "#cccccc"
//                         },
//                         "truncation": {
//                             "enabled": true
//                         }
//                     },
//                     "effects": {
//                         "pullOutSegmentOnClick": {
//                             "effect": "linear",
//                             "speed": 400,
//                             "size": 8
//                         }
//                     }
//                 });
//
//                 $(window).on('resize', resizePiechart);
//
//                 function resizePiechart() {
//                     var $piechart = $('#pieChart');
//                     var width = $piechart.closest('.card').width();
//
//                     //console.log(width);
//                     //console.log(pie.setSize());
//
//
//                     $piechart.find('svg').attr({
//                         width: width,
//                         position: 'absolute',
//                         left: '-40%',
//                         preserveAspectRatio: "xMinYMin meet",
//                         viewBox: "0 0 400 400"
//                     });
//                 }
//
//                 resizePiechart();
//
//             } else {
//                 // for empty response
//                 $('#pieChart').addClass('text-center').text('No document available.');
//             }
//         },
//         error: function (err) {
//             //console.log(err);
//         }
//     });
//
//
//     var inbox_api = apiUrl + "/api/v1/workflow/delegation/?item_status=todo";
//
//     var inboxDatatable = $('#inboxTable').DataTable({
//         bSort: true,
//         searching: true,
//         processing: true,
//         serverSide: true,
//         pageLength: 5,
//         order: [[4, 'desc']],
//         ajax: $.fn.dataTable.pipeline({
//             url: inbox_api,
//             pages: 1 // number of pages to cache
//         }),
//         scrollY: 130,
//         deferRender: true,
//         scroller: true,
//         columns: [
//             {"title": "App Number", "data": "app_number"},
//             {"title": "Process", "data": "project_name"},
//             {"title": "Task", "data": "task_name"},
//             {"title": "Sent by", "data": "sent_by"},
//             {"title": "Due Date", "data": "init_date"},
//         ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 orderable: false
//             },
//             {
//                 targets: 1,
//                 orderable: false
//             },
//             {
//                 targets: 2,
//                 orderable: false
//             },
//             {
//                 targets: 3,
//                 orderable: false
//             },
//             {
//                 targets: 4,
//                 //width: '20%',
//                 "render": (data, a, b) => {
//                     //console.log(data)
//                     var due_date = new Date(data);
//                     var current_date = new Date();
//                     //console.log(current_date, due_date);
//                     if (current_date < due_date) {
//                         return "<span>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     } else {
//                         return "<span class='c-lightRed'>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     }
//                 },
//                 orderable: false
//             }
//         ],
//         "fnRowCallback": function (nRow, aData) {
//             if (aData.read_status == "false") {
//                 $(nRow).addClass('unread');
//             }
//         },
//         "oLanguage": {"sEmptyTable": "You dont have any task"}
//     });
//
//     var risk_task_api = apiUrl + '/api/v1/workflow/pending_task/?status=risk_task';
//     var riskDataTable = $('#riskTaskTable').DataTable({
//         bSort: true,
//         searching: true,
//         processing: true,
//         serverSide: true,
//         pageLength: 5,
//         order: [[4, 'desc']],
//         ajax: $.fn.dataTable.pipeline({
//             url: risk_task_api,
//             pages: 1 // number of pages to cache
//         }),
//         scrollY: 130,
//         deferRender: true,
//         scroller: true,
//         columns: [
//             {"title": "App Number", "data": "app_number"},
//             {"title": "Process", "data": "project_name"},
//             {"title": "Task", "data": "task_name"},
//             {"title": "Sent by", "data": "sent_by"},
//             {"title": "Due Date", "data": "init_date"},
//         ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 orderable: false
//             },
//             {
//                 targets: 1,
//                 orderable: false
//             },
//             {
//                 targets: 2,
//                 orderable: false
//             },
//             {
//                 targets: 3,
//                 orderable: false
//             },
//             {
//                 targets: 4,
//                 //width: '20%',
//                 "render": (data, a, b) => {
//                     //console.log(data)
//                     var due_date = new Date(data);
//                     var current_date = new Date();
//                     //console.log(current_date, due_date);
//                     if (current_date < due_date) {
//                         return "<span>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     } else {
//                         return "<span class='c-lightRed'>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     }
//                 },
//                 orderable: false
//             }
//         ],
//         "fnRowCallback": function (nRow, aData) {
//             if (aData.read_status == "false") {
//                 $(nRow).addClass('unread');
//             }
//         },
//         "oLanguage": {"sEmptyTable": "You dont have any task"}
//     });
//
//     var over_task_api = apiUrl + '/api/v1/workflow/pending_task/?status=over_due';
//     var overDueDataTable = $('#overDueTaskTable').DataTable({
//         bSort: true,
//         searching: true,
//         processing: true,
//         serverSide: true,
//         pageLength: 5,
//         order: [[4, 'desc']],
//         ajax: $.fn.dataTable.pipeline({
//             url: over_task_api,
//             pages: 1 // number of pages to cache
//         }),
//         scrollY: 130,
//         deferRender: true,
//         scroller: true,
//         columns: [
//             {"title": "App Number", "data": "app_number"},
//             {"title": "Process", "data": "project_name"},
//             {"title": "Task", "data": "task_name"},
//             {"title": "Sent by", "data": "sent_by"},
//             {"title": "Due Date", "data": "init_date"},
//         ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 orderable: false
//             },
//             {
//                 targets: 1,
//                 orderable: false
//             },
//             {
//                 targets: 2,
//                 orderable: false
//             },
//             {
//                 targets: 3,
//                 orderable: false
//             },
//             {
//                 targets: 4,
//                 //width: '20%',
//                 "render": (data, a, b) => {
//                     //console.log(data)
//                     var due_date = new Date(data);
//                     var current_date = new Date();
//                     //console.log(current_date, due_date);
//                     if (current_date < due_date) {
//                         return "<span>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     } else {
//                         return "<span class='c-lightRed'>"
//                             + moment(data).format(dateTimeInputFormat)
//                             + "</span>"
//                     }
//                 },
//                 orderable: false
//             }
//         ],
//         "fnRowCallback": function (nRow, aData) {
//             if (aData.read_status == "false") {
//                 $(nRow).addClass('unread');
//             }
//         },
//         "oLanguage": {"sEmptyTable": "You dont have any task"}
//     });
//
// //Select Row of DataTable
//     $('#inboxTable, #riskTaskTable, #overDueTaskTable').each(function (k, v) {
//         var $this = $(v);
//
//         $this.find('tbody').on('click', 'tr', function () {
//             var table = $this.DataTable(),
//                 data = table.row(this).data();
//
//             if ($(this).hasClass('selected')) {
//                 $(this).removeClass('selected');
//
//                 /*$summary_button.removeData('case-id').removeClass('c-black');
//                  $pause_button.removeData('case-id').removeClass('c-black');*/
//             }
//             else {
//                 table.$('tr.selected').removeClass('selected');
//                 $(this).addClass('selected');
//
//                 /*$summary_button.removeData("case-id").data("case-id", data.id).addClass('c-black');
//                  $pause_button.removeData("case-id").data("case-id", data.id).addClass('c-black');*/
//             }
//         });
//     });
//
// //table raw DoubleClick
//     $('#inboxTable').find('tbody').on('dblclick', 'tr', function () {
//         var table = $('#inboxTable').DataTable();
//         $(this).removeClass('unread');
//         var data = table.row(this).data();
//         var task_id = data.task;
//         var application_id = data.application;
//         window.location = '/workflow/case/form/' + task_id + '/' + application_id;
//     });
//     $('#overDueTaskTable').find('tbody').on('dblclick', 'tr', function () {
//         var table = $('#overDueTaskTable').DataTable();
//         $(this).removeClass('unread');
//         var data = table.row(this).data();
//         var task_id = data.task;
//         var application_id = data.application;
//         window.location = '/workflow/case/form/' + task_id + '/' + application_id;
//     });
//     $('#riskTaskTable').find('tbody').on('dblclick', 'tr', function () {
//         var table = $('#riskTaskTable').DataTable();
//         $(this).removeClass('unread');
//         var data = table.row(this).data();
//         var task_id = data.task;
//         var application_id = data.application;
//         window.location = '/workflow/case/form/' + task_id + '/' + application_id;
//     });
//     $(document).off('dblclick.jum').on('dblclick.jum', '#checkedOutTaskTable tbody tr', function () {
//         var table = $('#checkedOutTaskTable').DataTable();
//         $(this).removeClass('unread');
//         var data = table.row(this).data();
//         console.log(data);
//         var doc_id = data.id;
//         window.location = '/dms/document/view/' + doc_id;
//     });
//
// //
// //due date generation
//     function dueDateGen() {
//
//         $('#due_date').datetimepicker({
//             format: dateTimeInputFormat,
//             useCurrent: false,
//             minDate: moment()
//         });
//         $("#due_date").data('DateTimePicker').defaultDate(moment().add(1, 'days'));
//     };
//     dueDateGen();
//
//
//     var todo_api = apiUrl + '/api/v1/todolist/';
// //todo list table gen
//     $('#todoListTable').DataTable({
//         bSort: true,
//         searching: true,
//         processing: true,
//         serverSide: true,
//         pageLength: 5,
//         order: [[1, 'desc']],
//         ajax: $.fn.dataTable.pipeline({
//             url: todo_api,
//             pages: 1 // number of pages to cache
//         }),
//         scrollY: 130,
//         deferRender: true,
//         scroller: true,
//         columns: [
//             {"title": "Text", "data": "text"},
//             {"title": "Due Date", "data": "due_date"}
//         ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 "render": (data, a, b) => {
//                     if (b.completed == false) {
//                         //console.log(moment(b.due_date).format(dateTimeInputFormat));
//                         return data;
//                     }
//                     else {
//                         return '<strike>' + data + '</strike>';
//                     }
//
//                 },
//                 orderable: false
//             },
//             {
//                 targets: 1,
//                 "render": (data, a, b) => {
//                     var due_date = new Date(data);
//                     var current_date = new Date();
//                     //console.log(current_date, due_date);
//
//                     if (b.completed == false) {
//                         if (current_date < due_date) {
//                             return "<span>"
//                                 + moment(data).format(dateTimeInputFormat)
//                                 + "</span>"
//                         }
//                         else {
//                             return "<span class='c-lightRed'>"
//                                 + moment(data).format(dateTimeInputFormat)
//                                 + "</span>"
//                         }
//                     }
//                     else {
//                         if (current_date < due_date) {
//                             return "<strike>"
//                                 + moment(data).format(dateTimeInputFormat)
//                                 + "</strike>"
//                         }
//                         else {
//                             return "<strike class='c-lightRed'>"
//                                 + moment(data).format(dateTimeInputFormat)
//                                 + "</strike>"
//                         }
//                     }
//                 },
//                 orderable: false
//             }
//         ],
//         "fnRowCallback": function (nRow, aData) {
//             if (aData.read_status == "false") {
//                 $(nRow).addClass('unread');
//             }
//         },
//         "oLanguage": {"sEmptyTable": "You don't have any todo"}
//     });
//
// //todo single row selection
//
//     $('#todoListTable tbody').on('click', 'tr', function () {
//         var $this = $(this);
//         //$this.toggleClass('selected');
//         var table = $('#todoListTable').DataTable();
//         //console.log(table.row(this).data());
//
//         if ($this.hasClass('selected')) {
//             $this.removeClass('selected');
//
//             $('.todo-actions').find('i').not('#addTodo i').removeClass('c-black');
//             $('.todo-actions a').not('#addTodo').removeClass('active');
//         }
//         else {
//             table.$('tr.selected').removeClass('selected');
//             $this.addClass('selected');
//
//             $('.todo-actions').find('i').not('#addTodo i').addClass('c-black');
//             $('.todo-actions a').not('#addTodo').addClass('active');
//         }
//     });
//
//     /*multiple row selection
//      function activateDeactavateActions(){
//
//      if (table.rows('.selected').data().length > 0) {
//      $('.todo-actions').find('i').not('#addTodo i').addClass('c-black');
//      $('.todo-actions #deleteTodo, .todo-actions #completenessTodo').addClass('active');
//      $('.todo-actions #updateTodo').addClass('active');
//      }
//      else if(table.rows('.selected').data().length == 1){
//      $('.todo-actions').find('i').not('#addTodo i').addClass('c-black');
//      $('.todo-actions #updateTodo').addClass('active');
//      $('.todo-actions #updateTodo i').addClass('c-black');
//      console.log('update should be active!');
//      }
//      if(table.rows('.selected').data().length > 1){
//      $('.todo-actions #updateTodo').removeClass('active');
//      $('.todo-actions #updateTodo i').removeClass('c-black');
//      console.log('update should be inactive!');
//      }
//      else if(table.rows('.selected').data().length < 1) {
//      $('.todo-actions').find('i').not('#addTodo i').removeClass('c-black');
//      $('.todo-actions #deleteTodo, .todo-actions #completenessTodo').removeClass('active');
//      $('.todo-actions #updateTodo').removeClass('active');
//      console.log('update should be inactive!');
//      }
//      }*/
// //table.rows('.selected').data().length +' row(s) selected'
//
// //todo add
//     function addEditTodoSubmit(method, id) {
//         $('#addEditTodoForm').off('submit').on('submit', function (e) {
//             e.preventDefault();
//             var data = {};
//             var $this = $(this);
//             var formParsley = $('#addEditTodoForm').parsley();
//             formParsley.validate();
//             if (!formParsley.isValid()) {
//                 return;
//             }
//
//             $this.serializeArray().map(function (x) {
//                 data[x.name] = x.value;
//             });
//
//             data['user'] = userId;
//             data['due_date'] = moment(data['due_date'], dateTimeInputFormat).format();
//             //console.log('data id', data.id);
//
//             var table = $('#todoListTable').DataTable();
//
//             if (id != undefined) {
//                 //console.log('for submit', id);
//             }
//
//             function submitForm(id) {
//                 var queryString = '';
//
//                 if (id != undefined) {
//                     queryString = id + '/';
//                 } else {
//                     queryString = '';
//                 }
//                 //console.log(method, todo_api + queryString);
//
//                 $('.todo-actions #updateTodo').removeClass('active');
//                 $('.todo-actions #updateTodo i').removeClass('c-black');
//
//                 $.ajax({
//                     method: method,
//                     url: todo_api + queryString,
//                     data: data,
//                     success: function (res) {
//                         //console.log(res);
//                         table.clearPipeline().draw();
//                         if (id == undefined) {
//                             notify('Congratulation!!! ', 'Todo Added Successfully ', ' ', 'success', 2000);
//                         } else {
//                             notify('Congratulation!!! ', 'Todo updated Successfully ', ' ', 'success', 2000);
//                         }
//
//                         $('#modalTodo').modal('hide');
//                         $this.find('input[type="text"], textarea').val('');
//                     },
//                     error: function (err) {
//                         //console.log(err);
//                         notify('Warning!!! ', err.responseText, ' ', 'warning', 3000);
//                     }
//                 });
//             }
//
//             submitForm(id);
//
//         });
//     }
//
// //add todo click
//     $("#addTodo").on('click', function (e) {
//         e.preventDefault();
//         dueDateGen();
//
//         $('#modalTodo').modal('show');
//
//         addEditTodoSubmit('POST');
//     });
// //update todo click
//     $('#updateTodo').on('click', function (e) {
//         e.preventDefault();
//         var $this = $(this);
//         if ($this.hasClass('active')) {
//             var table = $('#todoListTable').DataTable();
//             var data = table.row('.selected').data();
//
//             //console.log('tableId for Edit', data.id);
//
//             var $textField = $('#modalTodo').find('#text');
//             var $dueDateField = $('#modalTodo').find('#due_date');
//
//             $textField.val(data.text);
//             $dueDateField.val(moment(data.due_date).format(dateTimeInputFormat));
//
//             $('#modalTodo').modal('show');
//
//             addEditTodoSubmit('PATCH', data.id);
//         }
//     });
// //delete todo click
//     $('#deleteTodo').on('click', function (e) {
//         e.preventDefault();
//         var $this = $(this);
//         if ($this.hasClass('active')) {
//             var table = $('#todoListTable').DataTable();
//             var data = table.row('.selected').data();
//             deleteComplete(table, 'DELETE', data.id, 'Deleted');
//         }
//     });
// //complete todo click
//     $('#completenessTodo').on('click', function (e) {
//         e.preventDefault();
//         var $this = $(this);
//         if ($this.hasClass('active')) {
//             var table = $('#todoListTable').DataTable();
//             var data = table.row('.selected').data();
//             //console.log(data.completed);
//             if (data.completed == true) {
//                 deleteComplete(table, 'PATCH', data.id, 'Unchecked', false);
//             }
//             else {
//                 deleteComplete(table, 'PATCH', data.id, 'Checked', true);
//             }
//         }
//     });
//
//     function deleteComplete(table, method, id, status, param) {
//         var obj = {};
//         if (param == undefined) {
//             obj = '';
//         } else {
//             if (param == true) {
//                 obj.completed = true;
//             }
//             else {
//                 obj.completed = false;
//             }
//         }
//
//         $.ajax({
//             method: method,
//             url: todo_api + id + '/',
//             data: obj,
//             success: function (res) {
//                 table.clearPipeline().draw();
//                 notify('', status + ' successfully', ' ', 'success', 2000);
//             },
//             error: function (err) {
//                 //console.log(err);
//                 notify('Warning!!! ', err.responseText, ' ', 'warning', 3000);
//             }
//         });
//     }
//
//
//     var checkedOut_list = apiUrl + '/api/v1/dms/documents/checkoutdoc/';
// //Checked Out Task Table
//     var checkedOutTaskTable = $('#checkedOutTaskTable').DataTable({
//         bSort: false,
//         searching: true,
//         processing: true,
//         serverSide: true,
//         pageLength: 5,
//         order: [[4, 'desc']],
//         ajax: $.fn.dataTable.pipeline({
//             url: checkedOut_list,
//             pages: 1 // number of pages to cache
//         }),
//         scrollY: 130,
//         deferRender: true,
//         scroller: true,
//         columns: [
//             {"title": "File Name", "data": "filename"},
//             {"title": "Doc Type", "data": "doctype"},
//             {"title": "Expiry Date", "data": "expiry_date"},
//             {"title": "Locked By", "data": "locker_name"},
//             {"title": "Locked At", "data": "locked_at"},
//         ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 orderable: false
//             },
//             {
//                 targets: 1,
//                 orderable: false
//             },
//             {
//                 targets: 2,
//                 "render": (data, a, b) => {
//                     if (data == null) {
//                         return '--';
//                     } else {
//                         return moment(data).format('DD/MM/YYYY');
//                     }
//                 },
//                 orderable: false
//             },
//             {
//                 targets: 3,
//                 "render": (data, a, b) => {
//                     if (userId == 1) {
//                         return data;
//                     }
//                     else {
//                         return 'not allowed';
//                     }
//                 },
//                 "visible": (userId != 1) ? false : true,
//                 orderable: false
//             },
//             {
//                 targets: 4,
//                 "render": (data, a, b) => {
//                     if (data == null) {
//                         return '--';
//                     } else {
//                         return moment(data).format('DD/MM/YYYY hh:mm A');
//                     }
//                 },
//                 orderable: false
//             }
//         ],
//         "fnRowCallback": function (nRow, aData) {
//             if (aData.read_status == "false") {
//                 $(nRow).addClass('unread');
//             }
//         },
//         "oLanguage": {"sEmptyTable": "You don't have any checked out doc"}
//     });
//
// //kpi gauges
//     function kpiGuages(container, title, plotBands, data) {
//         Highcharts.chart(container, {
//
//             chart: {
//                 type: 'gauge',
//                 plotBackgroundColor: null,
//                 plotBackgroundImage: null,
//                 plotBorderWidth: 0,
//                 plotShadow: false,
//                 spacingTop: 0,
//                 spacingLeft: 0,
//                 spacingRight: 0,
//                 spacingBottom: 0
//             },
//
//             title: {
//                 text: title
//             },
//
//             pane: {
//                 startAngle: -105,
//                 endAngle: 105,
//                 background: []
//                 /*background: [{
//                  backgroundColor: {
//                  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
//                  stops: [
//                  [0, '#FFF'],
//                  [1, '#333']
//                  ]
//                  },
//                  borderWidth: 0,
//                  outerRadius: '0%'
//                  }, {
//                  backgroundColor: {
//                  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
//                  stops: [
//                  [0, '#333'],
//                  [1, '#FFF']
//                  ]
//                  },
//                  borderWidth: 0,
//                  outerRadius: '0%'
//                  }, {
//                  // default background
//                  }, {
//                  backgroundColor: '#DDD',
//                  borderWidth: 0,
//                  outerRadius: '0%',
//                  innerRadius: '0%'
//                  }]*/
//             },
//
//             // the value axis
//             yAxis: {
//                 min: 0,
//                 max: 100,
//                 minorTickInterval: 'auto',
//                 minorTickWidth: 1,
//                 minorTickLength: 10,
//                 minorTickPosition: 'inside',
//                 minorTickColor: '#666',
//
//                 tickPixelInterval: 30,
//                 tickWidth: 2,
//                 tickPosition: 'inside',
//                 tickLength: 10,
//                 tickColor: '#666',
//                 labels: {
//                     step: 5,
//                     rotation: 'auto'
//                 },
//                 plotBands: plotBands
//             },
//
//             series: [{
//                 name: 'Performance',
//                 data: [data],
//                 tooltip: {
//                     valueSuffix: ' %'
//                 }
//             }]
//
//         });
//     }
//
//     var positivePlotBand =
//         [{
//             from: 0,
//             to: 40,
//             color: '#DF5353' // red
//
//         }, {
//             from: 41,
//             to: 80,
//             color: '#DDDF0D' // yellow
//         }, {
//             from: 81,
//             to: 100,
//             color: '#55BF3B' // green
//         }];
//
//     var negativePlotBand =
//         [{
//             from: 0,
//             to: 40,
//             color: '#55BF3B' // green
//         }, {
//             from: 41,
//             to: 80,
//             color: '#DDDF0D' // yellow
//         }, {
//             from: 81,
//             to: 100,
//             color: '#DF5353' // red
//
//         }];
//
//     function kpi_gauge_gen() {
//         var kpi_api = apiUrl + '/api/v1/workflow/getkpi/';
//         $.ajax({
//             method: "GET",
//             url: kpi_api,
//             success: function (res) {
//                 //console.log(res);
//                 var pending_task = Math.ceil(parseInt(res['todotask'])),
//                     risk_task = Math.ceil(parseInt(res['risktask'])),
//                     completed_task = Math.ceil(parseInt(res['completed'])),
//                     completed_before_due_task = Math.ceil(parseInt(res['completedbeforedue'])),
//                     completed_after_due_task = Math.ceil(parseInt(res['completedafterdue'])),
//                     overdue_task = Math.ceil(parseInt(res['overdue']));
//
//                 kpiGuages('pending_kpi', 'Pending Tasks', negativePlotBand, pending_task);
//                 kpiGuages('risk_kpi', 'Risk Tasks', negativePlotBand, risk_task);
//                 kpiGuages('completed_kpi', 'Completed Tasks', positivePlotBand, completed_task);
//                 kpiGuages('completed_before_due_kpi', 'Completed Before Duedate', positivePlotBand, completed_before_due_task);
//                 kpiGuages('completed_after_due_kpi', 'Completed After Duedate', negativePlotBand, completed_after_due_task);
//                 kpiGuages('over_due_kpi', 'Overdue Tasks', negativePlotBand, overdue_task);
//             },
//             error: function (err) {
//                 //console.log(err);
//             }
//         });
//     };
//     kpi_gauge_gen();
//
//
//     /*
//      Highcharts.chart('completed_kpi', {
//
//      chart: {
//      type: 'gauge',
//      alignTicks: false,
//      plotBackgroundColor: null,
//      plotBackgroundImage: null,
//      plotBorderWidth: 0,
//      plotShadow: false,
//      spacingTop: 0,
//      spacingLeft: 0,
//      spacingRight: 0,
//      spacingBottom: 0
//      },
//
//      title: {
//      text: 'Completed Task'
//      },
//
//      pane: {
//      startAngle: -105,
//      endAngle: 105,
//      background: []
//      },
//
//      // the value axis
//      yAxis: {
//      min: 0,
//      max: 100,
//      minorTickInterval: 'auto',
//      minorTickWidth: 1,
//      minorTickLength: 10,
//      minorTickPosition: 'inside',
//      minorTickColor: '#666',
//
//      tickPixelInterval: 30,
//      tickWidth: 2,
//      tickPosition: 'inside',
//      tickLength: 10,
//      tickColor: '#666',
//      labels: {
//      step: 2,
//      rotation: 'auto'
//      },
//      plotBands: [{
//      from: 0,
//      to: 40,
//      color: '#DF5353' // red
//
//      }, {
//      from: 41,
//      to: 60,
//      color: '#DDDF0D' // yellow
//      }, {
//      from: 61,
//      to: 80,
//      color: '#13bfb3' // green
//      }, {
//      from: 81,
//      to: 100,
//      color: '#55BF3B' // green
//      }]
//      },
//      series: [{
//      name: 'Performance',
//      data: [50],
//      tooltip: {
//      valueSuffix: ' %'
//      }
//      }]
//
//      });
//      */
// }
//
//-----------------------------------------
//SOCKET OPERATIONS
// var socket = io.connect(location.protocol + '//' + location.hostname + ':' + socket_listening_port);
//
// //inbox
// socket.on('task', function (message) {
//     console.log('task message', message);
//
//     //inboxDatatable.clearPipeline().draw();
//
//     kpi_gauge_gen();
// });
//
//
// //inbox
// socket.on('completed_task', function (message) {
//     console.log('completed_task message', message);
//
//     kpi_gauge_gen();
// });
// //checkout docs
// socket.on('checkout_docs', function (message) {
//     console.log(message);
//
//     checkedOutTaskTable.clearPipeline().draw();
//
//     // $select.DataTable().row($('tr.selected')).remove()
// });
//
// //doc summary
// socket.on('doc_summary', function (message) {
//     console.log(message);
//
//     $.ajax({
//         method: 'GET',
//         url: doc_summary_api,
//         success: function (res) {
//             if (res.length > 0) {
//                 if (doc_summary_pi != undefined) doc_summary_pi.updateProp("data.content", res);
//             }
//         }
//     });
// });