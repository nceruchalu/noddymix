# NoddyMix

## About NoddyMix
|         |                                             |
| ------- | ------------------------------------------- |
| Author  | Nnoduka Eruchalu                            |
| Date    | 03/14/2014                                  |
| Website | [http://noddymix.com/](http://noddymix.com) |

[NoddyMix](http://noddymix.com) is the source of the latest and greatest from the Nigerian Music Industry.
Users can make and share playlists. Logged in users get the additional ability to follow friends and stay updated on friend's activities in *__realtime__* 

As an added bonus users get to use native-like mobile web-apps 
[Thanks to Sencha Touch](http://www.sencha.com/products/touch)


#### Available on Following Mobile Devices
* iOS 4+
* Android 2.3+
* Blackberry OS7+ and Playbook
* Windows Phone 8


#### If on Laptop Try the Keyboard Controls:
| Button       | Action      |
| ------------ | ----------- |
| `space`      | play/pause  |
| `backspace`  | mute        |
| `up`         | volume up   |
| `down`       | volume down |
| `left`       | prev song   |
| `right`      | next song   |


## Technologies
* Python
* MySQL
* Javascript
* HTML
* CSS
* node.js  *__[Used for realtime feeds]__*
* [Redis](http://redis.io/download)  *__[Used for realtime feeds]__*
* Amazon Web Services


## Software Description
| Module              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `middleware.py`     | Mobile browser detection middleware                    |
| `settings.py`       | Django settings for project                            |
| `urls.py`           | URL dispatcher for project                             |
| `utils.py`          | Utility functions useful to multiple Django apps       |
| `wsgi.py`           | WSGI config for NoddyMix project                       |
|                     |                                                        |
| **`apps/`**         | Django apps with backend logic                         |
| `apps/account/`     | User account representation and auth. app              |
| `apps/activity/`    | User site activity app                                 |
| `apps/activity/nodejs` | Node.js module used for realtime feeds              |
| `apps/audio/`       | Audio songs & playlists app                            |
| `apps/feedback/`    | User feedback app                                      |
| `apps/relationship/`| User relationships (followings/followers) app          |
| `apps/search/`      | Search engine integration app                          |
|                     |                                                        |
| **`static/`**       | static files for project                               |
| `static/css/`       | Desktop CSS file                                       |
| `static/img`        | Desktop static images                                  |
| `static/js/`        | Desktop Javascript file(s)                             |
| `static/mobile/`    | Mobile Static files using Sencha Touch (JS, CSS, HTML) |
|                     |                                                        |
| **`templates/`**          | Django templates used by apps                    |
| `templates/404.html`      | 404 page                                         |
| `templates/500.html`      | 500 page                                         |
| `templates/headfoot.html` | base template used by all templates              |
| `templates/account/`      | templates used by `account` app's views          |
| `templates/activity/`     | templates used by `activity` apps' views         |
| `templates/audio/`        | templates used by `audio` app's views            |
| `templates/feedback/`     | templates used by `feedback` app's views         |
| `templates/relationship/` | templates used by `relationship` app's views     |
| `templates/search/`       | templates and indexes  used by `search` app      |



#### 3rd-party Python Modules
* [django](https://www.djangoproject.com/)
* [whoosh](https://bitbucket.org/mchaput/whoosh/wiki/Home)
* [python-openid](https://github.com/openid/python-openid)
* [python-oauth2](https://github.com/wndhydrnt/python-oauth2)

###### The following modules have been saved in a local folder on PYTHONPATH
* [django-social-auth](https://github.com/omab/django-social-auth)
* [django imagekit](https://github.com/matthewwithanm/django-imagekit)
    * depends on [pilkit](https://github.com/matthewwithanm/pilkit)
    * depends on [django-appconf](https://github.com/jezdez/django-appconf)
        * depends on [six](https://pypi.python.org/pypi/six)
* [django storages](https://bitbucket.org/david/django-storages/overview)
    * specifically S3.py which
        * depends on [python-boto](https://github.com/boto/boto)
* [django haystack](https://github.com/toastdriven/django-haystack)
* [mutagen](https://bitbucket.org/lazka/mutagen)
* [redis-py](https://github.com/andymccurdy/redis-py)


#### 3rd-party Javascript Modules
* [jQuery](http://jquery.com/) 
* [jQuery UI](https://jqueryui.com/)
    * Widgets: Slider, Sortable, Droppable
* [Apprise-v2](http://labs.bigroomstudios.com/libraries/Apprise-v2)
* [jQuery tipsy](http://onehackoranother.com/projects/jquery/tipsy/)
* [jPlayer](http://jplayer.org/)
* [Sencha Touch](http://www.sencha.com/products/touch)


#### 3rd-party [node.js](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) modules
* [socket.io](https://github.com/LearnBoost/socket.io): `npm install socket.io`
* [node-redis](https://github.com/mranney/node_redis): `npm install redis`
* [node-mysql](https://github.com/felixge/node-mysql): `npm install mysql@2.0.0-alpha8`


## Deployment:


### Configuration/Settings files
The Django project is missing the `noddymix/settings_secret.py` file. A template version is included for help in setting up the sensitive information needed by the project.

The Nodejs module is also missing the `noddymix/apps/activity/nodejs/config.js` file. A template version is included for help in setting up the sensitive information needed by project.


### Mobile Static Files Deployment

##### Add Sencha Touch 2.2.1
Sencha Touch is not included in this repository. You must download it from the [Sencha Touch Website](http://www.sencha.com/products/touch/) and add it to the `noddymix/static/mobile/touch` folder.

##### Add Sencha CMD v3.1.2.342
You will also need Sencha CMD to build your application. Downlad it from the [Sencha CMD Website](http://www.sencha.com/products/sencha-cmd/download)


##### Build for production
Navigate to the directory `noddymix/static/mobile/touch` and run the command:
```
sencha app build production
```

This creates production data at `noddymix/static/mobile/build/NoddyMix/production`. Navigate to this directory and you will see that there is a file called `cache.appcache`.
The problem is that iPhones seem to only pick up HTML5 cache changes with `.manifest` and not `.appcache`. Fix this by running:
```
mv cache.appcache cache.manifest
```



### Desktop Static Files Deployment

##### Generating Compressed JS File
Navigate to `noddymix/static/js/` you see a number (>10) JS files.
To minimize the number of download requests a user's browser has to make, 
I combine all JS files and gzip it, using following commands:
```
cat jquery-1.10.1.min.js jquery-ui-1.10.3.custom.min.js jquery.tipsy.js apprise-v2.js utils.js contextMenu.js jquery.jplayer.min.js playlist.js global.js > compressed/compiled.js
```
```
cd compressed
```
```
gzip -c compiled.js > compressed.js
```

##### Generating Compressed CSS File
Navigate to `noddymix/static/css` and you see 1 CSS file. This CSS file is
simply gzip'd.
```
gzip.c global.css > compressed/global.css
```

##### Uploading static files
The static images and  compressed css & js are uploaded to the appropriate AWS S3 bucket. Django's settings know to pick up files from there when not in DEBUG mode.



### Server Setup Notes
These instructions here are what I did on my [Webfaction](https://www.webfaction.com/) server.

#### `settings.py` Configurations:
`settings.py` expects to import a file called `settings_secret.py` in the `noddymix/` folder. 
See `settings_secret.template.py` for what is required in the file.


#### `httpd.conf` Additions:
Add the following lines to ensure all requests to [www.noddymix.com](http://www.noddymix.com) are redirected to [noddymix.com](http://noddymix.com).

The mobile web-app will make direct requests to this server (as opposed to AWS S3 bucket) for static files. So redirect those requests to the appropriate 
production build location.
```
LoadModule alias_module        modules/mod_alias.so

RewriteEngine on
RewriteCond %{HTTP_HOST} ^www\.noddymix\.com [NC]
RewriteRule ^(.*)$ http://noddymix.com$1 [L,R=301]

RewriteRule ^/(.+\.swf)$ http://static.noddymix.com.s3.amazonaws.com/$1 [L]

AliasMatch ^/(.+\.css|.+\.js|.+\.png|.+\.jpg|.+\.gif|.+\.json|.+\.html|.+\.manifest)$ /home/nceruchalu/webapps/noddymix/noddymix/noddymix/static/mobile/build/NoddyMix/production/$1

Addtype text/cache-manifest .appcache
AddType text/cache-manifest .manifest
```

#### Crontab Additions
Access crontab with:
```
crontab -e
```

Edit it to perform following functionality:

* Setup PATH, PYTHONPATH, NODE_PATH to be used by cron's environment
* Restart apache every 30 minutes. This ensures minimal downtime (if at all)
* Run management command to update search indexes every 45 minutes.
* Run redis and nodejs watchdog scripts every 5 minutes to ensure realtime feed is always running
* Backup database daily using configurations hidden in config file [some values redacted]

```
PATH=/home/nceruchalu/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:.
PYTHONPATH=/home/nceruchalu/lib/python2.7:/home/nceruchalu/pythonlibs:/home/nceruchalu/webapps/noddymix:/home/nceruchalu/webapps/noddymix/noddymix
NODE_PATH="/home/nceruchalu/lib/node_modules"

12,32,52 * * * * ~/webapps/noddymix/apache2/bin/start
*/45 * * * * /usr/local/bin/python2.7 ~/webapps/noddymix/noddymix/manage.py update_index > ~/cron/noddymix_update_index.log 2>&1
*/5 * * * * sh ~/cron/watchdog_redis.sh > ~/cron/watchdog_redis.log 2>&1
*/5 * * * * sh ~/cron/watchdog_node.sh > ~/cron/watchdog_node.log 2>&1
0 2 * * * mysqldump --defaults-file=$HOME/db_backups/<config-filename>.cnf -u <username> <database> > $HOME/db_backups/<backups-root-filename>-`date +\%Y\%m\%d`.sql 2>> $HOME/db_backups/cron.log
```

##### Watchdog Scripts
The watchdog scripts are to keep the node.js and redis servers always running.
These two services are needed for the realtime feed so downtime isn't acceptable.

###### Redis Watchdog Script:
```
#!/usr/bin/env bash

PIDFILE="$HOME/pid/redis.pid"

if [ -e "${PIDFILE}" ] && (ps -u $(whoami) -f | grep "[ ]$(cat ${PIDFILE})[ ]"); then
  echo "Already running."
  exit 99
fi

$HOME/bin/redis-server $HOME/redis/redis.conf > $HOME/cron/log/redis.log &

echo $! > "${PIDFILE}"
chmod 644 "${PIDFILE}"
```

###### Node.js Watchdog Script
```
#!/usr/bin/env bash

PIDFILE="$HOME/pid/node.pid"

if [ -e "${PIDFILE}" ] && (ps -u $(whoami) -f | grep "[ ]$(cat ${PIDFILE})[ ]"); then
  echo "Already running."
  exit 99
fi

$HOME/lib/node_modules/forever/bin/forever start -a -l $HOME/cron/log/forever.log -o $HOME/cron/log/noddymix_feed_out.log -e $HOME/cron/log/noddymix_feed_err.log --pidFile $HOME/pid/node.pid $HOME/webapps/noddymix/noddymix/noddymix/apps/activity/nodejs/feed.js
```


##### References
* [deploying nodejs](http://shkfon.tumblr.com/post/27178918675/real-world-nodejs-part-1)
* [deploying redis](http://redis.io/topics/quickstart)
    * place redis in a custom app and custom port
    * [keep redis running with a cron watchdog script](http://keepdryandcodeon.com/post/45944516792/setting-up-twitters-raven-on-webfaction)
    * [more on running redis in background](http://community.webfaction.com/questions/6029/run-redis-in-background)
    * restart redis
    * then use forever to keep node.js running [this fails if redis isn't up]




## Miscellaneous:

#### To Run Development Server
```
python manage.py runserver 0:8000 --nostatic
```

