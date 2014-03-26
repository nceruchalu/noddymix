from django.conf.urls import patterns, url
from noddymix.apps.activity import views

urlpatterns = patterns('',
                       # uncomment these urls when ready to allow viewing &
                       # editing of specific activities
                       #url(r'^(?P<id>\d+)/$', views.activity,
                       #    name="activity"),
                       #url(r'^(?P<id>\d+)/delete/$', views.delete,
                       #    name='activity_delete'),
                       )
