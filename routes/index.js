var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	User = require('../models/user'),
	Post = require('../models/post');

module.exports = function(app) {
	app.get('/', function(req, res) {
		Post.get(null, function(err, ret) {
			if(err) {
				ret = [];
			}
			res.render('index', {
				title : 'Blog',
				user : req.session.user,
				posts : ret,
				success : req.flash('success').toString(),
				error : req.flash('error').toString(),
			});
		})
		
	});

    app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: 'Register',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
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
		res.render('login', {
			title : 'Login',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
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
		res.render('post', {
			title : 'Post',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString(),
		});
	});

    app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);
		post.save(function(err) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('/');
			}
			req.flash('success', 'Post succeed!');
			return res.redirect('/');
		});
	});

    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res) {
		res.render('upload', {
			title: 'upload',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
    });

	app.post('/upload', checkLogin);
	app.post('/upload', function (req, res) {
		var info = req.files.upfile;
		var target_path = './public/images/' + info.name;
		fs.renameSync(info.path, target_path);
		var ret = {
			originalName : info.originalFilename,
			name : info.name,
			url : '/images/' + info.name,
			size : info.size,
			type : path.extname(info.name),
			state : 'SUCCESS'
		};
		res.send(JSON.stringify(ret));
	});


    app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', 'Logout succeed!');
		return res.redirect('/');
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