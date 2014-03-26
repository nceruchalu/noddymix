// Description:
//   Node.js module for providing a realtime feed within Django using socket.io
//   ref: http://maxburstein.com/blog/realtime-django-using-nodejs-and-socketio/
//
// Author:
//   Nnoduka Eruchalu

var app = require('http').createServer().listen(16637);
var io = require('socket.io').listen(app);
var redis = require('redis');
var mysql = require('mysql');
var exec = require('child_process').exec;
var cwd = require('path').dirname(require.main.filename);
var config = require('./config')

// database connectoin details
var mysql_connection = {
    host:     config.db.host,
    database: config.db.database,
    user:     config.db.user,
    password: config.db.password,
};

// create connection pool
var mysql_pool = mysql.createPool(mysql_connection);

// redis connection details
var redis_connection = {
    port:25373,
    hostname:'localhost',
};


// Subscribe to redis 'feed' channel when client is ready 
// [ensure client is running!]
var sub = redis.createClient(redis_connection.port, redis_connection.hostname);
sub.on('ready', function() {
    sub.subscribe('feed');
});


// Configure socket.io
io.configure(function(){
    
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic 
    io.enable('browser client gzip');          // gzip the file
    // comment out to show debug-level warnings
    io.set('log level', 1);                    // reduce logging
    
    // enable all transports (optional if you want flashsocket support, 
    // please note that some hosting providers do not allow you to create 
    // servers that listen on a port different than 80 or their default port)
    io.set('transports', [
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});


// restrict live feed's namespace, and now note that iofeed === io.of('/feed')
var iofeed = io.of('/feed')
.on('connection', function(socket){
        
    // when client is ready to subscribe to rooms of user's followings,
    // get those channels, and join this socket to them.
    socket.on('subscribe', function(data) {
    if ('sessionid' in data) {        
        var session_key = data.sessionid;
        
        // session key needs to be mapped to a user id
        // first connect to mysql database
        mysql_pool.getConnection(function(err, connection) {
            if (err) throw err;
            
            // get session_data associated with this session_key
            connection.query(
                "SELECT session_data FROM django_session WHERE session_key='"
                    +session_key+"'",
                function(err, rows, fields){
                    if (err) {
                        connection.release();
                        throw err;
                    }
                    
                    // only proceed if there is session_data associated with
                    // this session
                    if ((rows.length >= 1) && ('session_data' in rows[0])) {
                    // decode this session_data and get the user_id
                    exec('python2.7 '+ cwd+'/session_decode.py ' 
                         +rows[0].session_data,
                         function (err, stdout, stderr) {
                             if (err) {
                                 connection.release();
                                 throw err;
                             }
                             
                             user_id = parseInt(stdout);
                             // if user_id is NaN, then user isn't logged in
                             // so do nothing
                             if (user_id) { // note that user_id is 1-indexed
                                 // subscribe this socket, now identified by
                                 // user_id to all channels of users he/she
                                 // follows
                                 
                                 // first get all the ids of use followed by
                                 // `user_id`
                                 connection.query(
                                     "SELECT followed_id " +
                                         "FROM relationship_following "+
                                         "WHERE follower_id="+user_id,
                                     function(err, rows, fields) {
                                         // always release connection when done
                                         connection.release();
                                         
                                         if (err) throw err;
                                         
                                         // id of users followed by `user_id`
                                         // represent socket.io rooms to join
                                         for (var i=0; i<rows.length; i++) {
                                             socket.join(rows[i].followed_id);
                                         }
                                     }); // end connection.query()
                                 
                             } else { // user isn't logged in so end
                                 connection.release();
                             } // end if-else(user_id)
                         }); // end exec()
                        
                    } else { // no session_data associated with session, so end
                        connection.release();
                    } // end if-else ((rows.length >= 1) && ('session_data'...
                }); // end connection.query()
            
        }); // end mysql_pool.getConnection()
        
    } // if ('sessionid' in data)
    }); // end socket.on('subscribe',...)
        
}); // end iofeed.on('connection', ...)

// grab message from redis subscription channel and send to clients
// example publish command: publish feed '{"room":3, "data":"nothing"}'
sub.on('message', function(channel, message) {
    //iofeed.volatile.emit('feedupdate', message);
    // only send update to sockets in the user's channel
    // use volatile because it's ok if messages are dropped
    message = JSON.parse(message);
    if (message.room) {
        iofeed.in(message.room).volatile.emit('feedupdate', message.data);
    }
});