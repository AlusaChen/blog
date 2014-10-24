var mongodb = require('./db'),
 	ObjectID = require('mongodb').ObjectID,
	async = require('async')
 	;

function Comment(_id, comment) {
	this._id = _id;
	this.comment = comment;
}

Comment.prototype.save = function(callback) {
	var _id = this._id,
		comment = this.comment;

	async.waterfall([
		function(cb) {
			mongodb.open(function(err, db) {
				cb(err, db);
			});
		},
		function(db, cb) {
			db.collection('posts', function(err, collection) {
				cb(err, collection);
			});
		},
		function(collection, cb) {
			collection.update({
				"_id": new ObjectID(_id)
			}, {
				"$push" : {
					"comments" : comment
				}
			}, function(err) {
				cb(err);
			});
		}
	], function(err) {
		mongodb.close();
		callback(err);
	});
}


module.exports = Comment;


