let properties = {
    0: ['documents0', '']
};

function show_properties_() {
    for (let prop in properties) {
        if (properties[prop].length > 0) {
            let prop_args = properties[prop];

            for (let prop_arg in prop_args) {
                $(`#${prop_args[prop_arg]}`).show();
            }
        }
    }
}

function take_operation_(arg) {
    if (typeof arg !== 'undefined') {
        show_properties_();

        if (typeof properties[arg] !== 'undefined' && properties[arg].length > 0) {
            let prop_args = properties[arg];

            for (let prop_arg in prop_args) {
                $(`#${prop_args[prop_arg]}`).hide();
            }
        }
    }
}

(function () {
    setTimeout(function () {
        take_operation_($('select[name=loan_type]  option:selected').val())
    }, 200);

    $(document).on('change', '#loan_type', () => {
        let loan_type_value_ = $('select[name=loan_type]  option:selected').val();
        take_operation_(loan_type_value_)
    });
})();