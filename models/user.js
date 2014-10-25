var Db = require('./db'),
	crypto = require('crypto'),
	async = require('async')
	;

var pool = Db.pool;


function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

User.prototype.save = function(callback) {
	var md5 = crypto.createHash('md5'),
    	email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
    	head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

	var user = {
		name : this.name,
		password : this.password,
		email : this.email,
		head : head
	};

	async.waterfall([
		function(cb) {
			pool.acquire(function(err, db) {
				cb(err, db);
			});
		},
		function(db, cb) {
			db.collection('users', function(err, collection) {
				cb(err, db, collection);
			});
		},
		function(db, collection, cb) {
			collection.insert(user, {
				safe : true
			}, function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret[0]);
	});
}

User.get = function(name, callback) {
	async.waterfall([
		function(cb) {
			pool.acquire(function(err, db) {
				cb(err, db);
			});
		},
		function(db, cb) {
			db.collection('users', function(err, collection) {
				cb(err, db, collection);
			});
		},
		function(db, collection, cb) {
			collection.findOne({
				name : name
			}, function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

module.exports = User;
