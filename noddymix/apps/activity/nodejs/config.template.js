"""
Template Node.js settings for NoddyMix Realtime component.

Contains sensitive information to be used in feed.js

The real version file is not to be shared pulicly
"""
var config = {};

config.db = {};

config.db.host = 'localhost';
config.db.database = 'mysql_db_name';
config.db.user = 'mysql_db_username';
config.db.password = 'mysql_db_password';

module.exports = config;