/**
 * Created by adnan0944 on 3/1/17.
 */

{
    let geology;

    // Datatable
    $('.zmdi-search').attr('title', 'search');
    geology = $('#commercial').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/commercial/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 500,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "House Address", "data": "Address"},
            {"title": "Area", "data": "Area"},
            {"title": "Price", "data": "ListPrice"},
            {"title": "Code", "data": "ListPriceCode"},
            {"title": "Type", "data": "Type2"},
            {"title": "Total Area", "data": "TotalArea"},
            {"title": "Use", "data": "Use"},
            {"title": "MLS#", "data": "MLSNumber"},

        ],
        columnDefs: [
            {
                targets:0,
                "render": (data, a, b)=> {
                    var path ="http://52.60.129.77/Commercial/Media/";
                    return '<img src='+ path + b.MLSNumber+ '-1.jpeg onerror="this.src=\'http://52.60.129.77/nomedia.jpg\'" width="100px"; height="50px"; />'+'  '+b.Address;
                }
            },
            {
                targets: 5,
                "render": (data, a, b) => {

                    return b.TotalArea + ' ' + b.TotalAreaCode;
                }
            },
        ],
        order: [[ 0, "desc" ]],
    });

}