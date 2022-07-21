let WorkflowApp = Vue.extend({
    delimiters: ["@{", "}"],
});

WorkflowApp.use(VeeValidate);

WorkflowApp.filter('humanReadableDate', function (value) {
    return moment(value).format("DD MMM YYYY");
});

WorkflowApp.filter('humanReadableTime', function (value) {
    return moment(value).format("hh:mm A");
});

WorkflowApp.filter('humanReadableDateTime', function (value) {
    return moment(value).format("DD MMM YYYY hh:mm A");
});


new WorkflowApp({
    el: '#content',
    components: {
        modal: vueboot.modal
    },
    data: {
        eforms: {},
        eform_title: '',
        eform_description: '',
    },
    methods: {
        EShowModal(modal){
            this.$refs[modal].showModal();
        },

        EHideModal(modal){
            this.$refs[modal].hideModal();
        },

        eFormListModal(modal){
            this.$http.get(api.eform.list).then(response => {
                this.eforms = response.body
            });

            this.EShowModal(modal);
        },

        createEformModal(modal, scope){
            this.eform_title = '';
            this.eform_description = '';
            //this.errors.clear(scope);
            this.EShowModal(modal);
        },

        createEform(modal, scope){
            let formData = {
                project: api.project.id,
                title: this.eform_title,
                description: this.eform_description,
            };

            this.$validator.validateAll(scope).then(success => {
                if (success) {
                    this.$http.post(api.eform.create, formData).then(
                        response => {
                            if (response.body['content'] === null) {
                                response.body['content'] = '';
                            }

                            this.eforms.push(response.body);
                            PMDesigner.dynaformDesigner(response.body);
                            this.errors.clear(scope);
                            this.EHideModal(modal);
                        },
                        response => {
                            for (let r in response.body) {
                                notify('', response.body[r], '', 'danger', 2000);
                            }
                        });
                }
            });
        },

        editEform(id) {
            this.$http.get(`${api.eform.edit}${id}/`).then(response => {
                if (response.body['content'] === null) {
                    response.body['content'] = '';
                }

                PMDesigner.dynaformDesigner(response.body);
            });
        },

        deleteEform(index, id){
            this.$http.delete(`${api.eform.delete}${id}/`).then(response => {
                if (response.status == 204) {
                    this.eforms.splice(index, 1);
                    notify('', 'EForm deleted successfully', '', 'success', 2000);
                }
            });
        },

        openVariableModal(){
            let pmvariables = new PMVariables();
            pmvariables.load();
        }
    }
});
