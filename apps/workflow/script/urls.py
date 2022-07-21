from django.conf.urls import url
from apps.workflow.script import views as scripting

urlpatterns = [
     url(r'^start_script$', scripting.start_scripting, name='start'),
     # url(r'^execute$', scripting.exec_script, name='execute_script'),
     url(r'^write$', scripting.write_script, name='write_script'),
     url(r'^saved$', scripting.save_script, name='save_script'),
     url(r'^delete$', scripting.delete_files, name='delete_script'),
     url(r'^modify$', scripting.modify_files, name='modify_script'),
     url(r'^save_modifacation$', scripting.save_modification, name='save_modification'),
     url(r'^create_template$', scripting.create_template, name='create_template'),
     url(r'^save_template$', scripting.save_template, name='save_template')

]