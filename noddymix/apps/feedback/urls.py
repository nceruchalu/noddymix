from django.conf.urls import patterns, url
from noddymix.apps.feedback import views

urlpatterns = patterns('',
                       # song request page
                       url(r"^$", views.feedback, name="feedback"),
                       )
