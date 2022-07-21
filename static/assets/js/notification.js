/**
 * Created by rawnak on 4/30/17.
 */

$(document).ready(function () {
    var count = 0; //count of announcements
    var task_count = 0; //count of tasks
    var total_count = 0; //total counts
    var t_loop = 0; //for top 5 comments
    var a_loop = 0;
    if (WORKFLOW == 'aBX3RODumf') {
        //Count top 5 tasks and show in the list
        $.ajax({
            type: "GET",
            url: inbox + "?item_status=todo&id=notifier",
            dataType: "json",
            success: function (data) {
                $.each(data, function (i, d) {
                    if (t_loop != 5) {
                        $('#task_list').append("<a class='list-group-item media' data-task=" + d.task + " data-application=" + d.application + " href='#'>You have a task from <span style='color:#009688'><b>" + d.sent_by + "</b></span>, app: <span style='color:#009688'><b>" + d.app_number + "</b></span></a>");
                        t_loop++;
                    }
                });
                if (data.length > 5) {
                    $('#task_list').append("<a class='view-more f-500' style='color:#009688' href='/workflow/case/inbox/'#'>View More Task</a>")
                }

                $('#task_list').find("a:not('.view-more')").on("click", function (event) {
                    event.preventDefault();
                    var outer = {
                        application: $(this).data('application'),
                        task: $(this).data('task')
                    };

                    localStorage.setItem("outer", JSON.stringify(outer));
                    var tasks_url = "/workflow/case/inbox/";
                    window.location = tasks_url;
                });
            },
            error: function (response) {
                console.log(response);
            }
        });

        //Count tasks
        $.ajax({
            type: "GET",
            url: all_delegations_api + "?item_status=todo",
            dataType: "json",
            success: function (data) {
                task_count = data.length
                if (task_count == 0) {
                    $("#task_counts").html("No");
                }
                else {
                    $("#task_counts").html(task_count);
                }
                total_count = total_count + task_count
                $("#count").empty().html(total_count);
            },
            error: function (response) {
                console.log(response);
            }
        });
    }
    //Count unseen comments from api

    $.ajax({
        type: "GET",
        url: all_recipients_api,
        dataType: "json",
        success: function (data) {

            $.each(data, function (i, d) {
                if (d.status == "unseen" && d.users == userId) {
                    count++;
                }
            });
            if (count == 0) {
                $("#announce_count").html("No");
            }
            else {
                $("#announce_count").html(count);
            }

            total_count = total_count + count;

            $("#count").empty().html(total_count);


        },
        error: function (response) {
            console.log(response);

        }
    });


    var update_data = {
        status: "seen",
    };


    //ANNONCEMENT NOTIFICATIONS CLICK
    $("#announcements").on("click", function (event) {
        event.preventDefault();
        $.ajax({
            type: "GET",
            url: all_recipients_api,
            dataType: "json",
            success: function (data) {
                var id_count = 0;
                var unseen_comments_id = []; //unseen comments ids
                $.each(data, function (i, d) {

                    if (d.status == "unseen" && d.users == userId) {

                        unseen_comments_id[id_count] = d.id;
                        id_count++;
                    }
                });

                for (u = 0; u < unseen_comments_id.length; u++) {
                    // console.log(all_recipients_api + unseen_comments_id[u]);
                    var status_url = "/socket/status/" + unseen_comments_id[u] + "/";
                    $.ajax({
                        type: "PATCH",
                        url: status_url,
                        data: JSON.stringify(update_data),
                        "processData": false,
                        "headers": {
                            "content-type": "application/json",
                        },
                        success: function (data) {
                            // console.log("successful");
                        },
                        error: function (response) {
                            console.log(response);
                        }

                    });

                }
                total_count = total_count - count;
                count = 0;
                if (count == 0) {
                    $("#announce_count").html("No");
                }
                else {
                    $("#announce_count").html(count);
                }
                $("#count").empty().html(total_count);
                window.location = announcement_url;

            },
            error: function (response) {
                console.log(response);
            }
        });


    });


    //SOCKET OPERATIONS


    var socket = io.connect(location.protocol + '//' + location.hostname + ':' + socket_listening_port);
    if (DMS = "9dL53eBFDK") {
        socket.on('pending', function (message) {
            var html = '<a href="/dms/document/upload/standard_upload/filesave/pendingmetalist/" id="zmdi-cloud-done" class="c-black"><i class="zmdi zmdi-cloud-done c-black m-r-2"></i>' + " Pending Documents(" + message + ")" + '</a>';
            $("#zmdi-cloud-done").empty().append(html);
        });
    }


    socket.on('announcement', function (message) {
        var flag = 0;
        //Escape HTML characters
        var data = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        //Append message to the bottom of the list
        //new
        var chat_data = JSON.parse(data);

        for (i = 0; i < chat_data.recipients.length; i++) {

            if (chat_data.recipients[i] == userId) {


                flag = 1;

            }
        }

        var elem = ($.parseHTML(chat_data.message)[0].data);
        if (flag == 1) {

            count++;
            if (count == 0) {
                $("#announce_count").html("No");
            }
            else {
                $("#announce_count").html(count);
            }
            total_count++;
            $("#count").empty().html(total_count);
            $("#modal_msg").html(elem);
            $('#single_message').modal().show();
            flag = 0;
        }

    });
    if (WORKFLOW == 'aBX3RODumf') {
        socket.on('task', function (message) {
            var flagt = 0;

            //Escape HTML characters
            var data = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            //Append message to the bottom of the list
            //new
            var chat_data = JSON.parse(data);

            for (i = 0; i < chat_data.recipients.length; i++) {

                if (chat_data.recipients[i] == userId) {

                    flagt = 1;

                }
            }

            var elem = ($.parseHTML(chat_data.message)[0].data);
            if (flagt == 1) {

                task_count++;
                if (task_count == 0) {
                    $("#task_counts").html("No");
                }
                else {
                    $("#task_counts").html(task_count);
                }
                total_count++;
                $("#count").empty().html(total_count);
                $("#modal_task").html(elem);
                $("#single_task").modal().show();
                //here
                flagt = 0;

                //new
                $.ajax({
                    type: "GET",
                    url: inbox + "?item_status=todo",
                    dataType: "json",
                    success: function (data) {
                        append_count = 0;
                        $.each(data, function (i, d) {
                            if (append_count == 0) {
                                $('#task_list').prepend("<a class='list-group-item media' data-task=" + d.task + " data-application=" + d.application + " href='#'>You have a task from <span style='color:#009688'><b>" + d.sent_by + "</b></span>, app:<span style='color:#009688'><b>" + d.app_number + "</b></span></a>");
                                a_loop++;
                                if ((t_loop + a_loop) >= 5) {
                                    document.getElementById("task_list").lastChild.remove();
                                }

                                append_count++;

                            }

                        });
                        $('#task_list').find("a").on("click", function (event) {
                            event.preventDefault();
                            var outer = {
                                application: $(this).data('application'),
                                task: $(this).data('task')
                            };

                            localStorage.setItem("outer", JSON.stringify(outer));
                            var tasks_url = "/workflow/case/inbox/";
                            window.location = tasks_url;

                        });


                    },
                    error: function (response) {
                        console.log(response);
                    }
                });
                //new
            }


        });
    }
    var windowHeight = $(window).height();
    var newHeight = Math.round((80 / 100) * windowHeight);    //60 % OF CURRENT WINDOW HEIGHT
    $('#notification_bar').css({
        "height": newHeight, "overflow-y": "auto"
    });
});