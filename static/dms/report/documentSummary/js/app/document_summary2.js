/**
 * Created by mrityunjoy on 3/20/17.
 */
{
    let $selectUserReport = $("#select_user_report"),
        $doc_sum_chart = $("#doc_sum_chart");
    if (user_role == 1) {
        $.ajax({
            url: doc_sum_url,
            method: 'GET',
            success: function (res) {
                console.log(res);
                $doc_sum_chart.empty();
                highChart(res);
            }
        });
        $.ajax({
            type: "GET",
            url: user_api,
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                    $selectUserReport.find('optgroup[label="Users"]')
                        .append($('<option value="' + d.id + '">' + d.first_name + ' ' + d.last_name + ' (' + d.username + ') ' + '</option>'));
                });
                $selectUserReport.find('optgroup[label="Users"]')
                    .append($('<option value="all">' + "All Users" + '</option>'));
                $selectUserReport.find('optgroup[label="Doctypes"]')
                    .append($('<option value="doc">' + 'All Document Type' + '</option>'));
                $selectUserReport.selectpicker('refresh');
                $selectUserReport.selectpicker('val', ['all']);
            },
            error: function (response) {
                console.log(response);
            }
        });
        /*$selectUserReport.find('optgroup[label="DocTypes"]')
         .append($('<option value="4">' + 'DocTypes' + '</option>'));*/
        //-------Get Document Record-------------------

        $selectUserReport.on('change', function () {
            uid = this.value;
            if (uid == "all") {
                $.ajax({
                    url: doc_sum_url,
                    method: 'GET',
                    success: function (res) {
                        console.log(res);
                        $doc_sum_chart.empty();
                        highChart(res);
                    }
                });
            } else if (uid == "doc") {
                $.ajax({
                    url: doc_type_sum_url,
                    method: 'GET',
                    success: function (res) {
                        console.log(res);
                        $doc_sum_chart.empty();
                        highChart(res);
                    }
                });
            } else {
                $.ajax({
                    url: doc_sum_url + '?user=' + uid,
                    method: 'GET',
                    success: function (res) {
                        $doc_sum_chart.empty();
                        highChart(res);
                    }
                });
            }

        });
    }
    else {
        let uid = user_id;
        $.ajax({
            url: doc_sum_url + '?user=' + uid,
            method: 'GET',
            success: function (res) {
                $doc_sum_chart.empty();
                highChart(res);
            }
        });
        $selectUserReport.find('optgroup[label="Users"]').append($('<option value=' + user_id + '>' + user + '</option>'));
        $selectUserReport.find('optgroup[label="Doctypes"]')
            .append($('<option value="doc">' + 'All Document Type' + '</option>'));
        $selectUserReport.on('change', function () {
            let type = this.value;
            if (type == "doc") {
                $.ajax({
                    url: doc_type_sum_url + '?user=' + uid,
                    method: 'GET',
                    success: function (res) {
                        $doc_sum_chart.empty();
                        highChart(res);
                    }
                });
            } else {
                $.ajax({
                    url: doc_sum_url + '?user=' + uid,
                    method: 'GET',
                    success: function (res) {
                        $doc_sum_chart.empty();
                        highChart(res);
                    }
                });
            }
        });
    }

    function highChart(res) {
        Highcharts.chart('doc_sum_chart', {
            chart: {
                type: 'column',
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'category',
                labels: {
                    rotation: -90,
                    style: {
                        fontSize: '10px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                },
            },
            plotOptions: {
                series: {
                    pointWidth: 100,
                    color:"#3c3a6e"
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                gridLineWidth: .5,
                gridLineColor: '#eee',
            },
            legend: {
                enabled: false
            },
            tooltip: {
                pointFormat: 'Number of documents <b>{point.y:.1f}</b>'
                // pointFormat: 'Population in 2008: <b>{point.y:.1f} millions</b>'
            },
            series: [{
                name: 'Documents',
                data: res,
            }]
        });
    }


}