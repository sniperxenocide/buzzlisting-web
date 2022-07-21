import json

#from apps.workflow.bpmn.models import *
from conf import settings


class EForm(object):
    _form_mode = ''
    _application = None

    def __init__(self, source, application, data=None):
        if data is not None:
            EForm._application = json.loads(data)
        else:
            EForm._application = json.loads(application.data)
        self._source = source.content
        self._content = json.loads(self._source).get('items')[0]
        EForm._form_mode = self._content['mode']

    # method switcher for fields
    @staticmethod
    def field_switcher(argument, obj):
        switcher = {
            'text': 'text_field',
            'datetime': 'text_field',
            'textarea': 'textarea_field',
            'dropdown': 'dropdown_field',
            'label': 'label',
            'button': 'button',
            'submit': 'button',
            'file': 'file_field',
            'radio': 'radio_field',
            'checkbox': 'checkbox_field',
            'checkgroup': 'checkgroup_field',
            'title': 'title_field',
            'grid': 'grid_field'
        }

        if switcher.get(argument) is not None:
            return getattr(EForm, switcher[argument])(obj)
        else:
            return ''

    @staticmethod
    def grid_field(obj):
        return GridItem(obj, EForm._application).generate_grid()

    # generate eForm and send html i hope
    def generate_form(self, preview=False, col_mode='md'):
        content = self._content
        column_mode = col_mode
        html = ''

        d = dict()
        d['name'] = content.get('name')
        d['type'] = content.get('type')

        # create row
        row = content.get('items')

        for r in row:
            html += "<div class='row'>"

            # create column
            for el in r:
                html += "<div class='col-{}-{}'>".format(column_mode, el.get('colSpan'))
                if el.get('type') is not None:
                    html += "<div class='form-group'>"
                    html += "<div class='fg-line'>"
                    html += EForm.field_switcher(el.get('type'), el)
                    html += '</div></div>'
                html += '</div>'
            html += "</div>"
            d['html'] = html

        return d

    # make the label
    @staticmethod
    def label(obj):
        label_text = obj.get('label')
        label_class = 'fg-label' if obj.get('type') != 'dropdown' else 'control-label f-500'
        required_class = "<span class='required_star'>*</span>" if obj.get('required') else ''
        return "<label class='{2}' id='{3}-label'> {0}</label>".format(label_text, required_class, label_class, obj.get('id'))

    # pass required definition
    @staticmethod
    def required(obj):
        if obj.get('type'):
            if EForm._application.get(obj.get('name')) is not None:
                return "data-parsley-required='true'" if obj.get('required') else ''
            else:
                return "data-parsley-required='true'" if obj.get('required') else ''
        else:
            return "data-parsley-required='true'" if obj.get('required') else ''

    # define the type
    @staticmethod
    def c_type(obj):
        t = {
            'integer': 'number'
        }

        return obj.get('type') if t.get(obj.get('dataType')) is None else t.get(obj.get('dataType'))

    # create html property
    @staticmethod
    def html_property(obj):
        name = obj.get('name')
        max_length = '' if obj.get('maxLength') is None else "maxLength='{}'".format(obj.get('maxLength'))

        if EForm._application.get(obj.get('variable')) is None:
            if obj.get('defaultValue') is None or obj.get('defaultValue') == '':
                value = ''
            else:
                value = "value='{}'".format(obj.get('defaultValue'))
        else:
            value = "value='{}'".format(EForm._application.get(obj.get('variable')))

        exclude_type = ['textarea', 'dropdown']

        if obj.get('validate') == '' or obj.get('validate') is None:
            if obj.get('type') in exclude_type:
                field_type = ''
            else:
                field_type = "type='{}'".format(EForm.c_type(obj))
        else:
            field_type = "pattern='{}'".format(obj.get('validate'))

        if obj.get('mode') == 'disabled':
            field_mode = "disabled"

        elif obj.get('mode') == 'view':
            field_mode = "readonly"

        elif obj.get('mode') == 'parent':
            if EForm._form_mode == 'disabled':
                field_mode = "disabled"
            elif EForm._form_mode == 'view':
                field_mode = "readonly"
            else:
                field_mode = ""

        else:
            field_mode = ""

        return '''
            name='{0}' placeholder='{1}' {2} {3} {4} id='{5}' {6} {7}
        '''.format(name, obj.get('placeholder'), max_length, EForm.required(obj),
                   value, obj.get('id'), field_type, field_mode)

    # create text field
    @staticmethod
    def text_field(obj):
        if obj.get('type') == 'datetime':
            date_format = obj.get('format')
            use_current = obj.get('useCurrent')
            min_date = obj.get('minDate')
            max_date = obj.get('maxDate')
            default_date = obj.get('defaultDate')
            view_mode = obj.get('viewMode')
            datetime = 'date-time-picker'

            return '''
                    {0}<input class='form-control {2}' {1} data-format = '{3}' data-use_current = '{4}'
                    data-min_date = '{5}' data-max_date = '{6}' data-default_date ='{7}' data-view_mode ='{8}'>
                    '''.format(EForm.label(obj), EForm.html_property(obj), datetime, date_format, use_current,
                               min_date, max_date, default_date, view_mode).replace('\n', '')
        else:
            datetime = ''
            return '''
                    {0}<input class='form-control {2}' {1}>
                    '''.format(EForm.label(obj), EForm.html_property(obj), datetime).replace('\n', '')
            # datetime = 'date-time-picker' if obj.get('type') == 'datetime' else ''

    # create textarea field
    @staticmethod
    def textarea_field(obj):
        if EForm._application.get(obj.get('variable')) is None:
            text_area_data = ''
        else:
            text_area_data = EForm._application.get(obj.get('variable'))

        return '''
        {0}<textarea class='form-control auto-size' rows=1 {1}>{2}</textarea>
        '''.format(EForm.label(obj), EForm.html_property(obj), text_area_data).replace('\n', '')

    # create dropdown field
    @staticmethod
    def dropdown_field(obj):
        select = ''

        if obj.get('options') is not None:
            for e in obj.get('options'):
                selected = ''
                if EForm._application.get(obj.get('variable')) == e.get('value'):
                    selected = 'selected'
                select += "<option value='{0}' {2}>{1}</option>".format(e.get('value'), e.get('label'), selected)
        return '''
        {0}<select class='selectpicker' data-live-search="true" data-selected-value="{3}" {1}>
        <option value="">Select Please</option>{2}
        </select>
        '''.format(EForm.label(obj), EForm.html_property(obj), select,
                   EForm._application.get(obj.get('variable'))).replace('\n', '')

    # create label field
    @staticmethod
    def label_field(obj):
        return "<label class='fg-label' id={1}>{0}</label>".format(obj.get('label'), obj.get('id'))

    # create button
    @staticmethod
    def button(obj):
        if obj.get('id') == 'add_more_po':
            count = "data-po-count=" + str(0)
        else:
            count = ''

        return '''
        <input class='btn bgm-bluegray waves-effect' id='{1}' name={4} type='{2}' {3} value='{0}'>
        '''.format(obj.get('label'), obj.get('id'), obj.get('type'), count, obj.get('name')).replace('\n', '')

    # create file filed
    @staticmethod
    def file_field(obj):
        if obj.get('mode') == 'view':
            if EForm._application.get(obj.get('name')) is not None:
                anchor = ''

                for f in EForm._application.get(obj.get('name')):
                    anchor += '<a href="{0}" target="_blank">{1}</a><br>'.format(settings.MEDIA_URL + f['location'],
                                                                                 f['name'])

            else:
                anchor = ''

            return '''
            <p class='f-500  m-b-20'>{0}</p>
            {1}
            '''.format(obj.get('label'), anchor)

        if EForm._application.get(obj.get('name')) is not None:
            anchor = ''

            for f in EForm._application.get(obj.get('name')):
                anchor += '<a href="{0}" target="_blank">{1}</a><br>'.format(settings.MEDIA_URL + f['location'],
                                                                             f['name'])

        else:
            anchor = ''

        return '''
        <div class='fileinput fileinput-new' data-provides='fileinput'>
            <span class='btn btn-primary btn-file m-r-10 waves-effect'>
                <span class='fileinput-new'>{0}</span>
                <input type='file' name='{1}' multiple {2} data-parsley-fileextension='pdf' accept=".pdf">
            </span>
            <ul class='files_list'>{3}</ul>
        </div>
        '''.format(obj.get('label'), obj.get('name'), EForm.html_property(obj), anchor)

    # radio filed
    @staticmethod
    def radio_field(obj):
        select = ''
        select += '<p class="f-500 m-b-0">{}</p>'.format(EForm.label(obj))

        if len(obj.get('options')) > 0:
            name = obj.get('variable')
            for e in obj.get('options'):
                if obj.get('defaultValue') == e.get('value'):
                    checked = 'checked'
                elif EForm._application.get(obj.get('variable')) == e.get('value'):
                    checked = 'checked'
                else:
                    checked = ''

                select += "<label class='radio radio-inline m-r-20'>" \
                          "<input {4} type='radio' name='{0}' value='{1}' {3}>" \
                          "<i class='input-helper'></i>{2}</label>" \
                    .format(name, e.get('value'), e.get('label'), EForm.html_property(obj), checked)

            return select

    # checkbox field
    @staticmethod
    def checkbox_field(obj):
        select = ''

        if len(obj.get('options')) > 0:
            name = obj.get('variable')
            for e in obj.get('options'):
                if e.get('value') == "1":
                    if EForm._application.get(obj.get('variable')) == e.get('value'):
                        check = 'checked'
                    else:
                        check = ""

                    select += "<div class='checkbox m-b-15'>" \
                              "<label><input type='checkbox' name = '{2}' value='{0}' {4} {3}>" \
                              "<i class='input-helper'></i>" \
                              "{1}</label></div>" \
                        .format(e.get('value'), obj.get('label'), name, EForm.html_property(obj), check)
                else:
                    continue

        return select

    # checkbox group field
    @staticmethod
    def checkgroup_field(obj):
        select = ''
        select += '<p class="f-500 m-b-20">{}</p>'.format(EForm.label(obj))

        if len(obj.get('options')) > 0:
            name = 'checkgroup-{}'.format(obj.get('variable'))
            variable_value = EForm._application.get(obj.get('variable'))

            for i, e in enumerate(obj.get('options')):
                checked = ''
                html_id = '{}{}'.format(obj.get('id'), i)

                if variable_value is not None and e.get('value') in variable_value:
                    checked = 'checked'

                select += "<div class='checkbox m-b-15' id='{3}'>" \
                          "<label><input type='checkbox' name='{2}' value='{0}' {4}>" \
                          "<i class='input-helper'></i>{1}</label></div>" \
                    .format(e.get('value'), e.get('label'), name, html_id, checked)

        return select

    # method switcher for h1
    @staticmethod
    def title_field(obj):
        return "<h4 {1} class='text-center m-t-5 m-b-5'>{0}</h4>".format(obj.get('label'), EForm.html_property(obj))


class GridItem:
    def __init__(self, grid_object, application_data):
        self.grid_object = grid_object
        self.columns = grid_object.get('columns')
        self.obj_variable = grid_object.get('variable')
        self.field = None
        self.td_item = ''
        self.th_item = ''
        self.rows = 0
        self.variable_value_list = application_data.get(self.obj_variable)
        self.current_value = None

    def generate_grid(self):
        if self.columns:
            if self.variable_value_list is not None:
                loop_range = len(self.variable_value_list)
            else:
                loop_range = 1

            for column in self.columns:
                self.th_item += '<th>{}</th>'.format(column['label'])

            for _ in range(loop_range):
                if self.variable_value_list is not None:
                    self.current_value = self.variable_value_list[_]

                for column in self.columns:
                    self.field = column
                    self.rows += 1

                    if column['type'] == 'text':
                        self.td_item += self.final_td(self.text_field())

                    if column['type'] == 'textarea':
                        self.td_item += self.final_td(self.text_area_field())

                    if column['type'] == 'dropdown':
                        self.td_item += self.final_td(self.dropdown_field())

                    if column['type'] == 'file':
                        self.td_item += self.final_td(self.file_field())

                self.td_item += "<td><a href='#'><i class='zmdi zmdi-delete f-20 c-red delete_grid_row'></i></a></td>"
                self.td_item = '<tr>{}</tr>'.format(self.td_item)

        return self.final_table()

    def set_required(self):
        if self.field['required']:
            return "data-parsley-required='true'"
        else:
            return ''

    def final_table(self):
        return '''
        <div class='grid'>
            <h4 class='text-center'>{label}</h4>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        {th_items}
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {td_items}
                </tbody>
            </table>
            <div class='add_div text-center'>
                <i class='add_grid_row zmdi zmdi-plus c-green f-20' data-add_row="{next_add_number}"></i>
            </div>
        </div>
        '''.format(**{
            'label': self.grid_object['label'],
            'rows': self.rows,
            'th_items': self.th_item,
            'td_items': self.td_item,
            'next_add_number': 1,
        })

    @staticmethod
    def final_td(item):
        return "<td><div class='form-group m-b-0'><div class='fg-line'>{}</div></div></td>".format(item)

    def get_name(self):
        return 'grid-{}-{}'.format(self.obj_variable, self.field['name'])

    def set_value(self, name):
        if self.current_value is not None:
            if self.current_value.get(name) is not None:
                return self.current_value.get(name)
            else:
                return ''
        else:
            return ''

    def common_attributes(self):
        attributes = {
            'type': self.field['type'],
            'name': self.get_name(),
            'placeholder': self.field['placeholder'],
            'maxLength': self.field['maxLength'],
            'required': self.set_required(),
            'value': self.set_value(self.field['name']),
            'class': 'form-control {}'.format(self.get_name())
        }
        return "type='{type}' name={name} class='{class}' placeholder='{placeholder}' maxLength='{maxLength}' " \
               "{required} value={value}".format(**attributes)

    def text_field(self):
        return '''<input {}>'''.format(self.common_attributes())

    def text_area_field(self):
        value_or_placeholder = self.field['placeholder'] if self.set_value(
            self.field['name']) == '' else self.set_value(self.field['name'])

        return "<textarea class='form-control auto-size' rows='{}' name={} {}>{}</textarea>".format(self.field['rows'],
                                                                                                    self.get_name(),
                                                                                                    self.set_required(),
                                                                                                    value_or_placeholder,
                                                                                                    )

    def dropdown_field(self):
        options = ''

        if self.field.get('options') is not None:
            for option in self.field.get('options'):
                selected = ''

                if option['value'] == self.set_value(self.field['name']):
                    selected = 'selected'

                options += "<option value='{0}' {2}>{1}</option>".format(option['value'], option['label'], selected)

        return '''<select class='selectpicker' data-live-search="true" value="{selected-value}"
        name={name} {required}>
                    <option value="">Select Please</option>
                    {options}
                </select>'''.format(**{
            'selected-value': self.set_value(self.field['name']),
            'name': self.get_name(),
            'required': self.set_required(),
            'options': options
        })

    def file_field(self):
        # To show saved file name and location

        # if self.set_value(self.field['name']) != "":
        #     anchor = ''
        #     f = self.set_value(self.field['name'])
        #     anchor = '<a href="{0}" target="_blank">{1}</a><br>'.format(settings.MEDIA_URL + f['location'], f['name'])
        # else:
        #     anchor = ''

        return '''
                <div class='fileinput fileinput-new' data-provides='fileinput'>
                    <span class='btn btn-default btn-file m-r-10 waves-effect'>
                        <span class='fileinput-new'>Attach</span>
                        <input type='file' name='{0}' {1} data-parsley-fileextension='pdf' accept=".pdf">
                    </span>
                    <ul class='files_list'>{2}</ul>
                </div>
                '''.format(self.get_name(), self.set_required(), "")
