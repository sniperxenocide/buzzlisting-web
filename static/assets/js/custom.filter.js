WorkflowApp.filter('humanReadableTime', function (value) {
    return moment(value).format("DD MMM YYYY");
});