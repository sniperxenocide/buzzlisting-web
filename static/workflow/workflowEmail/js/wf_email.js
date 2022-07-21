/**
 * Created by mrityunjoy on 2/28/17.
 */
    let wf_email,
        $wf_email=$('#wf_email'),
        $email_preview = $('#email_preview'),
        $email_preview_sender =$('#email_preview .sender'),
        $email_preview_receiver =$('#email_preview .receiver'),
        $email_preview_mail =$('#email_preview .mail'),
        $dateRangeField = $('input[name="daterange"]');

    wf_email = $wf_email.DataTable({
        processing: true,
        serverSide: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        ajax: $.fn.dataTable.pipeline({
            url: wf_email_api,
            pages: 1 // number of pages to cache
        }),
        scrollY: 300,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Case", "data": "task"},
            {"title": "Type", "data": "taskinfo.type"},
            {"title": "Subject", "data": "subject"},
            {"title": "Mail Address", "data": "sender"},
            {"title": "Error email", "data": "error"},
            {"title": "Status", "data": "status"},
            {"title": "Date", "data": "date"},
        ],
        columnDefs:[
            {
                targets: 0,
                width: "25%",
                orderable:false,
                render: (data, a, b)=>{
                    let taskName;
                    if(b.taskinfo.task_name == null){
                        taskName = ""
                    }else{
                        taskName = b.taskinfo.task_name
                    }
                    return "<span class='c-black'>"+"id: "+"</span>"+"#"+b.task+"</br>"+
                            "<span class='c-black'>"+"Project: "+"</span>"+b.projectinfo.project_name+"</br>"+
                            "<span class='c-black'>"+"Process: "+"</span>"+b.taskinfo.process+"</br>"+
                            "<span class='c-black'>"+"Task: "+"</span>"+taskName+"</br>"
                }
            },
            {
                targets: 1,
                width: "1%",
            },
            {
                targets: 2,
                width: "15%",
                orderable:false
            },
            {
                targets: 3,
                width: "25%",
                orderable:false,
                render:(data, a, b)=>{
                    return "Sender: "+b.sender+"</br>"+
                            "Receiver: "+b.receiver
                }
            },
            {
                targets: 4,
                width: "6%",
                orderable:false
            },
            {
                targets: 5,
                width: "11%",
            },
            {
                targets: 6,
                width: "18%",
                orderable: false,
                render: (data, a, b)=>{
                    if(b.date){
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    }else{
                        return ""
                    }
                }
            }
        ],
        order: [[6,'desc']],
    });

    let table = $wf_email.DataTable();
    $wf_email.on('dblclick', 'tr', function () {
        let data = table.row(this).data();
        let log_url = data.id;
        // $('#email_preview .case').text(caseId);
        // $email_preview.modal().show();
        $.ajax({
            url: wf_email_api+log_url,
            method:'GET',
            success: function (res) {
                let sender = res.sender;
                let receiver = res.receiver;
                let message = res.message;
                $email_preview_sender.text(sender);
                $email_preview_receiver.text(receiver);
                $email_preview.find('.mail').html($('<div/>').html(data.message).text());
                $email_preview.modal().show();
            }
        });
    });

    //---------------DateRangePicker Search--------------------

    $dateRangeField.daterangepicker({
        "opens": "left",
        autoUpdateInput: false,
            locale: {
                "cancelLabel": "Clear",
            }
    });
    $dateRangeField.on('apply.daterangepicker', function (ev, picker) {
        let from = picker.startDate.format('YYYY-MM-DD HH:mm:ss.sss');
        let to = picker.endDate.format('YYYY-MM-DD HH:mm:ss.sss');
        console.log("from:" + from);
        console.log("to:" + to);
        $(this).val(from + ' to ' + to);

        let dateFilter = {};
        dateFilter.from = from;
        dateFilter.to = to;

        wf_email.iCacheLower = -1;
        wf_email.clearPipeline();
        wf_email.columns(1).search(from);
        wf_email.columns(2).search(to);
        wf_email.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });
    $('.input-mini').addClass("date_form");
    $('.applyBtn').removeClass('btn-success').addClass('btn-info');
    $('.cancelBtn').removeClass('btn-default').addClass('bgm-bluegray');