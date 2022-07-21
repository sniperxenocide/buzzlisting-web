/**
 * Created by rawnak on 6/8/17.
 */

$(document).ready(function () {
    var socket = io.connect(location.protocol + '//' + location.hostname + ':' + socket_listening_port);
    socket.on('app_count', function (message) {
        $.ajax({
            url: $app_count,
            method: "GET",
            dataType: "JSON",
            success: function (data) {
                $('#sidebar').find('#zmdi-inbox').html("<i class='zmdi zmdi-inbox'></i> Inbox (" + data.todo + ")");
                $('#inbox_case').DataTable().clearPipeline().draw();
                $('#sidebar').find('#zmdi-edit').html("<i class='zmdi zmdi-edit'></i> Draft (" + data.open + ")");
                $('#sidebar').find('#zmdi-forward').html("<i class='zmdi zmdi-forward'></i> Non Claimed (" + data.non_claimed + ")");
                $('#sidebar').find('#zmdi-check-square').html("<i class='zmdi zmdi-check-square'></i> Completed (" + data.completed + ")");

            },
            error: function (response) {
                console.log(response)
            }
        });
    });
});
