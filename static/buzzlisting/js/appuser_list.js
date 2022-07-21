/**
 * Created by adnan0944 on 18/3/18.
 */

{
    let appuser,
    $dateRangeField = $('input[name="daterange"]');

    // Datatable
    $('.zmdi-search').attr('title', 'search');
    appuser = $('#appuser').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/appUserList/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 500,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "Username", "data": "username"},
            {"title": "Email", "data": "emailPhone"},
            {"title": "Registered At", "data": "registered_at"},
            {"title": "Source", "data": "source"},
            {"title": "Current Status", "data": "registration"},
            {"title": "Unregistered At", "data": "unregistered_at"},

        ],
        columnDefs: [
            {
                targets: 2,
                "render": (data, a, b) => {
                    if (b.registered_at) {
                        return moment(data).format('MMMM Do YYYY, h:mm:ss a')
                    } else {
                        return ""
                    }
                }
            },
            {
                targets: 3,
                "render": (data, a, b) => {
                      if(b.source=='1') {
                          return "Facebook"
                      }else{
                          return "Email"
                      }
                }

            },
            {
                targets: 4,
                "render": (data, a, b) => {
                      if(b.registration=='1') {
                          return "Registered"
                      }else{
                          return "Unregistered"
                      }
                }

            },
        ],
        order: [[ 0, "desc" ]],
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
        let from = moment(picker.startDate, 'YYYY-MM-DD hh:mm A').format();
        let to = moment(picker.endDate, 'YYYY-MM-DD hh:mm A').format();
        // let from = picker.startDate.format('YYYY-MM-DD HH:mm:ss.sss');
        // let to = picker.endDate.format('YYYY-MM-DD HH:mm:ss.sss');
        $(this).val(from + ' to ' + to);

        let dateFilter = {};
        dateFilter.from = from;
        dateFilter.to = to;

        appuser.iCacheLower = -1;
        appuser.clearPipeline();
        appuser.columns(1).search(from);
        appuser.columns(2).search(to);
        appuser.draw(false);
    });
    $dateRangeField.on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
    });

}