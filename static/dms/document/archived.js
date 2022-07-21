/**
 * Created by mrityunjoy on 4/12/17.
 */
{
    let tags_obj = JSON.parse($("<div/>").html(tags).text());
    console.log("tagobj",tags_obj.length);
    //---------Document View----------
    var viewDocument = function ($selector, filepath) {
        let media = filepath.split("/workflow");
        let fileUrl = api.pdf.view + api.url.base + media[1];
        let iFrame = '<iframe id="docView" name="docView" ' +
            'style="width:95%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
            'allowfullscreen webkitallowfullscreen ' +
            'src="' + fileUrl + '"></iframe>';
        $($selector).html(iFrame);
    };
    viewDocument('.wi-preview', file);


    //---------------------Created on-----------------------

    var time = Helper.utcToLocal(created_at, 'Do MMMM YYYY') + ' at ' + Helper.utcToLocal(created_at, 'hh:ss a');
    $('.upload_on').append("Created on " + time);

    let metadata_obj = JSON.parse($("<div/>").html(metadatas).text());
    console.log(metadata_obj);
    $.each(metadata_obj, function (key, value) {
        var html = '<li class="ng-binding" style="padding: 5px 0 5px 20px;">' +
            '<i class="zmdi zmdi-chevron-right"></i><strong>' + value.displayname + ": " + '</strong>' + value.value + '</li>';
        $('.pmo-contact').find('ul').append(html);
    });

    //-----------------Tags--------------
    if(tags_obj.length > 0 ){
        $('.archive_tags').append('<hr>');
    }
    $.each(tags_obj, function (key, value) {
        var html = '<label class="label label-primary f-12 m-r-5" style="display: inline-block;">' + value + '</label>';
        $('.archive_tags').append(html);
    });

    //------------Restore Archive------------
    $(document).on('click', '#restore_archive', function (e) {
        // $.ajax({
        //     url: "/api/v1/dms/documents/restoreArchive/"+docid,
        //     method:'PATCH'
        // })
        var params = {};
        params.doc_id = docid;
        HttpClient.url = api.document.restoreArchive + docid + '/?operation=restore_archive';
        HttpClient.method = 'GET';
        // window.close();
        return HttpClient.call();
    });
    //----------restore file preview---------
    $(document).on('click', '#linkedfile', function (e) {
        var file = $(this).data('file');
        console.log("file", file);
        let iFrame = '<iframe id="docView" ' +
            'data-printurl="' + api.pdf.view + api.url.base + file + '" ' +
            'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
            'allowfullscreen webkitallowfullscreen ' +
            'src="' + api.pdf.view + api.url.base + file + '"></iframe>';
        $('.modal-preview').html(iFrame);
        $('#viewFile').modal('show');
    });
    //-------version preview--------------
    $(document).on('click', '#version_a', function (e) {
        var file = $(this).data('file');
        console.log("file", file);
        let iFrame = '<iframe id="docView" ' +
            'data-printurl="' + api.pdf.view + api.url.base + file + '" ' +
            'style="width:100%; height:' + window.innerHeight / 1.1741379310344828 + 'px; border:0;" ' +
            'allowfullscreen webkitallowfullscreen ' +
            'src="' + api.pdf.view + api.url.base + file + '"></iframe>';
        $('.modal-preview').html(iFrame);
        $('#viewFile').modal('show');
    })
}
