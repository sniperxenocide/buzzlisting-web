/**
 * Created by adnan0944 on 3/1/17.
 */

{
    let geology;

    // Datatable
    $('.zmdi-search').attr('title', 'search');
    geology = $('#condo').DataTable({
        processing: true,
        serverSide: true,
        ajax: $.fn.dataTable.pipeline({
            url: '/api/v1/condo/',
            pages: 1 // number of pages to cache
        }),
        scrollY: 500,
        deferRender: true,
        scroller: true,
        columns: [
            {"title": "House Address", "data": "Address"},
            {"title": "Area", "data": "Area"},
            {"title": "Beds", "data": "Bedrooms"},
            {"title": "Baths", "data": "Washrooms"},
            {"title": "Type", "data": "Type2"},
            {"title": "Price", "data": "ListPrice"},
            {"title": "SQFT", "data": "ApproxSquareFootage"},
            {"title": "MLS#", "data": "MLSNumber"},

        ],
        columnDefs: [
            {
                targets: 0,
                "render": (data, a, b) => {
                    var path ="http://52.60.129.77/Condo/Media/";
                    console.log(path);
                    return '<img src='+ path + b.MLSNumber+ '-1.jpeg onerror="this.src=\'http://52.60.129.77/nomedia.jpg\'" width="100px"; height="50px"; />'+'  '+b.Address;
                }
            }
        ],
        order: [[ 0, "desc" ]],
    });

}