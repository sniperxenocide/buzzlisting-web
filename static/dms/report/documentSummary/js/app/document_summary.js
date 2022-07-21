/**
 * Created by mrityunjoy on 1/25/17.
 */

{

    let user_api = '/api/v1/user',
        $selectUserReport = $("#select_user_report"),
        $docSumChart = $("#doc_sum_chart"),
        doctypeSum = [
            [[0, 100]],
            [[1, 200]],
            [[2, 300]],
        ],
        docTypeTick = [
            [0, "InfoSapex"],
            [1, "Expo"],
            [2, "ExpoInfo"],
        ],
        docSumTick = [
            [0, "Imrul Vai"],
            [1, "Abeda Apu"],
            [2, "Andalib Vai"],
            [3, "Rasel Vai"],
            [4, "Rawnak"],
            [5, "Shadhin"],
            [6, "Shuvo"],
            [7, "Aziz Vai"],
            [8, "Mamun Vai"],
            [9, "Dipu Vai"],
            [10, "Shamim Vai"],
            [11, "Asif Vai"],
            [12, "Nur-Uddin Vai"],
            [13, "Riyad Vai"],
            [14, "Sharmin Apu"],
            [15, "Sayam Vai"],
            [16, "Tanvir Vai"],
            [17, "NamJanina Vai"],
            [18, "Mamun Vai"],
            [19, "Mamun Vai"],
            [20, "Mamun Vai"],
            [21, "Abeda Apu"],
            [22, "Andalib Vai"],
            [23, "Rasel Vai"],
            [24, "Rawnak"],
            [25, "Shadhin"],
            [26, "Shuvo"],
            [27, "Aziz Vai"],
            [28, "Mamun Vai"],
            [29, "Dipu Vai"],
            [30, "Shamim Vai"],
            [31, "Asif Vai"],
            [32, "Nur-Uddin Vai"],
            [33, "Riyad Vai"],
            [34, "Sharmin Apu"],
            [35, "Sayam Vai"],
            [36, "Tanvir Vai"],
            [37, "NamJanina Vai"],
            [38, "Mamun Vai"],
            [39, "Mamun Vai"],
            [40, "Mamun Vai"],
            /*[41, "Abeda Apu"],
            [42, "Andalib Vai"],
            [43, "Rasel Vai"],
            [44, "Rawnak"],
            [45, "Shadhin"],
            [46, "Shuvo"],
            [47, "Aziz Vai"],
            [48, "Mamun Vai"],
            [49, "Dipu Vai"],
            [50, "Shamim Vai"],*/
            /*[51, "Asif Vai"],
            [52, "Nur-Uddin Vai"],
            [53, "Riyad Vai"],
            [54, "Sharmin Apu"],
            [55, "Sayam Vai"],
            [56, "Tanvir Vai"],
            [57, "NamJanina Vai"],
            [58, "Mamun Vai"],
            [59, "Mamun Vai"],
            [60, "Mamun Vai"],
            [61, "Abeda Apu"],
            [62, "Andalib Vai"],
            [63, "Rasel Vai"],
            [64, "Rawnak"],
            [65, "Shadhin"],
            [66, "Shuvo"],
            [67, "Aziz Vai"],
            [68, "Mamun Vai"],
            [69, "Dipu Vai"],
            [70, "Shamim Vai"],
            [71, "Asif Vai"],
            [72, "Nur-Uddin Vai"],
            [73, "Riyad Vai"],
            [74, "Sharmin Apu"],
            [75, "Sayam Vai"],
            [76, "Tanvir Vai"],
            [77, "NamJanina Vai"],
            [78, "Mamun Vai"],
            [79, "Mamun Vai"],
            [80, "Mamun Vai"],
            [81, "Abeda Apu"],
            [82, "Andalib Vai"],
            [83, "Rasel Vai"],
            [84, "Rawnak"],
            [85, "Shadhin"],
            [86, "Shuvo"],
            [87, "Aziz Vai"],
            [88, "Mamun Vai"],
            [89, "Dipu Vai"],
            [90, "Shamim Vai"],
            [91, "Asif Vai"],
            [92, "Nur-Uddin Vai"],
            [93, "Riyad Vai"],
            [94, "Sharmin Apu"],
            [95, "Sayam Vai"],
            [96, "Tanvir Vai"],
            [97, "NamJanina Vai"],
            [98, "Mamun Vai"],
            [99, "Mamun Vai"],
            [100, "Mamun Vai"],*/

        ],
        docSumData = [
            [[0, 4.1]],
            [[1, 1.8]],
            [[2, 2]],
            [[3, 4.5]],
            [[4, 3.7]],
            [[5, 5.6]],
            [[6, 2.6]],
            [[7, 4.1]],
            [[8, 1.8]],
            [[9, 2]],
            [[10, 4.5]],
            [[11, 3.7]],
            [[12, 5.6]],
            [[13, 4.1]],
            [[14, 1.8]],
            [[15, 2]],
            [[16, 4.5]],
            [[17, 37.7]],
            [[18, 55.6]],
            [[19, 47.1]],
            [[20, 47.1]],
            [[21, 15.8]],
            [[22, 15.8]],
            [[23, 12.8]],
            [[24, 13.8]],
            [[25, 11.8]],
            [[26, 14.8]],
            [[27, 19.8]],
            [[28, 16.8]],
            [[29, 13.8]],
            [[30, 11.8]],
            [[31, 10.8]],
            [[32, 19.8]],
            [[33, 17.8]],
            [[34, 15.8]],
            [[35, 14.8]],
            [[36, 12.8]],
            [[37, 12.8]],
            [[38, 15.8]],
            [[39, 18.8]],
            [[40, 71.8]],
            /*[[41, 51.8]],
            [[42, 51.8]],
            [[43, 71.8]],
            [[44, 71.8]],
            [[45, 19.8]],
            [[46, 81.8]],
            [[47, 71.8]],
            [[48, 17.8]],
            [[49, 165.8]],
            [[50, 13.8]],*/
            /*[[51, 14.8]],
            [[52, 14.8]],
            [[53, 15.8]],
            [[54, 41.8]],
            [[55, 51.8]],
            [[56, 61.8]],
            [[57, 12.8]],
            [[58, 13.8]],
            [[59, 17.8]],
            [[60, 16.8]],
            [[61, 13.8]],
            [[62, 13.8]],
            [[63, 21.8]],
            [[64, 31.8]],
            [[65, 31.8]],
            [[66, 12.8]],
            [[67, 14.8]],
            [[68, 187.8]],
            [[69, 17.8]],
            [[70, 17.8]],
            [[71, 17.8]],
            [[72, 16.8]],
            [[73, 15.8]],
            [[74, 134.8]],
            [[75, 12.8]],
            [[76, 11.8]],
            [[77, 17.8]],
            [[78, 16.8]],
            [[79, 7.8]],
            [[80, 134.8]],
            [[81, 16.8]],
            [[82, 43.8]],
            [[83, 44.8]],
            [[84, 4.8]],
            [[85, 43.8]],
            [[86, 76.8]],
            [[87, 7.8]],
            [[88, 76.8]],
            [[89, 15.8]],
            [[90, 65.8]],
            [[91, 43.8]],
            [[92, 2.8]],
            [[93, 10.8]],
            [[94, 1.8]],
            [[95, 3.8]],
            [[96, 9.8]],
            [[97, 8.8]],
            [[98, 6.8]],
            [[99, 3.8]],
            [[100, 5.8]],*/
        ];

    //--------On load get Doc Summary--------------
    /*docSumChart($docSumChart, doctypeSum, docTypeTick);*/
    //-------Get User Name for dropdown------------
    if (user_role == 1) {
        console.log("ok");
        docSumChart($docSumChart, docSumData, docSumTick);

        $.ajax({
            type: "GET",
            url: user_api,
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                $selectUserReport.find('optgroup[label="Users"]')
                            .append($('<option value="' + d.id + '">' + d.first_name + ' ' + d.last_name + ' (' + d.username + ') ' + '</option>'));
                });
                $selectUserReport.find('optgroup[label="Doctypes"]')
                            .append($('<option value="0">' + 'All Document Type' + '</option>'));
                $selectUserReport.selectpicker('refresh');
                $selectUserReport.selectpicker('val', [user_id]);
            },
            error: function (response) {
                console.log(response);
            }
        });
        /*$selectUserReport.find('optgroup[label="DocTypes"]')
         .append($('<option value="4">' + 'DocTypes' + '</option>'));*/
        //-------Get Document Record-------------------

        $selectUserReport.on('change', function () {
            if (this.value == 0) {
                refreshSection($docSumChart, doctypeSum, docTypeTick);
            }
            else if (this.value == 1) {
                refreshSection($docSumChart, docSumData, docSumTick);
            } else if (this.value == 2) {
                refreshSection($docSumChart, doctypeSum, docTypeTick);
            }
        });
    } else {
        docSumChart($docSumChart, doctypeSum, docTypeTick);
        $selectUserReport.find('optgroup[label="Users"]').append($('<option value=' + user_id + '>' + user + '</option>'));
        /*$selectUserReport.find('optgroup[label="DocTypes"]')
         .append($('<option value="0">' + 'DocTypes' + '</option>'));*/
    }


    //---------Refresh Section-----------------------
    function refreshSection(chartObject, chartData, chartTick) {
        chartObject.empty();
        docSumChart(chartObject, chartData, chartTick);
    }

    //-------Flot Bar Chart------------------------
    function docSumChart(chartObject, chartData, chartTick) {
        let margin;
        if (chartData.length < 10) {
            margin = 2;
        } else {
            margin = 0.010;
        }
        $.plot(chartObject, chartData, {
            series: {
                lines: {
                    fill: true
                },
                points: {show: false},
                bars: {
                    show: true,
                    align: 'center',
                    barWidth: 0.8,
                    fill: 1,
                    fillColor: "#3c3a6e",
                    lineWidth: 0,
                },
                highlightColor: '#304096'
            },
            xaxis: {
                tickLength: 0,
                ticks: chartTick,
                autoscaleMargin: margin,
            },
            yaxis: {
                min: 0
            },

            grid: {
                hoverable: true,
                borderWidth: {
                    top: 1,
                    right: 1,
                    bottom: 1,
                    left: 1
                },
                borderColor: {
                    top: "#e5e5e5",
                    right: "#e5e5e5",
                    bottom: "#a5b2c0",
                    left: "#a5b2c0"
                }
            },
            tooltip: {
                show: true,
                cssClass: "flotTip",
                content: "%x has %y Documents",
                defaultTheme: false
            }
        });
    }

}
