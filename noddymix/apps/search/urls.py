from django.conf.urls import patterns, url
from noddymix.apps.search import views

urlpatterns = patterns('',
                       # song request page
                       url(r"^$", views.search, name="search"),
                       url(r'^p/$', views.search_playlists, 
                           name="search_playlists"),
                       url(r'^u/$', views.search_users, name="search_users"),
                       )
