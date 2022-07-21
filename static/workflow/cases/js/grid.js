/**
 * Created by rawnak on 5/23/17.
 */
// function clearAllInputs(selector) {
//   $(selector).find(':input').each(function() {
//     if(this.type == 'submit'){
//           //do nothing
//       }
//       else if(this.type == 'checkbox' || this.type == 'radio') {
//         this.checked = false;
//       }
//       else if(this.type == 'file'){
//         var control = $(this);
//         control.replaceWith( control = control.clone( true ) );
//       }else{
//         $(this).val('');
//       }
//    });
// }
$(document).on('click', '.add_grid_row', function (e) {
    e.preventDefault();
    var $table = $(this).closest('.add_div').siblings('.table');
    $table.find('tbody').find('tr:empty').remove();
    var $orginal = $table.find('tbody').find('tr:first');
    var $cloned = $orginal.clone();

    $cloned.find("input, textarea, file").val("").end(); // input type text and textarea clean value
    $cloned.find('.files_list').empty();
    $cloned.find('.help-block').remove();
    $cloned.find('.has-error').removeClass('has-error');

    $cloned.appendTo($table);

    $cloned.find('.bootstrap-select').replaceWith(function () {
        return $('select', this);
    });
    $cloned.find('select').selectpicker();


    // Show upload file names
    // $(document).find($new_form).find("input:file").change(function (e) {
    //     console.log("ok");
    //     var $near_class = $(this).parent();
    //     var files = e.target.files;
    //
    //     for (var i = 0, file; file = files[i]; i++) {
    //         $near_class.siblings(".files_list").append('<li>' + file.name + '</li>')
    //     }
    // });
    // $(document).find($new_form).find('input:file').on('click', function () {
    //     var $length = $(this).parent().siblings('.files_list').children().length;
    //     if ($(this).val() != "" || $length > 0) {
    //         $(this).parent().siblings('.files_list').empty();
    //     }
    // });

});

$(document).on('click', '.delete_grid_row', function (e) {
    e.preventDefault();
    var table = $(this).closest('.table');
    var tr_count = table.find('tbody').find('tr').length;

    if (tr_count > 1) {
        $(this).closest('tr').remove();
    } else {
        notify('Sorry!!', 'At least one row is required', '', 'danger', 5000);
    }
});