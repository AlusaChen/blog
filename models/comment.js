var Db = require('./db'),
 	ObjectID = require('mongodb').ObjectID,
	async = require('async')
 	;

var pool = Db.pool;

function Comment(_id, comment) {
	this._id = _id;
	this.comment = comment;
}

Comment.prototype.save = function(callback) {
	var _id = this._id,
		comment = this.comment;

	async.waterfall([
		function(cb) {
			pool.acquire(function(err, db) {
				cb(err, db);
			});
		},
		function(db, cb) {
			db.collection('posts', function(err, collection) {
				cb(err, db, collection);
			});
		},
		function(db, collection, cb) {
			collection.update({
				"_id": new ObjectID(_id)
			}, {
				"$push" : {
					"comments" : comment
				}
			}, function(err) {
				cb(err, db);
			});
		}
	], function(err, db) {
		pool.release(db);
		callback(err);
	});
}


module.exports = Comment;


