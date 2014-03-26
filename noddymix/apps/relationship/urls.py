from django.conf.urls import patterns, url
from noddymix.apps.relationship import views

urlpatterns = patterns('',
                       url(r'^u/(?P<id>\d+)/follow/$', views.follow, 
                           name='follow'),
                       url(r'^u/(?P<id>\d+)/unfollow/$', views.unfollow, 
                           name='unfollow'),
                       )
