import Vue from 'vue';
import VueResource from 'vue-resource';
let moment = require('moment');

Vue.use(VueResource);

Vue.http.headers.common['X-CSRFTOKEN'] = getCookie('csrftoken');

let WorkflowApp = Vue.extend({
    delimiters: ["@{", "}"],
});

WorkflowApp.filter('humanReadableDate', function (value) {
    return moment(value).format("DD MMM YYYY");
});

WorkflowApp.filter('humanReadableTime', function (value) {
    return moment(value).format("hh:mm A");
});

WorkflowApp.filter('humanReadableDateTime', function (value) {
    return moment(value).format("DD MMM YYYY hh:mm A");
});

export {
    WorkflowApp
}