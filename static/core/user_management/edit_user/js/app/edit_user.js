{
    //  Single user information
    var old_image;
    var sig_old_image;
    $.ajax({
        type: "GET",
        url: edit_user_url,
        success: function (data) {
            //console.log(data);
            //  Expiry date
            if (data.expiry_date == null) {
                $("#date_box").val(null);
            } else {
                $("#date_box").val(moment(data.expiry_date).format('YYYY-MM-DD HH:mm'));
            }

            var role = data.role;
            var replaced_user_id = data.replaced_by;

            //  Status
            $("#status").selectpicker('refresh');
            $('#status').selectpicker('val', [data.status]);
            //console.log("old", data.configuration_type)
            $("#configuration").selectpicker('refresh');
            $('#configuration').selectpicker('val', [data.configuration_type]);
            //   Role
            $.ajax({
                type: "GET",
                url: all_role,
                dataType: "json",
                success: function (data) {
                    //console.log(data);
                    $.each(data, function (i, d) {
                        //console.log(d.name);
                        if(d.active == false){
                        $("#role_select").append($('<option>', {
                            class: 'c-gray',
                            value: d.id,
                            text: d.name,
                        }));
                        }else{
                            $("#role_select").append($('<option>', {
                            value: d.id,
                            text: d.name,
                        }));
                        }
                    });
                    $("#role_select").selectpicker('refresh');
                    $('#role_select').selectpicker('val', [role]);
                }
            });
            //image
            old_image = data.avatar;
            if (old_image) {
                $('.avatar_preview').append(
                    '<img src="' + old_image + '" class="img-responsive m-t-0">'
                );
            }
            sig_old_image = data.signature;
            if (sig_old_image) {
                $('.sig_preview').append(
                    '<img src="' + sig_old_image + '" class="img-responsive m-t-0">'
                );
            }

            $("#first_name").val(data.first_name);
            $("#last_name").val(data.last_name);
            $("#username").val(data.username);
            $("#email").val(data.email);
            $("#address").val(data.address);
            $("#replaced_by").val(data.replaced_by);
            $("#replaced_by_font").val(data.replaced_by_username);
            $("#phone_number").val(data.phone_number);
            $("#position").val(data.position);
            //$("#avatar").val(data.avatar);

        },
        error: function (response) {

        }
    });

    /*//   All User(Replaced by) Modal
     $('#replaced_by_font').one('click', function () {

     $.ajax({
     type: "GET",
     url: all_user,
     dataType: "json",
     data: param,
     success: function (data) {
     if (data.recordsTotal > param.start + data.data.length) {
     $('#next').removeClass("hide");
     }
     $.each(data.data, function (i, d) {
     if (d.id === user_id) {
     return true;
     }
     var this_user_name = d.first_name + ' ' + d.last_name+' (' +d.username+ ')';
     var old_user_name = $('#replaced_by_font').val();
     if (this_user_name == old_user_name) {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" checked="checked" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     } else {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     }
     });

     $('input:radio[name=radio_selected_user]')
     .change(function () {
     if ($(this).is(":checked")) {
     var name = $(this).siblings(".name").text();
     var val = $(this).val();
     $('#replaced_by').val(val);

     $('#replaced_by_font').val(name);
     }
     });
     }
     });
     });

     //  Next users on modal
     $("#next").on("click", function () {
     $("#previous").removeClass("hide");
     var start_new = parseInt(param.start) + parseInt(param.length);

     param = {
     'start': start_new,
     'length': 10,
     'draw': 1
     };

     $.ajax({
     type: "GET",
     url: all_user,
     dataType: "json",
     data: param,
     success: function (data) {
     if (data.recordsTotal == param.start + data.data.length) {
     $('#next').addClass("hide");
     }
     $("#user_list").children().remove();
     $.each(data.data, function (i, d) {
     if (d.id === user_id) {
     return true;
     }
     var this_user_name = d.first_name + ' ' + d.last_name+' (' +d.username+ ')';
     var old_user_name = $('#replaced_by_font').val();
     if (this_user_name == old_user_name) {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" checked="checked" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     } else {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     }
     });

     $('input:radio[name=radio_selected_user]')
     .change(function () {
     if ($(this).is(":checked")) {
     var name = $(this).siblings(".name").text();
     var val = $(this).val();
     $('#replaced_by').val(val);

     $('#replaced_by_font').val(name);
     }
     });
     }
     });
     })

     //  Previous users on modal
     $("#previous").on("click", function () {
     $("#next").removeClass("hide");
     if (param.start - param.length == 0) {
     $("#previous").addClass("hide");

     }
     var start_new = parseInt(param.start) - parseInt(param.length);
     param = {
     'start': start_new,
     'length': 10,
     'draw': 1
     };

     $.ajax({
     type: "GET",
     url: all_user,
     dataType: "json",
     data: param,
     success: function (data) {
     if (param.start == data.recordsTotal - param.length) {
     $('#previous').addClass("hide");
     $('#next').removeClass("hide");
     }
     $("#user_list").children().remove();
     $.each(data.data, function (i, d) {

     if (d.id === user_id) {
     return true;
     }
     var this_user_name = d.first_name + ' ' + d.last_name+' (' +d.username+ ')';
     var old_user_name = $('#replaced_by_font').val();
     if (this_user_name == old_user_name) {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" checked="checked" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     } else {
     $("#user_list").append('<div class="radio m-b-15">' +
     '<label>' +
     '<input type="radio" name="radio_selected_user" id="replaced_user" value=' + d.id + '>' +
     '<i class="input-helper">' +
     '</i>' + '<div class="name">' + d.first_name + ' ' + d.last_name +' (' +d.username+ ')'+ '</div>' +
     '</label>' +
     '</div>');
     }
     });

     $('input:radio[name=radio_selected_user]')
     .change(function () {
     if ($(this).is(":checked")) {
     var name = $(this).siblings(".name").text();
     var val = $(this).val();
     $('#replaced_by').val(val);

     $('#replaced_by_font').val(name);
     }
     });
     }
     });
     })

     //deselect radio button
     var radioState;
     $(document).on('click', 'input[name=radio_selected_user]', function () {

     if (radioState === this) {
     this.checked = false;
     $('#replaced_by').val('');
     $('#replaced_by_font').val('');
     radioState = null;

     } else {
     radioState = this;
     }
     });
     //End deselect radio button
     */
    //  Edit Single user information

    //  Date time picker formate
    $('#date_box').datetimepicker({
        format: 'YYYY-MM-DD hh:mm',
        useCurrent: false,
        //defaultDate: moment().add(50, 'years'),
        minDate: moment()

    });
    //  End Date time picker formate

    //    Parsley Validation
    var app = app || {};

    // Utils
    (function ($, app) {
        'use strict';

        app.utils = {};

        app.utils.formDataSuppoerted = (function () {
            return !!('FormData' in window);
        }());

    }(jQuery, app));

    (function ($, app) {
        'use strict';

        window.Parsley
            .addValidator('filemaxmegabytes', {
                requirementType: 'string',
                validateString: function (value, requirement, parsleyInstance) {

                    if (!app.utils.formDataSuppoerted) {
                        return true;
                    }

                    var file = parsleyInstance.$element[0].files;
                    var maxBytes = requirement * 1048576;

                    if (file.length == 0) {
                        return true;
                    }

                    return file.length === 1 && file[0].size <= maxBytes;

                },
                messages: {
                    en: 'File is to big'
                }
            })
            .addValidator('filemimetypes', {
                requirementType: 'string',
                validateString: function (value, requirement, parsleyInstance) {

                    if (!app.utils.formDataSuppoerted) {
                        return true;
                    }

                    var file = parsleyInstance.$element[0].files;

                    if (file.length == 0) {
                        return true;
                    }

                    var allowedMimeTypes = requirement.replace(/\s/g, "").split(',');
                    return allowedMimeTypes.indexOf(file[0].type) !== -1;

                },
                messages: {
                    en: 'File mime type not allowed'
                }
            });

    }(jQuery, app));

    (function ($, app) {
        'use strict';

        $('#create_user').parsley();

    }(jQuery, app));
    //    End Parsley Validation


    //    create user post request
    var frm = $('#create_user');
    frm.submit(function (e) {
        e.preventDefault();
        var data = new FormData($(this)[0]);

        if ($(this).serializeArray()[12].value == '') {
            data.delete('password')
        }
        if ($('#avatar').val() == "" && $('.fileinput-preview').children().length > 0) {
            data.delete('avatar');
        }
        else if ($('.fileinput-preview').children().length < 1) {
            data.set('avatar', '');
         }
        $.ajax({
            type: "PATCH",
            url: edit_user_patch,
            data: data,
            processData: false,
            contentType: false,
            success: function (data) {
                notify('Congratulations!!! ', ' User information updated Successfully ', '', 'success');
                setTimeout(function () {
                    window.location = user_management_page;
                }, 1200);

            },
            error: function (response) {
                var errors = response.responseText;
                $.each(JSON.parse(errors), function (key, value) {
                    var nMessage = key + ": " + value;
                    notify('', nMessage, '', 'danger');
                });
            }
        });
        return false;
    });
    //go back page
    $('#go_back').on('click', function (e) {
        e.preventDefault();
        window.location = user_management_page;
    })

    $("#password").on('keydown',function () {
        $('#cfrm_password').val('').parsley().reset();
    });
    $("#password").on('keyup',function () {
       if($("#password").val() != ""){
           $('#cfrm_password').attr('data-parsley-required', 'true');
       }else{
           $('#cfrm_password').removeAttr('data-parsley-required');
       }
    });
}