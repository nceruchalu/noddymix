"""
Django settings for noddymix project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

import os
import socket
from datetime import datetime, timedelta

# import sensitive information
from settings_secret import *

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# DEBUG mode will only happen on my local machine
if socket.gethostname() == 'Nnodukas-MacBook-Pro.local':
    DEBUG = True
else:
    DEBUG = False

TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Noddy', 'nceruchalu@gmail.com'),
    )

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DATABASES_MYSQL_NAME,
        'USER': DATABASES_MYSQL_USER,
        'PASSWORD': DATABASES_MYSQL_PASSWORD,
        'HOST': '',
        'PORT': '',
    }
}

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ['www.noddymix.com', 'noddymix.com',
                 'nceruchalu.webfactional.com']

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'UTC'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = False

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
if DEBUG == True:
    #STATIC_URL = '/static/'
    STATIC_URL = '/' # do runserver with --nostatic
else:
    STATIC_URL = AWS_STATIC_BUCKET_URL

# Additional locations of static files
if DEBUG == True:
    STATICFILES_DIRS = (
        os.path.join(os.path.dirname(__file__), 'static').replace('\\','/'),
        os.path.join(os.path.dirname(__file__), 'static/mobile/'),
        )
else:
    STATICFILES_DIRS = (
        os.path.join(os.path.dirname(__file__), 'static').replace('\\','/'),
        os.path.join(os.path.dirname(__file__), 'static/mobile/build/NoddyMix/production/'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# be sure to have SECRET_KEY setup

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

# register django social auth exception middleware
MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_auth.middleware.SocialAuthExceptionMiddleware',
    'noddymix.middleware.DetectMobileBrowserMiddleware',
)

ROOT_URLCONF = 'noddymix.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'noddymix.wsgi.application'

if DEBUG == True:
    TEMPLATE_DIRS = (
        os.path.join(os.path.dirname(__file__), 'templates'),
        os.path.join(os.path.dirname(__file__), 'static/mobile/'),
        )
else:
    TEMPLATE_DIRS = (
        os.path.join(os.path.dirname(__file__), 'templates'),
        os.path.join(os.path.dirname(__file__), 'static/mobile/build/NoddyMix/production/'),
        )
    
# Application definition
INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'social_auth',
    'imagekit',
    'haystack',
    'noddymix.apps.account',
    'noddymix.apps.feedback',
    'noddymix.apps.relationship',
    'noddymix.apps.audio',
    'noddymix.apps.activity',
    'noddymix.apps.search',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}


# the first 7 context preprocessors are used by default, but have to re-list
# them when adding request context, and social_auth context
TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
    "django.core.context_processors.request",
    "social_auth.context_processors.social_auth_by_name_backends",
    )


# for ability to see debug in templates using wildcards for IP addresses
if DEBUG: 
    from fnmatch import fnmatch
    class glob_list(list):
        def __contains__(self, key):
            for elt in self:
                if fnmatch(key, elt):
                    return True
            return False
    
    INTERNAL_IPS = glob_list(['127.0.0.1', '192.168.*.*', 
                              'www.noddymix.com', 'noddymix.com',
                              'nceruchalu.webfactional.com'])

# need access to temporary_file_path of uploaded mp3 files so configure Django
# to always read files to disk (during upload)
FILE_UPLOAD_HANDLERS = (
    "django.core.files.uploadhandler.TemporaryFileUploadHandler",
)


# ---------------------------------------------------------------------------- #
# Amazon AWS storage settings
# ---------------------------------------------------------------------------- #
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'


# Specify AWS S3 bucket to upload files to
if DEBUG == True:
    AWS_STORAGE_BUCKET_NAME = AWS_TEST_MEDIA_BUCKET_URL
else:
    AWS_STORAGE_BUCKET_NAME = AWS_MEDIA_BUCKET_URL

AWS_REDUCED_REDUNDANCY = True
expires=datetime.now() + timedelta(days=365)
AWS_HEADERS = {
    'Expires':expires.strftime('%a, %d %b %Y 20:00:00 GMT'),
}

# Read files from AWS cloudfront (requires using s3boto storage backend)
if DEBUG == True:
    AWS_S3_CUSTOM_DOMAIN = AWS_TEST_MEDIA_CLOUDFRONT_URL
else:
    AWS_S3_CUSTOM_DOMAIN = AWS_MEDIA_CLOUDFRONT_URL


# ---------------------------------------------------------------------------- #
# Search engine (`haystack`) settings
# ---------------------------------------------------------------------------- #
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.whoosh_backend.WhooshEngine',
        'PATH': os.path.join(os.path.dirname(__file__),'whoosh/noddymix_index'),
        'INCLUDE_SPELLING': True, # include spelling suggestions
        },
}


# ---------------------------------------------------------------------------- #
# `social_auth` settings
# ---------------------------------------------------------------------------- #
# the first one is default, add twitter and facebook auths
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'social_auth.backends.twitter.TwitterBackend',
    'social_auth.backends.facebook.FacebookBackend',
    'social_auth.backends.google.GoogleOAuth2Backend',
    )

# OAuth keys: Twitter, Facebook, Google
TWITTER_CONSUMER_KEY             = SOCIAL_TWITTER_KEY
TWITTER_CONSUMER_SECRET          = SOCIAL_TWITTER_SECRET

if DEBUG == True:
    FACEBOOK_APP_ID              = SOCIAL_FACEBOOK_TEST_ID
    FACEBOOK_API_SECRET          = SOCIAL_FACEBOOK_TEST_SECRET
else:
    FACEBOOK_APP_ID              = SOCIAL_FACEBOOK_ID
    FACEBOOK_API_SECRET          = SOCIAL_FACEBOOK_SECRET

if DEBUG == True:
    GOOGLE_OAUTH2_CLIENT_ID      = SOCIAL_GOOGLE_TEST_ID
    GOOGLE_OAUTH2_CLIENT_SECRET  = SOCIAL_GOOGLE_TEST_SECRET
else:
    GOOGLE_OAUTH2_CLIENT_ID      = SOCIAL_GOOGLE_ID
    GOOGLE_OAUTH2_CLIENT_SECRET  = SOCIAL_GOOGLE_SECRET

# Login URLs
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGIN_ERROR_URL = '/account/error/'

# Social Auth Exceptions Middleware
#   enable exception processing -- weird that this is done by setting to False
SOCIAL_AUTH_RAISE_EXCEPTIONS = False

# Tweak field lengths to prevent errors with MySQL InnoDB
SOCIAL_AUTH_UID_LENGTH = 222
SOCIAL_AUTH_NONCE_SERVER_URL_LENGTH = 200
SOCIAL_AUTH_ASSOCIATION_SERVER_URL_LENGTH = 135
SOCIAL_AUTH_ASSOCIATION_HANDLE_LENGTH = 125

# Default username if provider didn't return any useful value
SOCIAL_AUTH_DEFAULT_USERNAME = 'noddymix_user'


# ---------------------------------------------------------------------------- #
# `account` settings
# ---------------------------------------------------------------------------- #
# specify custom user model
AUTH_USER_MODEL = 'account.User'
# pagination: number of users on a page
USERS_PER_PAGE = 50
# max image file size: 25MB
MAX_IMAGE_SIZE = 25 * 1024 * 1024


# ---------------------------------------------------------------------------- #
# `imagekit` settings
# ---------------------------------------------------------------------------- #
# create appropriate thumbnails on source file save only
IMAGEKIT_DEFAULT_CACHEFILE_STRATEGY ='imagekit.cachefiles.strategies.Optimistic'
IMAGEKIT_CACHEFILE_DIR = 'cache'
IMAGEKIT_SPEC_CACHEFILE_NAMER ='imagekit.cachefiles.namers.source_name_as_path'


# ---------------------------------------------------------------------------- #
# audio settings
# ---------------------------------------------------------------------------- #
# accepted audio format (mp3) mime types
AUDIO_FORMATS = ["audio/mp3", "audio/mpeg"]
# max audio file size: 15MB
MAX_AUDIO_SIZE = 15 * 1024 *1024
# pagination: number of songs per page
SONGS_PER_PAGE = 100
# pagination: number of playlists per page. This should be multiples of 12 
# because each row either has 3 or 4 albums per page [lcm(3,4) = 12]
PLAYLISTS_PER_PAGE = 36 
# need to support non-string keys in request.session. Ints are keys of temporary
# playlists in their collections.
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'
# number of days to evaluate heavy rotation songs from
HEAVY_ROTATION_DAYS = 7


# ---------------------------------------------------------------------------- #
# `activity` settings
# ---------------------------------------------------------------------------- #
# max number of activities displayed on page load
ACTIVITY_LIMIT = 20
# ensure session cookie is sent on every request
SESSION_SAVE_EVERY_REQUEST = True
# allow client-side javascript access session cookie
SESSION_COOKIE_HTTPONLY = False

# redis specific
REDIS_PORT = 25373
REDIS_HOST = 'localhost'
ACTIVITY_REDIS_CHANNEL = 'feed'


# ---------------------------------------------------------------------------- #
# Email settings
# ---------------------------------------------------------------------------- #
# comes from settings_secret.py
