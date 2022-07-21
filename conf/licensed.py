import datetime

DEBUG = True

ALLOWED_HOSTS = ['*']
APP_HOST = '52.60.135.207'
# APP_HOST = 'buzzlisting.infosapex.com'

BRANDING = {
    'BRAND_NAME': 'InfoSapex',
    'PRODUCT_NAME': 'BPMN Process'
}

EXTERNAL_APPS = [
    'rest_framework',
    'oauth2_provider',
    'mptt',
    'debug_toolbar',
    'PyPDF2',
    'djcelery_email',
    'social_django',
    #'django_python3_ldap'
]

CORE_APPS = [
    'apps.core.rbac',
    'apps.core.loginReport',
    'apps.core.announcement',
    'apps.core.todo',
    'apps.core.mail',
    'apps.core.socket_chat',
    'apps.core.buzzlisting'
]

DMS_APPS = [
    'apps.dms.api',
    'apps.dms.api.category',
    #'apps.dms.api.document',
    'apps.dms.documents',
    'apps.dms.api.department',
    #'apps.dms.api.dms_activity',
]

WORKFLOW_APPS = [
    'apps.workflow.bpmn',
    'apps.workflow.email',
    'apps.workflow.script'
]

INSTALLED_APPS = [
                     'django.contrib.auth',
                     'django.contrib.contenttypes',
                     'django.contrib.sessions',
                     'django.contrib.messages',
                     'django.contrib.staticfiles',
                     'rest_framework_docs'
                 ] + EXTERNAL_APPS + CORE_APPS + DMS_APPS + WORKFLOW_APPS

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    # 'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.rbac.ModelBackend.AccountsMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'django.middleware.cache.FetchFromCacheMiddleware',
]

ROOT_URLCONF = 'conf.urls'

WSGI_APPLICATION = 'conf.wsgi.application'

DATABASES = {
    # 'default': {
    #     'ENGINE': 'django.db.backends.postgresql',
    #     'NAME': 'buzzlisting_new',
    #     'USER': 'bractb_fahim',
    #     'PASSWORD': '123456',
    #     'HOST': 'localhost',
    #     'PORT': '5432',
    # },
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'buzzlisting',
        'USER': 'buzzlisting',
        'PASSWORD': '123456',
        'HOST': 'localhost',
        'PORT': '5432',
    }
    # 'default': {
    #         'ENGINE': 'django.db.backends.postgresql',
    #         'NAME': 'buzzlisting',
    #         'USER': 'buzzlisting',
    #         'PASSWORD': '123456',
    #         'HOST': '13.250.246.101',
    #         'PORT': '5432',
    #     }
    # 'default': {
    #             'ENGINE': 'django.db.backends.postgresql',
    #             'NAME': 'buzzlisting',
    #             'USER': 'buzzlisting',
    #             'PASSWORD': '123456',
    #             'HOST': '52.60.135.207',
    #             'PORT': '5432',
    #         }
}

# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LOGIN_URL = '/login/'

LOGIN_EXEMPT_URLS = (
    r'^api/v1/*',
    r'oauth2_provider/token/',
    r'socket/*',
    #r'^workflow/case/account_opening/',
    r'^media/*'
)

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Dhaka'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# for global authentication
AUTHENTICATION_BACKENDS = ['apps.core.rbac.ModelBackend.EmailOrUsernameModelBackend']

# AUTHENTICATION_BACKENDS = (
#     'apps.core.rbac.ModelBackend.EmailOrUsernameModelBackend'
#     'social_core.backends.open_id.OpenIdAuth',
#     'social_core.backends.google.GoogleOpenId',
#     'social_core.backends.google.GoogleOAuth2',
#     'social_core.backends.google.GoogleOAuth',
#     'social_core.backends.twitter.TwitterOAuth',
#     'social_core.backends.facebook.FacebookOAuth2',
#     'social_core.backends.facebook.FacebookAppOAuth2'
#     'django.contrib.auth.backends.ModelBackend',
# )
#
# SOCIAL_AUTH_PIPELINE = (
#     'social_core.pipeline.social_auth.social_details',
#     'social_core.pipeline.social_auth.social_uid',
#     'social_core.pipeline.social_auth.social_user',
#     'social_core.pipeline.user.get_username',
#     'social_core.pipeline.user.create_user',
#     'social_core.pipeline.social_auth.associate_user',
#     'social_core.pipeline.social_auth.load_extra_data',
#     'social_core.pipeline.user.user_details',
#     'social_core.pipeline.social_auth.associate_by_email',
# )
# for ldap authentication
# AUTHENTICATION_BACKENDS += ['django_python3_ldap.auth.LDAPBackend']

AUTH_USER_MODEL = 'rbac.User'

# SESSION_EXPIRE_AT_BROWSER_CLOSE = True
#
# SESSION_COOKIE_AGE = 900

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.core.api.authentication.GreenOfficeBasicAuthentication',
        'oauth2_provider.ext.rest_framework.OAuth2Authentication',
    ),
    # 'DEFAULT_RENDERER_CLASSES': (
    #     'rest_framework.renderers.JSONRenderer',
    # )
}

# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://0.0.0.0/1",
#         "OPTIONS": {
#             "CLIENT_CLASS": "django_redis.client.DefaultClient",
#             # "SOCKET_CONNECT_TIMEOUT": 5,
#             # "SOCKET_TIMEOUT": 5,
#             # "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
#             # "CONNECTION_POOL_KWARGS": {"max_connections": 100},
#         }
#     }
# }

# SESSION_ENGINE = "django.contrib.sessions.backends.cache"
# SESSION_CACHE_ALIAS = "default"

# INTERNAL_IPS = ('127.0.0.1',)

# Elastic Search config
ELASTIC_HOST = 'localhost'
ELASTIC_PORT = 9200
WORKFLOW_SEARCH_INDICES = 'workflow'
DMS_SEARCH_INDICES = 'dms'

# Application config
DMS = "9dL53eBFD"
# DMS = ""
WORKFLOW = "aBX3RODum"
# WORKFLOW = ""


# user level config
#USER_DMS = "1q2w3e"
# USER_DMS = ""
#USER_WORKFLOW = "1q2w3e"
#USER_WORKFLOW = ""

# Mail config
EMAIL_BACKEND = 'djcelery_email.backends.CeleryEmailBackend'
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'sub4.mail.dreamhost.com'
EMAIL_PORT = '587'
EMAIL_HOST_USER = 'no-reply@buzzlisting.ca'
EMAIL_HOST_PASSWORD = 'listingbuzz00'
EMAIL_USE_TLS = True
# EMAIL_BACKEND = 'djcelery_email.backends.CeleryEmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = '587'
# EMAIL_HOST_USER = 'infosapex2@gmail.com'
# EMAIL_HOST_PASSWORD = 'info123456'
# EMAIL_USE_TLS = True

CELERY_EMAIL_TASK_CONFIG = {
    'name': 'djcelery_email_send',
    'ignore_result': False,
}

# Workflow Config
RISK_TASK_PERCENTAGE = 60

# Client Code
# CLIENT_NAME = 'xcb59hj'
# CLIENT_NAME = 'e78tfb9'
#CLIENT_NAME = 'z8t5y67'     # Apollo
CLIENT_NAME = 'aw6io2a' #Ebl
#CLIENT_NAME = ''

# open task with out login settings
OUT_TASK_ID = 10
OUT_USER = 'rawnak'
OUT_PASSWORD = 'admin'


# mail notification for document expiry
DAYS = 2

# CELERY SETTINGS
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

SESSION_COOKIE_AGE = 1800
SESSION_SAVE_EVERY_REQUEST = True

SOCKET_LISTENING_PORT = 4000

# Log config
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(levelname)s::(%(process)d %(thread)d)::%(module)s - %(message)s'
        },
    },
    'handlers': {
        'error': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'log/critical_error-{}.log'.format(datetime.datetime.now().date()),
            'formatter': 'default'
        },
        'warning': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': 'log/error-{}.log'.format(datetime.datetime.now().date()),
            'formatter': 'default'
        },
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    'loggers': {
        'django': {
            'handlers': ['error'],
            'level': 'ERROR',
            'propagate': False,
        },
        'warning_logger': {
            'handlers': ['warning'],
            'level': 'WARNING',
            'propagate': False,
        },
        "django_python3_ldap": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },

}

#social-auth
SOCIAL_AUTH_POSTGRES_JSONFIELD = True
SOCIAL_AUTH_RAISE_EXCEPTIONS = True

# The URL of the LDAP server.
LDAP_AUTH_URL = "ldap://localhost"
LDAP_AUTH_USE_TLS = False
LDAP_AUTH_SEARCH_BASE = 'dc=infosapex,dc=com'
LDAP_AUTH_OBJECT_CLASS = 'inetOrgPerson'

LDAP_AUTH_USER_LOOKUP_FIELDS = ('username',)
LDAP_AUTH_CLEAN_USER_DATA = 'django_python3_ldap.utils.clean_user_data'
LDAP_AUTH_SYNC_USER_RELATIONS = 'django_python3_ldap.utils.sync_user_relations'
LDAP_AUTH_FORMAT_SEARCH_FILTERS = 'django_python3_ldap.utils.format_search_filters'
# LDAP_AUTH_FORMAT_USERNAME = 'django_python3_ldap.utils.format_username_active_directory'
# LDAP_AUTH_ACTIVE_DIRECTORY_DOMAIN = 'infosapex.com'
# LDAP_AUTH_CONNECTION_USERNAME = 'cn=admin,dc=infosapex,dc=com'
# LDAP_AUTH_CONNECTION_PASSWORD = '123456'

LDAP_AUTH_USER_FIELDS = {
    "username": "uid",
    "email": "mail"
}
