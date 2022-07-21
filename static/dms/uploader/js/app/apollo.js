/**
 * Created by rawnak on 12/10/17.
 */
function DocumentNameSet() {
    var $add_form = $('#add_meta_data'),
        $ip_no = $add_form.find('input[name=ip_no]'),
        $admission_date = $add_form.find('input[name=admission_date]'),
        $dr_incharge = $add_form.find('input[name=dr_incharge]'),
        $file_name = $add_form.find('input[name=file_name]');

    function Set() {
        var value = '';
        if($admission_date.val()){
            value = value + 'DOA: '+ $admission_date.val() + ' '
        }
        if($ip_no.val()){
            value = value + 'IP : '+ $ip_no.val() + ' '
        }
        if($dr_incharge.val()){
            value = value + 'Dr.: '+ $dr_incharge.val()
        }
        // var value = $admission_date.val() + '_' + $ip_no.val() + '_' + $dr_incharge.val();
        $file_name.val(value)
    }

    $('input[name=ip_no], input[name=dr_incharge]').on('keyup', function () {
        Set();
    });
    $admission_date.on("dp.change", function () {
        Set();
    });
}
