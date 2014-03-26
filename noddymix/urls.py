from django.conf.urls import patterns, include, url
from noddymix import views

# Uncomment the next two lines to enable the admin
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
                       # homepage is handled by apps.audio.urls
                       url(r'', include('noddymix.apps.audio.urls')),
                       url(r'', include('social_auth.urls')),
                       url(r'', include('noddymix.apps.account.urls')),
                       url(r'^request/',include('noddymix.apps.feedback.urls')),
                       url(r'^about/$', views.about, name="about"),
                       url(r'', include('noddymix.apps.relationship.urls')),
                       url(r'^search/', include('noddymix.apps.search.urls')),
                       url(r'^opensearch.xml$', views.opensearch,
                           name="opensearch"),
                       url(r'^activity/', 
                           include('noddymix.apps.activity.urls')),
                       url(r'^admin/', include(admin.site.urls)),
                       url(r'^status/$', views.status, name="status"),
                       
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
)

# need this when STATIC_URL is defined as root: '/'
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()
