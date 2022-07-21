/**
 * Created by mrityunjoy on 2/15/17.
 */
{
    let kpi_url = "/static/workflow/report/kpiReport/js/kpi_dummy0.json",
        user_api = '/api/v1/user',
        $selectUserReport = $("#select_user"),
        $left_task = $(".left_task"),
        $left_task_percent = $('.left_task_percent'),
        $risk_task = $(".risk_task"),
        $risk_task_percent = $(".risk_task_percent"),
        $completion_task = $(".completion_task"),
        $completion_task_percent = $(".completion_task_percent"),
        $before_due = $(".before_due"),
        $before_due_percent = $(".before_due_percent"),
        $after_due = $(".after_due"),
        $after_due_percent = $(".after_due_percent");
        $over_due = $(".over_due");
        $over_due_percent = $(".over_due_percent");
        $month_box = $("#month_box");

    //-------Get User Name for dropdown------------
    if (user_role === '1') {
        $.ajax({
            type: "GET",
            url: user_api,
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                    $selectUserReport.append($('<option value="' + d.id + '">' + d.first_name + ' ' + d.last_name + ' (' + d.username + ') ' + '</option>'));
                });
                $selectUserReport.selectpicker('refresh');
                $selectUserReport.selectpicker('val', [user_id]);
                // let url = "/static/workflow/report/kpiReport/js/kpi_dummy" + user_id + ".json";
                let url = "/api/v1/workflow/getkpi/?user=" + user_id;
                loadPie(url);
            },
            error: function (response) {
                console.log(response);
            }
        });
        $selectUserReport.on('change', function () {
            let url = "/api/v1/workflow/getkpi/?user=" + this.value;
            loadPie(url);
        });
    } else {
        $selectUserReport.empty().append($('<option value=' + user_id + '>' + user + '</option>'));
        let url = "/api/v1/workflow/getkpi/?user=" + user_id;
        loadPie(url);
    }

    function loadPie(url) {

        $.ajax({
            url: url,
            method: "GET",
            success: function (res) {
                /*$left_task.data('easyPieChart').update(res.todotask);
                /!*$left_task.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $left_task_percent.empty().append(res.todotask);
                $risk_task.data('easyPieChart').update(res.risktask);
                /!*$risk_task.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $risk_task_percent.empty().append(res.risktask);
                $completion_task.data('easyPieChart').update(res.completed);
                /!*$completion_task.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $completion_task_percent.empty().append(res.completed);
                $before_due.data('easyPieChart').update(res.completedbeforedue);
                /!*$before_due.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $before_due_percent.empty().append(res.completedbeforedue);
                $after_due.data('easyPieChart').update(res.completedafterdue);
                /!*$after_due.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $after_due_percent.empty().append(res.completedafterdue);
                $over_due.data('easyPieChart').update(res.overdue);
                /!*$over_due.data('easyPieChart').options.barColor = '#00BCD4';*!/
                $over_due_percent.empty().append(res.overdue);*/

                var pending_task = Math.ceil(parseInt(res['todotask'])),
                    risk_task = Math.ceil(parseInt(res['risktask'])),
                    completed_task = Math.ceil(parseInt(res['completed'])),
                    completed_before_due_task = Math.ceil(parseInt(res['completedbeforedue'])),
                    completed_after_due_task = Math.ceil(parseInt(res['completedafterdue'])),
                    overdue_task = Math.ceil(parseInt(res['overdue']));

                kpiGuages('pending_kpi', 'Pending Tasks', negativePlotBand, pending_task);
                kpiGuages('risk_kpi', 'Risk Tasks', negativePlotBand, risk_task);
                kpiGuages('completed_kpi', 'Completed Tasks', positivePlotBand, completed_task);
                kpiGuages('completed_before_due_kpi', 'Completed Before Duedate', positivePlotBand, completed_before_due_task);
                kpiGuages('completed_after_due_kpi', 'Completed After Duedate', negativePlotBand, completed_after_due_task);
                kpiGuages('over_due_kpi', 'Overdue Tasks', negativePlotBand, overdue_task);
            }
        });
    }

    //---------Datepicker----------
    $month_box.datetimepicker({
        viewMode: 'months',
        format: 'MM/YYYY'
    });
    $month_box.on('focus', function (e) {

        $('#apply_btn').removeAttr('disabled');
    })

    //kpi gauges
    function kpiGuages(container, title, plotBands, data) {
        Highcharts.chart(container, {

            chart: {
                type: 'gauge',
                plotBackgroundColor: null,
	            backgroundColor: 'rgba(0,0,0,0)',
                plotBackgroundImage: null,
                plotBorderWidth: 0,
                plotShadow: false,
                spacingTop: 0,
                spacingLeft: 0,
                spacingRight: 0,
                spacingBottom: 0
            },

            title: {
                text: title
            },

            pane: {
                startAngle: -105,
                endAngle: 105,
                background: []
            },

            // the value axis
            yAxis: {
                min: 0,
                max: 100,
                minorTickInterval: 'auto',
                minorTickWidth: 1,
                minorTickLength: 10,
                minorTickPosition: 'inside',
                minorTickColor: '#666',

                tickPixelInterval: 30,
                tickWidth: 2,
                tickPosition: 'inside',
                tickLength: 10,
                tickColor: '#666',
                labels: {
                    step: 5,
                    rotation: 'auto'
                },
                plotBands: plotBands
            },

            series: [{
                name: 'Performance',
                data: [data],
                tooltip: {
                    valueSuffix: ' %'
                }
            }]

        });
    }

    var positivePlotBand =
        [{
            from: 0,
            to: 40,
            color: '#DF5353' // red

        }, {
            from: 41,
            to: 80,
            color: '#DDDF0D' // yellow
        }, {
            from: 81,
            to: 100,
            color: '#55BF3B' // green
        }];

    var negativePlotBand =
        [{
            from: 0,
            to: 40,
            color: '#55BF3B' // green
        }, {
            from: 41,
            to: 80,
            color: '#DDDF0D' // yellow
        }, {
            from: 81,
            to: 100,
            color: '#DF5353' // red

        }];
}