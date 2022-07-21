/**
 * Created by rawnak on 3/23/17.
 */

function load_js() {

    /*-----vendor Code new ------*/
    var $vendor_input = $('#n_po_vendor_name_');

    // $.ajax({
    //   url: vendor + '?name=' + $vendor_input.val(),
    //   dataType: "JSON",
    //   success: function( xmlResponse ) {
    //       console.log(xmlResponse);
    //     var data = $( "geoname", xmlResponse ).map(function() {
    //       return {
    //         value: $( "name", this ).text() + ", " +
    //           ( $.trim( $( "countryName", this ).text() ) || "(unknown country)" ),
    //         id: $( "geonameId", this ).text()
    //       };
    //     }).get();
    //       console.log(data);
    //     $vendor_input.autocomplete({
    //       source: data,
    //       minLength: 0,
    //       select: function( event, ui ) {
    //         log( ui.item ?
    //           "Selected: " + ui.item.value + ", geonameId: " + ui.item.id :
    //           "Nothing selected, input was " + this.value );
    //       }
    //     });
    //   }
    // });

    // $vendor_input.on('input', function () {
    //     /*vendor code er value empty korte hobe*/
    //     if ($vendor_input.val().length > 2) {
    //         $.ajax({
    //             url: vendor + '?name=' + $vendor_input.val(),
    //             method: "GET",
    //             dataType: "JSON",
    //             success: function (data) {
    //                 $('#vendor_list').empty();
    //                 $.each(data, function (k, v) {
    //                     $('#vendor_list').append("<option data-vendor_code='" + v.code + "'>" + v.name +" (" + v.code + " )"+"</option>")
    //                 })
    //             },
    //             error: function (response) {
    //                 $.each(JSON.parse(response.responseText), (k, v) => {
    //                     $vendor_name.val('');
    //                     notify('Sorry!!! ', v, '', 'danger', 5000)
    //                 });
    //             }
    //         });
    //         var val = this.value,
    //             vendor_code;
    //         if ($('#vendor_list option').filter(function () {
    //                 if (this.value === val) {
    //                     vendor_code = $(this).data('vendor_code');
    //                 }
    //                 return this.value === val;
    //             }).length) {
    //             console.log(vendor_code);
    //         }
    //     }
    //
    //
    // });
    /*-----End vendor Code new ------*/

}
setTimeout(load_js, 500);