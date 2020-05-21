angular.module("umbraco.resources")
    .factory("ComplX.MailchimpPicker.Resource", function ($http) {
        return {
            getLists: function () {
                return $http.get("/umbraco/BackOffice/Api/MailChimpPickerApi/GetMailchimpLists");
            }
        };
    });