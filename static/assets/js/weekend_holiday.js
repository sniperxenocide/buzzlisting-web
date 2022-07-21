let _weekday = $('.week_day');
let _holiday_list_dt = $('#holiday_list');
let _holiday_date_picker = $('.holiday_date_picker');
let _holiday_entry_form = $('#holiday_entry_form');
let _holiday_entry_parsley_form = null;
let _save_holiday_button = $('#save_holiday_button');
let _holiday_dt = null;


{
    function show_errors(json_text) {
        let errors = JSON.parse(json_text);
        if (errors) {
            $.each(errors, (k, v) => {
                notify('', v, '', 'danger', 3000);
            });
        }
    }

    function checkbox_values(selector) {
        let val = [];

        $(`${selector}:checked`).each(function (i) {
            val[i] = {"day": $(this).val()};
        });

        return val;
    }

    function weekday() {
        _weekday.click(() => {
            let data = checkbox_values('.week_day');

            $.ajax({
                url: WeekendAPIURI,
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                processData: false,
                data: JSON.stringify(data),
                success: (res) => {
                    notify('', 'Weekday saved successfully', '', 'success', 3000);
                },
                error: (res) => {
                    show_errors(res.responseText);
                }
            });
        });
    }

    function holiday() {
        _holiday_entry_parsley_form = _holiday_entry_form.parsley();

        _holiday_date_picker.datetimepicker({
            format: 'YYYY-MM-DD',
            minDate: moment()
        });

        _holiday_dt = _holiday_list_dt.DataTable({
            processing: true,
            serverSide: true,
            ajax: $.fn.dataTable.pipeline({
                url: HolidayAPIURI,
                pages: 1 // number of pages to cache
            }),
            order: [[0, "desc"]],
            scrollY: 300,
            deferRender: true,
            scroller: true,
            columns: [
                {"title": "ID", "data": "id"},
                {"title": "Date", "data": "date"},
                {"title": "Description", "data": "description"},
                {"title": "Action", "data": "id"},
            ],
            columnDefs: [
                {"visible": false, "targets": 0},
                {
                    targets: 1,
                    width: "20%",
                    render: (data) => {
                        return moment(data).format('LL');
                    }
                },
                {
                    targets: 2,
                    width: "60%"
                },
                {
                    targets: 3,
                    render: (data) => {
                        return `<button type="button" class="delete_holiday btn btn-danger waves-effect" data-holiday-id="${data}">Delete</button>`;
                    }
                }
            ],
            initComplete: () => {
                $(document).on('click', '.delete_holiday', (e) => {
                    e.preventDefault();
                    let holiday_physical_id = $(e.target).data('holiday-id');

                    $.ajax({
                        url: `${HolidayAPIURI}${holiday_physical_id}/`,
                        method: "DELETE",
                        success: (res) => {
                            _holiday_dt.clearPipeline().draw('page');
                            notify('', 'Holiday deleted successfully', '', 'success', 3000);
                        },
                        error: (res) => {
                            show_errors(res.responseText);
                        }
                    })
                });
            }
        });

        _save_holiday_button.click((e) => {
            e.preventDefault();
            _holiday_entry_parsley_form.validate();

            if (!_holiday_entry_parsley_form.isValid()) {
                return;
            }

            $.ajax({
                url: HolidayAPIURI,
                method: "POST",
                data: {
                    'date': $('input[name=date]').val(),
                    'description': $('input[name=description]').val(),
                },
                success: (res) => {
                    _holiday_dt.clearPipeline().draw();
                    $('input[name=description]').val('');
                    notify('', 'Holiday saved successfully', '', 'success', 3000);
                },
                error: (res) => {
                    show_errors(res.responseText);
                }
            });
        });
    }

    function init() {
        weekday();
        holiday();
    }

    init();

}