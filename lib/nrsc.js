var Bunyan = require('bunyan');
var BunyanFormat = require('bunyan-format');
var logOutStream = BunyanFormat({ outputMode: 'short' });
var Promise = require("bluebird");
var redis = require('redis');
var redisScan = require('redisscan');
var EventEmitter = require('events').EventEmitter;
var argv = require('minimist')(
	process.argv.slice(2), 
	{ 
		boolean: 'v',
		defaut: {
			s: false,
			v: false,
			h: 'localhost',
			p: 6379,
			c: 'get'
		}
	}
);
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);


var app = {};
global.app = app;
app.events = new EventEmitter();
app.config = {};
app.config.redis = {
	host: 'localhost',
	port: 6379
};
app.pattern = 'nrsc*';
app.verbose = false;
app.silent = false;
app.command = 'get';
app.count = 0;

app.packageJson = require(__dirname + '/../package.json');
app.argv = argv;
global.log = console;
log = Bunyan.createLogger(
	{
		name: app.packageJson.name + '@' + app.packageJson.version,
		streams: [
			{
				level: 'debug',
				stream: logOutStream
			}
		]
	}
);


checkArguments();
app.redisClient = redis.createClient();
app.redisClient.on(
	'error', 
	function (err) {
		log.error('!! redis Error');
		log.error(err);
		process.exit(1);
	}
);
app.redisClient.on(
	'ready', 
	function (err) {
		if (app.verbose) {
			log.info(':: redis ready');
		}
		startWorking();
	}
);


function checkArguments() {
	if (Object.keys(app.argv).length < 2 || typeof app.argv.m !== 'string' || app.argv.m.length < 1) {
		log.error(':: please provide at least the -m option \n-h <host:localhost> \n-p <port:6379> \n-v <verbose:false> \n-s <silent:false> \n-m <match-pattern:nrsc*> \n-c <command:get>');
		return process.exit(1);
	}
	// log.debug(app.argv);
	if (app.argv.s && app.argv.s == true) {
		app.silent = true;
	}
	if (app.argv.v && app.argv.v == true) {
		app.verbose = true;
	}
	if (typeof app.argv.h === 'string') {
		app.config.redis.host = app.argv.h;
	}
	if (typeof app.argv.p === 'number') {
		app.config.redis.port = app.argv.p;
	}
	if (typeof app.argv.c === 'string') {
		app.command = app.argv.c;
	}
	if (typeof app.argv.m === 'string') {
		app.pattern = app.argv.m;
	}
	return true;
};

function startWorking() {
	if (typeof app.redisClient[app.command+'Async'] !== 'function') {
		log.error('!! there is no redis client command [ ' + app.command + ' ] that i can execute on each key');
		return process.exit(1);
	}
	log.info(':: starting process to scan for [ ' + app.pattern + ' ] and execute [ ' + app.command + ' ] on the items');
	var pattern = 'cgg*';
	return redisScan(
		{
			redis: app.redisClient,
			pattern: app.pattern,
			each_callback: function(type, key, subkey, something, value, cb) {
				if (app.verbose === true) {
					log.debug('match: #' + app.count, type, key, subkey, something, value);
				}
				app.count += 1;
				app.redisClient[app.command+'Async'](key)
					.then(
						function(res) {
							if (app.silent !== true) {
								log.info('results of the command [ ' + app.command + ' ' + key + ' ] : ', res);
							}
						}
					).catch(
						function(err) {
							log.error(err);
						}
					).finally(
						function() {
							cb();
						}
					);
			},
			done_callback: function (err) {
					app.redisClient.quit();
					log.info(':: all done. handled [ ' + app.count + ' ] matches');
					process.exit(0);
			}
		}
	);
};
