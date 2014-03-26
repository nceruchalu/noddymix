from django.conf.urls import patterns, url
from django.contrib.auth import views as auth_views
from noddymix.apps.account import views
from noddymix.apps.relationship import views as rlp_views
from noddymix.apps.audio import views as audio_views

urlpatterns = patterns('',
                       url(r'^logout/$', auth_views.logout,
                        {'next_page':'/'}, name='logout'),
                       url(r'^account/error/$', views.loginerror),
                       
                       url(r'^login/$', views.login, name='login'),
                       url(r'^profile/$', views.profile, name='profile'),
                       url(r'^settings/$', views.settingspage, name='settings'),
                       
                       url(r'^u/(?P<id>\d+)/$', views.userpage,
                           name="userpage"),
                       url(r'^u/(?P<id>\d+)/playlists/$',
                           audio_views.userplaylists, name="userplaylists"),
                       url(r'^u/(?P<id>\d+)/followers/$', rlp_views.followers,
                           name="followers"),
                       url(r'^u/(?P<id>\d+)/following/$', rlp_views.following,
                           name="following"),
                       
                       url(r'^account/edit/avatar/$', views.editavatar,
                           name='acct_editavatar'),
                       url(r'^account/edit/cover/$', views.editcover,
                           name='acct_editcover'),
                       url(r'^account/delete/avatar/$', views.deleteavatar,
                           name='acct_deleteavatar'),
                       url(r'^account/delete/cover/$', views.deletecover,
                           name='acct_deletecover'),
                       )

