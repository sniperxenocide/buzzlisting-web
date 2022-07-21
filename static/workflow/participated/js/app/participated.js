/**
 * Created by mrityunjoy on 1/1/17.
 */
let tooltip = $('[data-toggle="tooltip"]');

$(document).ready(function () {

    //cases header adding tooltip to icons
    tooltip.tooltip();
    $.ajax({
        type : 'GET',
        dataType : 'json',
        url: "/static/workflow/participated/cases_participated_dummy.json",
        success : function(data) {
            let html = '';
            $.each(data.data, function (i, value) {
                html += '<div class="list-group-item media">'+
                            '<div class="checkbox pull-left">'+
                                '<label>'+
                                    '<input type="checkbox" value="" class="cases_checkbox" data-task-id='+value.id+'>'+
                                    '<i class="input-helper">'+
                                    '</i>'+
                                '</label>'+
                            '</div>'+
                            '<div class="pull-right">'+
                                '<div class="actions dropdown">'+
                                    '<a href="#" data-toggle="dropdown" aria-expanded="true">'+
                                        '<i class="zmdi zmdi-more-vert">'+
                                        '</i>'+
                                    '</a>'+
                                    '<ul class="dropdown-menu dropdown-menu-right">'+
                                        '<li>'+'<a href="#">'+"Edit"+'</a>'+
                                        '<li>'+'<a href="#">'+"Delete"+'</a>'+'</li>'+
                                    '</ul>'+
                                '</div>'+
                            '</div>'+
                            '<div class="media-body" data-task-id-parent='+value.id+'>'+
                                '<div class="lgi-heading">'+"Task: "+value.task+'<br>'+
                                    '<small class="lgi-text">'+value.process+'</small>'+
                                '</div>'+
                                '<ul class="lgi-attrs">'+
                                    '<li>'+"Case: "+value.case+'</li>'+
                                    '<li>'+"Category: "+value.category+'</li>'+
                                    '<li>'+"Sent By: "+value.sent_by+'</li>'+
                                    '<li>'+"Due Date: "+value.due_date+'</li>'+
                                    '<li>'+"Last Modify: "+value.last_modify+'</li>'+
                                    '<li>'+"Priority: "+value.priority+'</li>'+
                                '</ul>'+
                            '</div>'+
                        '</div>';
            });

            $("#list_group").empty().append(html);
        }
    });

    //----------------Summary modal render-----------------

    //let assigned_task_ids = [];
    $(document).on('change', "input[type='checkbox']", function () {
        let input_checked = $("input[type='checkbox']:checked");
        if (input_checked) {
            let task_id = $(input_checked).data("task-id");
            /*let task_ids = $(this).data("task-id");
            if(jQuery.inArray(task_ids, assigned_task_ids) == -1) {
                assigned_task_ids.push(task_id);
            }
            console.log(assigned_task_ids);*/

            $.ajax({
                type : 'GET',
                dataType : 'json',
                url: "/static/workflow/cases/cases_summary"+task_id+".json",
                success : function(data) {
                    let caseProperty =  '<ul>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Process Name:  "+'</i>'+data.process+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Case Title :  "+'</i>'+data.case_title+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Case Number:  "+'</i>'+data.case_number+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Case Status:  "+'</i>'+data.case_status+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Case Uid:  "+'</i>'+data.case_uid+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" creator:  "+'</i>'+data.creator+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Create Date:  "+'</i>'+data.create_date+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Last Update:  "+'</i>'+data.last_update+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Case Description:  "+'</i>'+data.case_description+'</li>'+
                                        '</ul>';

                    $("#case_property").empty().append(caseProperty);

                    let currentTask =   '<ul>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Task:  "+'</i>'+data.task+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Current user :  "+'</i>'+data.current_user+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Task Init Date:  "+'</i>'+data.task_init_date+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Task Due Date:  "+'</i>'+data.task_due_date+'</li>'+
                                            '<li>'+'<i class="zmdi zmdi-dot-circle">'+" Finish Date:  "+'</i>'+data.finish_date+'</li>'+
                                        '</ul>';

                    $("#current_task").empty().append(currentTask);
                }
            });

        }

        if (input_checked.length) {
            if (input_checked.length > 1){
                $(".summary_icon").css("color", "#adadad").addClass("disabled");
            }
            else {
                $('.cases_delete').css("color", "#191717");
                $(".summary_icon").css("color", "#191717").removeClass("disabled");
            }
        }
        else {
            $('.cases_delete').css("color", "#adadad");
            $(".summary_icon").css("color", "#adadad").addClass("disabled");
        }

        //--------------sweetalert------------------
        /*$(document).on('click','.summary_icon', function () {
            $('#modalDefault').modal('show');
        });*/
        $('#sa-warning').click(function () {
            swal({
                title: 'Are you sure?',
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No, keep it'
            }).then(function () {
                swal(
                    'Deleted!',
                    'Your imaginary file has been deleted.',
                    'success'
                )
            }, function (dismiss) {
                // dismiss can be 'overlay', 'cancel', 'close', 'esc', 'timer'
                if (dismiss === 'cancel') {
                    swal(
                        'Cancelled',
                        'Your imaginary file is safe :)',
                        'error'
                    )
                }
            })
        });
    });

    //------------on double click open form-------------------------
    $(document).on('click', '.summary_icon', function () {
        if ($(this).hasClass("disabled")) {
            event.stopPropagation()
        } else {
            $('#modalDefault').modal("show");
        }
    });

    $(document).on('dblclick', '[data-task-id-parent]', function () {
        let task_id_parent = $(this).data('task-id-parent');
        console.log(e_form_url + task_id_parent);
        e_form_url = e_form_url + task_id_parent;
        window.location = e_form_url;
        /*$('#modalWider').modal('show');*/
    });


});