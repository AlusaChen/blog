var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

User.prototype.save = function(callback) {
	var user = {
		name : this.name,
		password : this.password,
		email : this.email
	};

	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}

		db.collection('users', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.insert(user, {
				safe : true,
			}, function(err, res){
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, res[0]);
			});
		});
	});
}

User.get = function(name, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('users', function(err, collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				name : name
			}, function(err, res) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, res);
			});
		})
	});
}

module.exports = User;
