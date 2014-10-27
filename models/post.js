var Db = require('./db'),
 	ObjectID = require('mongodb').ObjectID,
	settings = require('../settings'),
	async = require('async')
	;

var pool = Db.pool;

function Post(name, head, title, tags, post) {
	this.name = name;
	this.title = title;
	this.tags = tags ? tags : [];
	this.post = post;
  	this.head = head;
}

Post.prototype.save = function(callback) {
	if(!this.name || !this.title || !this.post) {
		return callback('need params');
	}
	var date = new Date();
	var time = {
		date : date,
		year : date.getFullYear(),
      	month : date.getFullYear() + "-" + (date.getMonth() + 1),
      	day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      	minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
	};
	var post = {
		name : this.name,
    	head : this.head,
		time : time,
		title : this.title,
    	tags: this.tags,
		post : this.post,
		comments : [],
		reprint_info : {},
		pv : 0
	};

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
			collection.insert(post, {
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

Post.get = function(name, callback) {
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
			var query = {};
			if(name) {
				query.name = name;
			}
			collection.find(query).sort({
				time : -1
			}).toArray(function(err, ret) {
				cb(err, db, ret);
			});
		},
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.getOne = function(_id, callback) {
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
			collection.findOne({
				"_id": new ObjectID(_id)
			}, function(err, ret) {
				cb(err, db, collection, ret);
			});
		},
		function(db, collection, ret, cb) {
			if(!ret) {
				return cb('article doesn\'t exist', db);
			}
			collection.update({
				"_id" : new ObjectID(_id)
			}, {
				"$inc" : {"pv" : 1}
			}, function(err) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.edit = function(_id, callback) {
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
			collection.findOne({
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.update = function(name, _id, post, callback) {
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
				"name" : name,
				"_id" : ObjectID(_id)
			}, {
				"$set" : {
					"post" : post
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

Post.remove = function(name, _id, callback) {
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
			collection.findOne({
				"name" : name,
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				cb(err, db, collection, ret);
			});
		},
		function(db, collection, ret, cb) {
			var reprint_from = "";
			if(ret.reprint_info.reprint_from) {
				reprint_from = ret.reprint_info.reprint_from;
			}

			if(reprint_from != "") {
				collection.update({
					"_id" : reprint_from._id
				}, {
					"$pull" : {
						"reprint_info.reprint_to" : {
							"_id" : ObjectID(_id)
						}
					}
				}, function(err) {
					cb(err, db, collection);
				});
			} else {
				cb(null, db, collection);
			}
		},
		function(db, collection, cb) {
			collection.remove({
				"_id" : ObjectID(_id)
			}, {
				w : 1
			}, function(err) {
				cb(err, db);
			});
		}
	], function(err, db) {
		pool.release(db);
		callback(err);
	});
}

Post.gets = function(name, page, callback, nums) {
	if(!nums) nums = settings.everyPage;
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
			var query = {};
			if(name) {
				query.name = name;
			}

			collection.count(query, function(err, total) {
				cb(err, db, collection, query, total);
			});
		},
		function(db, collection, query, total, cb) {
			collection.find(query, {
				skip : (page - 1) * nums,
				limit : nums
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				cb(err, db, ret, total);
			});
		},
	], function(err, db, ret, total) {
		pool.release(db);
		callback(err, ret, total);
	});
}


Post.getArchive = function(callback) {
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
			collection.find({}, {
				"name" : 1,
				"time" : 1,
				"title" : 1
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}


Post.getTags = function(callback) {
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
			collection.distinct("tags", function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.getTag = function(tag, callback) {
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
			collection.find({
				"tags" : tag
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.search = function(keyword, callback) {
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
			var pattern = new RegExp("^.*" + decodeURIComponent(keyword) + ".*$", "i");
			collection.find({
				"title" : pattern
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				cb(err, db, ret);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		callback(err, ret);
	});
}

Post.reprint = function(touser, _id, callback) {
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
			collection.findOne({
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				cb(err, db, collection, ret);
			});
		},
		function(db, collection, ret, cb) {
			if(!ret) {
				return cb('article doesn\'t exist', db);
			}
			
			if(ret.name == touser.name || (ret.reprint_info.reprint_from && ret.reprint_info.reprint_from.name == touser.name)) {
				return cb('can\'t reprint article of yourself', db);
			}

			var date = new Date();
				var time = {
		            date: date,
		            year : date.getFullYear(),
		            month : date.getFullYear() + "-" + (date.getMonth() + 1),
		            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
		            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
		        };
	        delete ret._id;

	        ret.reprint_info = {
	        	"reprint_from" : {
	        		"_id" : ObjectID(_id),
	        		"name" : ret.name
	        	}
	        };
	        ret.name = touser.name;
	        ret.head = touser.head;
	        ret.time = time;
	        ret.title = (ret.title.search(/[reprint]/) > -1) ? ret.title : "[reprint]" + ret.title;
	        ret.comments = [];
	        ret.pv = 0;


	        collection.insert(ret, {
				safe : true,
			}, function(err, post) {
				cb(err, db, collection, post);
			});
		},
		function(db, collection, post, cb) {
			collection.update({
				"_id" : ObjectID(_id)
			}, {
				"$push" : {
					"reprint_info.reprint_to" : {
						"_id" : ObjectID(post[0]['_id']),
						"name" : touser.name
					}
				}
			}, function(err) {
				cb(err, db, post);
			});
		}
	], function(err, db, ret) {
		pool.release(db);
		if(ret) {
			callback(err, ret[0]);
		}
		else {
			callback(err);
		}
	});
}


module.exports = Post;