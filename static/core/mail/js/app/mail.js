import mail from '../../../../../static/assets/js/workflow.application'

let modalData;

new mail.WorkflowApp({
    el: '#content',
    data: {
        'tableData': {},
        'requireAuth': false,
        'server': '',
        'port': '',
        'account_from': '',
        'password': '',
        'from_mail': '',
        'from_name': '',
        'fgClassObj': {'fg-line': true, 'fg-toggled': false},
        'secure_connection': 'No',
        'send_mail': false,
        'mail_to': ''

    },
    methods: {
        generateDataTable(){
            this.$http.get(api.eform.list).then(response => {
                this.tableData = response.body
            });

        },
        editMail() {
            //this.$http.get(`${api.eform.edit}${id}/`).then(response => {
            //    PMDesigner.dynaformDesigner(response.body);
            //});
            //console.log('okaty');
            if ($(event.target).hasClass('c-black')) {

                this.server = modalData.server;
                this.port = modalData.port;
                this.account_from = modalData.account_from;
                this.password = (modalData.password == '' || modalData.password == undefined) ? '' : modalData.password;
                this.from_mail = modalData.from_mail;
                this.from_name = modalData.from_name;
                this.fgClassObj['fg-toggled'] = true;
                this.secure_connection = modalData.connection_type;

                if (modalData.password == undefined || modalData.password == '') {
                    this.requireAuth = false
                } else {
                    this.requireAuth = true
                }

                if (modalData.mail_to == undefined || modalData.mail_to == '') {
                    this.send_mail = false;
                } else {
                    this.send_mail = true;
                }

                this.mail_to = modalData.mail_to;

                let $modal = $('#mail_modal');
                $modal.modal();
            }
        },
        saveMail(){

            let obj = {
                server: this.server,
                port: this.port,
                account_from: this.account_from,
                password: this.password,
                from_mail: this.from_mail,
                from_name: this.from_name,
                secure_connection: this.secure_connection,
                mail_to: this.mail_to
            };

            //console.log(obj);
            var formParsley = $('#email_server_setup').parsley();
            formParsley.validate();
            if (formParsley.isValid()) {
                console.log('okay');
            }
        }
    },
});


let $table = $('#mail');
$table.DataTable({
    processing: true,
    serverSide: true,
    ajax: $.fn.dataTable.pipeline({
        url: location.origin + '/media/mail.json',
        pages: 1
    }),
    scrollY: 300,
    deferRender: true,
    scroller: true,
    order: [[0, "desc"]],
    columns: [
        {"title": "Engine", "data": "engine"},
        {"title": "Server", "data": "server"},
        {"title": "From", "data": "account_from"},
        {"title": "Connection", "data": "connection_type"},
        {"title": "to", "data": "mail_to"}
    ],
    columnDefs: [
        {
            "targets": 0,
            "width": "15%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        },
        {
            "targets": 1,
            "width": "20%",
            "render": (data, a, b) => {
                if (data == null) {
                    return '-';
                } else {
                    return data + ':' + b.port;
                }
            }
        },
        {
            "targets": 2,
            "width": "30%",
            "render": (data, a, b) => {
                if (data == null) {
                    return '-';
                } else {
                    return 'Account: ' + data + ',<br/> Mail: ' + b.from_mail + ',<br/> Name: ' + b.from_name;
                }
            }
        },
        {
            "targets": 3,
            "width": "15%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        },
        {
            "targets": 4,
            "width": "20%",
            "render": (data) => {
                if (data == null) {
                    return '-';
                } else {
                    return data;
                }
            }
        }
    ],
    createdRow: function (row, data, dataIndex) {
        $(row).attr('v-on:click', 'editMail');
        //console.log($(row));
    }
});

let table = $('#mail').DataTable();

$table.find('tbody').on('click', 'tr', function () {
    let data = table.row(this).data();
    //setting modalData value
    modalData = data;
    //console.log(modalData);

    let $zdmiDelete = $('#delete_button');
    let $zdmiEdit = $('#edit_button');
    //var $zdmiadd = $('#add_user_button');


    if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
        $zdmiEdit.removeData('process-cat-id').removeClass('c-black');
        //$zdmiadd.addClass('c-black');
    }
    else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
        $zdmiDelete.attr({
            "data-toggle": "modal",
            "data-target": ""
        });
        $zdmiEdit.removeData("process-cat-id").data("process-cat-id", data.id).addClass('c-black');
        $zdmiEdit.attr({
            "data-toggle": "modal",
            "data-target": ""
        });
    }
});

