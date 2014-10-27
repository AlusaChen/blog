var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	settings = require('../settings'),
	User = require('../models/user'),
	Post = require('../models/post'),
	Comment = require('../models/comment'),
	Upload = require('../classes/upload')
	;

module.exports = function(app) {
	app.get('/', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.gets(null, page, function(err, ret, total) {
			if(err) {
				ret = [];
			}
			res.renderPjax('index', {
				title : 'Blog',
				user : req.session.user,
				posts : ret,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * settings.everyPage + ret.length) == total,
				success : req.flash('success').toString(),
				error : req.flash('error').toString(),
				currentUrl : '/',
			});
		});
	});

	app.get('/recent_posts', function(req, res) {
		Post.gets(null, 1, function(err, posts, total) {
			if(err) {
				posts = [];
			}
			var ret = {};
			if (err) {
				ret.code = -1;
				ret.message = err;
			} else {
				ret.code = 1;
				ret.message = 'Post succeed!';
				ret.data = posts;
			}

			res.set('Context-Type', 'text/json');
			res.json(ret);
		}, 5);
	});

	app.get('/test', function(req, res) {
		res.renderPjax('test', {
			title : 'test'
		});
		
	});

    app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.renderPjax('reg', {
			title: 'Register',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
			currentUrl : '/reg',
		});
	});

    app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];

		if(password != password_re) {
			req.flash('error', 'password error');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name : name,
			password : password,
			email : req.body.email
		});

		User.get(newUser.name, function(err, ret) {
			if(ret) {
				req.flash('error', 'username already exists!');
				return res.redirect('/reg');
			}

			newUser.save(function(err, ret) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = ret;
				req.flash('success', 'Register succeed');
				res.redirect('/');
			});
		});
	});


    app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.renderPjax('login', {
			title : 'Login',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
			currentUrl : '/login',
		});
	});


    app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		User.get(req.body.name, function(err, ret) {
			if(!ret) {
				req.flash('error', 'username doesn\'t exist!');
				return res.redirect('/login');
			}

			if(ret.password != password) {
				req.flash('error', 'Error password!');
				return res.redirect('/login');
			}

			req.session.user = ret;
			req.flash('success', 'Login succeed');
			res.redirect('/');
		});
	});


    app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.renderPjax('post', {
			title : 'Post',
			user : req.session.user,
			tags : settings.tags,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
			currentUrl : '/post',
		});
	});

	//ajax
    app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			tags = req.body.tags,
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err) {
			var ret = {};
			if (err) {
				ret.code = -1;
				ret.message = err;
			} else {
				ret.code = 1;
				ret.message = 'Post succeed!';
			}

			res.set('Context-Type', 'text/json');
			res.json(ret);

		});
	});

	app.post('/upload', checkLogin);
	app.post('/upload', function (req, res) {
		var newUpload = new Upload(req);
		newUpload.upFile();
		newUpload.getFileInfo(function(ret) {
			res.send(JSON.stringify(ret));
		});
	});

	app.get('/archive', function(req, res) {
		Post.getArchive(function(err, ret) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.renderPjax('archive', {
				title: 'archive',
				posts: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/archive',
			});
		});
	});


	app.get('/tags', function(req, res) {
		Post.getTags(function (err, ret) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('/');
			}
			res.renderPjax('tags', {
				title: 'Tags',
				posts: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/tags',
			});
		});
	});

	app.get('/tags/:tag', function(req, res) {
		Post.getTag(req.params.tag, function (err, ret) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('/');
			}
			res.renderPjax('tag', {
				title: req.params.tag,
				posts: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/tags',
			});
		});
	});

	app.get('/links', function (req, res) {
		res.renderPjax('links', {
			title: "Friend Links",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			currentUrl : '/links',

		});
	});

	app.get('/search', function (req, res) {
		Post.search(encodeURIComponent(req.query.keyword), function (err, ret) {
			if (err) {      
				req.flash('error', err); 
				return res.redirect('/');
			}
			res.renderPjax('search', {
				title: req.query.keyword,
				posts: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/search',
			});
		});
	});



	app.get('/u/:name', checkLogin);
	app.get('/u/:name', function(req, res) {
		User.get(req.params.name, function(err, user) {
			if(!user) {
				req.flash('error', 'user doesn\'t exist');
				return res.redirect('/');
			}
			var page = req.query.p ? parseInt(req.query.p) : 1;
			Post.gets(user.name, page, function(err, ret, total) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}

				res.renderPjax('user', {
					title: user.name,
					posts: ret,
			        page: page,
			        isFirstPage: (page - 1) == 0,
			        isLastPage: ((page - 1) * settings.everyPage + ret.length) == total,
					user : req.session.user,
					success : req.flash('success').toString(),
					error : req.flash('error').toString(),
					currentUrl : '/u',
				});
			});
		});
	});

	app.get('/p/:_id', checkLogin);
	app.get('/p/:_id', function(req, res) {
		Post.getOne(req.params._id, function(err, ret) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}

			res.renderPjax('article', {
				title: ret.title,
				post: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/p',
			});
		});
	});

	app.post('/p/:_id', checkLogin);
	app.post('/p/:_id', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
				date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var md5 = crypto.createHash('md5'),
    		email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
    		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
		var comment = {
			name : req.body.name,
			head : head,
			email : req.body.email,
			website : req.body.website,
			time: time,
			content: req.body.content
		};

		var newComment = new Comment(req.params._id, comment);
		newComment.save(function(err) {
			if(err) {
				req.flash('error', err); 
				return res.redirect('back');
			}
			req.flash('success', 'comment succeed');
			res.redirect('back');
		});
	});


	app.get('/edit/:_id', checkLogin);
	app.get('/edit/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.edit(req.params._id, function(err, ret) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if(ret.name != currentUser.name) {
				req.flash('error', 'not access');
				return res.redirect('/');
			}
			res.renderPjax('edit', {
				title: 'Edit',
				post: ret,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				currentUrl : '/edit',
			});
		});
	});


	app.post('/edit/:_id', checkLogin);
	app.post('/edit/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params._id, req.body.post, function(err, ret) {
    		var ret = {};
			if (err) {
				ret.code = -1;
				ret.message = err;
			} else {
				ret.code = 1;
				ret.message = 'Edit succeed!';
			}

			res.set('Context-Type', 'text/json');
			res.json(ret);
		});
	});

	app.get('/remove/:_id', checkLogin);
	app.get('/remove/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params._id, function(err, ret) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('back');
			}
			req.flash('success', 'delete succeed');
			res.redirect('/');
		});
	});

	app.get('/reprint/:_id', checkLogin);
	app.get('/reprint/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.reprint(currentUser, req.params._id, function(err, post) {
			if(err) {
				req.flash('error', err); 
				return res.redirect('back');
			}
			req.flash('success', 'reprint succeed');
			var url = '/p/' + post._id;
			res.redirect(url);
		});
	});


    app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', 'Logout succeed!');
		return res.redirect('/');
	});

	app.use(function (req, res) {
		res.render("404");
	});

	function checkLogin(req, res, next) {
		if(!req.session.user) {
			req.flash('error', 'Doesn\'t login!');
			return res.redirect('/');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if(req.session.user) {
			req.flash('error', 'Already logined!');
			return res.redirect('back');
		}
		next();
	}
}