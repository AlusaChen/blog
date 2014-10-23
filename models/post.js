var mongodb = require('./db'),
 	ObjectID = require('mongodb').ObjectID,
	settings = require('../settings')
;

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

	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.insert(post, {
				safe : true
			}, function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				//ret[0]
				callback(null);
			});
		});
	});
}

Post.get = function(name, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if(name) {
				query.name = name;
			}

			collection.find(query).sort({
				time : -1
			}).toArray(function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		})
	});
}

Post.getOne = function(_id, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"_id": new ObjectID(_id)
			}, function(err, ret) {
				if(err) {
					mongodb.close();
					return callback(err);
				}

				if(ret) {
					collection.update({
						"_id" : new ObjectID(_id)
					}, {
						"$inc" : {"pv" : 1}
					}, function(err) {
						mongodb.close();
						if(err) {
							return callback(err);
						}
						return callback(null, ret);
					});
				}
				else
				{
					mongodb.close();
					return callback('article doesn\'t exist');
				}
			});
		});
	});
}

Post.edit = function(_id, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		});
	});
}

Post.update = function(name, _id, post, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.update({
				"name" : name,
				"_id" : ObjectID(_id)
			}, {
				"$set" : {
					"post" : post
				}
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				return callback(null);
			});
		});
	});
}

Post.remove = function(name, _id, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"name" : name,
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				if(err) {
					mongodb.close();
					return callback(err);
				}
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
						if(err) {
							mongodb.close();
							return callback(err);
						}
					});
				}

				collection.remove({
					"_id" : ObjectID(_id)
				}, {
					w : 1
				}, function(err) {
					mongodb.close();
					if(err) {
						return callback(err);
					}
					return callback(null);
				});
			});
		});
	});
}

Post.gets = function(name, page, callback, nums) {
	if(!nums) nums = settings.everyPage;
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if(name) {
				query.name = name;
			}

			collection.count(query, function(err, total) {
				if(err) {
					mongodb.close();
					return callback(err);
				}

				collection.find(query, {
					skip : (page - 1) * nums,
					limit : nums
				}).sort({
					time : -1
				}).toArray(function(err, ret) {
					mongodb.close();
					if(err) {
						return callback(err);
					}
					callback(null, ret, total);
				});
			});
		});
	});
}

Post.getArchive = function(callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.find({}, {
				"name" : 1,
				"time" : 1,
				"title" : 1
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		});
	});
}

Post.getTags = function(callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.distinct("tags", function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		});
	});
}

Post.getTag = function(tag, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.find({
				"tags" : tag
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		})
	});
}

Post.search = function(keyword, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			var pattern = new RegExp("^.*" + keyword + ".*$", "i");
			collection.find({
				"title" : pattern
			}).sort({
				time : -1
			}).toArray(function(err, ret) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, ret);
			});
		})
	});
}

Post.reprint = function(touser, _id, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"_id" : ObjectID(_id)
			}, function(err, ret) {
				if(err) {
					mongodb.close();
					return callback(err);
				}

				if(!ret) {
					mongodb.close();
					return callback('article doesn\'t exist');
				}

				if(ret.name == touser.name) {
					mongodb.close();
					return callback('can\'t reprint article of yourself');
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
		        ret.title = (ret.title.search(/[转载]/) > -1) ? ret.title : "[转载]" + ret.title;
		        ret.comments = [];
		        ret.pv = 0;

		        collection.insert(ret, {
					safe : true,
				}, function(err, post) {
					if(err) {
						mongodb.close();
						return callback(err);
					}

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
						mongodb.close();
						if(err) {
							return callback(err);
						}
						callback(err, post[0]);
					});
				});
			});
		});
	});
}


module.exports = Post;