{
    $(document).on('click', '.btn-login', (e) => {
        e.preventDefault();
        $.ajax({
            url: login_url,
            type: "POST",
            data: $('#login_form').serialize(),
            success: function () {
                let url_string = window.location.href;
                let url = new URL(url_string);
                let next_url = url.searchParams.get("next");

                if (next_url) {
                    window.location.replace(`${window.location.origin}${next_url}`);
                }
                else {
                    window.location.replace(dashboard_url);
                }
            },
            error: function (response) {
                $.each(JSON.parse(response.responseText), (k, v) => {
                    $.toaster(v, 'Error', 'danger');
                });
            }
        });
    });
}