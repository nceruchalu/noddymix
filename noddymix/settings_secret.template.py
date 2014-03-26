"""
Template Secret Django settings for noddymix project.

Contains sensitive information to be used in Django's settings.py

The real version file is not to be shared publicly
"""

# Default database credentials
DATABASES_MYSQL_NAME = 'mysql_db_name' 
DATABASES_MYSQL_USER = 'mysql_db_username' 
DATABASES_MYSQL_PASSWORD = 'mysql_db_password'


# Make this unique, and don't share it with anybody.
SECRET_KEY = 'generated_by_django'


# Amazon Web Services properties
AWS_ACCESS_KEY_ID             = 'Amazon Web Services access key'
AWS_SECRET_ACCESS_KEY         = 'Amazon Web Services secret access key'
AWS_STATIC_BUCKET_URL         = 'AWS static files S3 bucket name'

AWS_TEST_MEDIA_BUCKET_URL     = 'AWS media files S3 bucket name, for testing'
AWS_MEDIA_BUCKET_URL          = 'AWS media files S3 bucket name, for production'

AWS_TEST_MEDIA_CLOUDFRONT_URL = 'AWS CDN linked to AWS test media S3 bucket'
AWS_MEDIA_CLOUDFRONT_URL    = 'AWS CDN linked to AWS production media S3 bucket'


# Social Auth Keys
# twitter auth key
# reference: https://dev.twitter.com/docs/auth/oauth/faq
SOCIAL_TWITTER_KEY          = 'Twitter Consumer Key'
SOCIAL_TWITTER_SECRET       = 'Twitter Consumer Secret'

# facebook login keys, for dev and prod environments
# reference: https://developers.facebook.com/docs/facebook-login
SOCIAL_FACEBOOK_TEST_ID     = 'Test Facebook App Id'
SOCIAL_FACEBOOK_TEST_SECRET = 'Test Facebook API Secret'
SOCIAL_FACEBOOK_ID          = 'Facebook App Id'
SOCIAL_FACEBOOK_SECRET      = 'Facebook API Secret'

# google auth keys, for dev and prod environments
# reference: https://developers.google.com/accounts/docs/OAuth2
SOCIAL_GOOGLE_TEST_ID       = 'Test Google Oauth2 Client Id'
SOCIAL_GOOGLE_TEST_SECRET   = 'Test Google Oauth2 Client Secret'
SOCIAL_GOOGLE_ID            = 'Google Oauth2 Client Id'
SOCIAL_GOOGLE_SECRET        = 'Google Oauth2 Client Secret'


# Email settings
# reference: https://docs.djangoproject.com/en/1.6/ref/settings/
EMAIL_HOST          = 'host to use for sending email'
EMAIL_HOST_USER     = 'username to use for the SMTP server' 
EMAIL_HOST_PASSWORD = 'password to use for the SMTP server'
DEFAULT_FROM_EMAIL  = 'webmaster@localhost'
SERVER_EMAIL        = 'root@localhost'

