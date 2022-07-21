/**
 * Created by mamun on 2/20/17.
 */

var HttpClient = (function () {
    let self = {};
    self.url = '';
    self.method = 'GET';
    self.inputs = {};

    self.call = function () {
        console.log("url", self.url);
        console.log("method", self.method);
        return $.ajax({
            url: self.url,
            type: self.method,
            data: self.inputs,
        });
    };

    self.setContentType = function (contentType) {
        $.ajaxSettings.contentType = contentType;
    };

    self.reset = function () {
        $.ajaxSettings.contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
        $.ajaxSettings.processData = true;
        self.url = '';
        self.method = 'GET';
        self.inputs = {};
    };
    return self;
})();


var Helper = (function () {
    let self = {};
    self.utcToLocal = function (data, newFormat, oldFormat) {
        oldFormat = oldFormat || "YYYY-MM-DD HH:mm:ss";
        newFormat = newFormat || "MMMM Do YYYY";
        if (data == null) {
            return 'N/A';
        }
        var localTime = moment.utc(data, oldFormat).toDate();
        localTime = moment(localTime).format(newFormat);
        return localTime;
    };
    self.localToUTC = function (data, newFormat, oldFormat) {
        oldFormat = oldFormat || "DD/MM/YYYY hh:mm A";
        newFormat = newFormat || "YYYY-MM-DD HH:mm:ss";
        var date = moment(data, oldFormat).utcOffset('+00').format(newFormat);
        return date;
    };
    self.isValidUrl = function (url) {
        let urlregex = new RegExp("^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([0-9A-Za-z]+\.)");
        return urlregex.test(url);
    };
    /*Data  must be accositive array or object of array*/
    self.search = function (data, key, val) {
        $.each(data, function (k, v) {
            if (typeof v[key] !== 'undefined') {
                if (v[key] === val) {
                    return v;
                }
            }
        });
    }

    return self;
})();