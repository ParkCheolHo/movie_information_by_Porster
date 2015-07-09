//모듈을 추출합니다.
var mysql = require('mysql');

//데이터베이스와 연결합니다.
var connection = mysql.createConnection({
	user: 'root',
	password: '1q2w3e',
	database: 'movie',
});

//DB 조회 -json으로 변환 10개씩
var start = 0;
var offset =600;//item per page
var page = 1;
exports.index = function(req, res){
	start = (page-1) * offset;
		connection.query('SELECT * FROM movie LIMIT ?, ?', [start, offset] , function(err, rows) {
			res.render('index',{row: rows});
		});
};

exports.movie = function(req, res){
	connection.query('SELECT  *  FROM movie WHERE url= ?', [req.params.url], function(err, row) {
	    req.session.url = req.params.url,
	    req.session.moviename = row[0].name;
	    res.render('movie', { row: row[0] });
	    console.log(req.session.moviename);
	});
}

exports.count= function (req, res) {
    connection.query('SELECT username FROM favoritelist WHERE movieurl = ? AND username = ? AND moviename = ?', [req.session.url, req.session.username, req.session.moviename], function (error, data) {
        if (data[0] !== undefined) {
            console.log(data)
            connection.query('DELETE FROM favoritelist WHERE movieurl = ? AND username = ? AND moviename = ?', [req.session.url, req.session.username, req.session.moviename]);
            connection.query('SELECT like_count FROM movie WHERE url = ?', [req.session.url], function (error, data) {
                data[0].like_count--;
                connection.query('UPDATE movie SET like_count = ? WHERE url = ?', [data[0].like_count, req.session.url], function (err) {
                    res.send(data);
                });
            }); 
          
      }
      else {
          console.log(req.session.url); 
          console.log(req.session.username);
          console.log(data);
          connection.query('SELECT like_count FROM movie WHERE url = ?', [req.session.url], function (error, data) {
              data[0].like_count++;
              connection.query('UPDATE movie SET like_count = ? WHERE url = ?', [data[0].like_count, req.session.url], function (err) {
                  res.send(data);
              });
          });
          connection.query('INSERT INTO favoritelist SET username = ? , movieurl = ?, moviename = ?', [req.session.username, req.session.url, req.session.moviename], function (error, data) {

          });
      }
   });
}
    
exports.registerForm = function(req, res){
	res.render('register-form');
};

exports.register = function(req, res){
	 var info = {
		username: req.body.username,
		password: req.body.password,
		password2: req.body.password2
	}
	connection.query('SELECT * FROM movieinfo WHERE username = ?', info.username, function (err,results) {
		if (results[0] !== undefined) {
			console.log("이미 가입 되어 있습니다.");
			res.redirect('/register'); 
		}
		else{
			if(info.password === info.password2) {
				//전부 맞을때 sql 입력
				connection.query('INSERT INTO  movieinfo SET username = ?, password = ?',[info.username , info.password], function (err) {
					console.log("가입되었습니다. 환영합니다");
					//exports.index다시 실행될때 변수로 넣기 위해 선언
					req.session.username = info.username;
					//index를 다시 띄움
					res.redirect('/user/'+req.session.username);
				});
			}
			else{
				 //입력 비밀번호가 다를때
				console.log("비밀번호가 다릅니다.");
				res.redirect('/register'); 
			}
		}
	});
};

exports.loginForm = function(req, res){
	res.render('login-form');
}


exports.login = function(req, res){
	connection.query('SELECT * FROM movieinfo WHERE username = ?', [req.body.username], function (err, results) {
		if (results[0] !== undefined) {
			if (results[0].password === req.body.password) {
				console.log("로그인 가능합니다.");
				//exports.index다시 실행될때 변수로 넣기 위해 선언
				req.session.username = results[0].username;
				//index를 다시 띄움
				res.redirect('/user/'+req.session.username);
			}
			else {
					console.log("비밀번호를 다르게 입력하였습니다.");
					res.redirect('/login'); 
			}
		}
		else {
				console.log("가입되어 있지 않습니다.");
				res.redirect('/login'); 
		}
	});
}

exports.userIndex = function(req, res){
	connection.query('SELECT * FROM movie LIMIT ?, ?', [start, offset] , function(err, rows) {
		console.log(req.session.username);
		res.render('login',{
			username: req.session.username,
			row: rows
		});
	});
}

exports.userinfoform = function (req, res) { //좋아요 영화 쿼리
    connection.query('SELECT * FROM movieinfo WHERE username = ?', [req.session.username], function (err, data) {
    console.log(data);
    connection.query('SELECT * FROM favoritelist WHERE username = ?', [req.session.username], function (err, favorate) {
        console.log(favorate);
        res.render('user-info-form', {
            username: req.session.username,
            result: favorate
        });
    });
  });
}

exports.change = function (req, res) {
	var data = req.session.username;
	if (req.body.confirm === req.body.new) {
		connection.query('UPDATE movieinfo SET password = ? WHERE username = ?', [req.body.new, data]);
			console.log("비밀번호 변경 완료");
			res.redirect('/user/'+data+'/profile'); 
	}
	else {
		console.log("변경 하고자 하는 비밀번호가 맞지 않습니다.");
		res.redirect('/user/'+data+'/profile'); 
	}
};

exports.withdrawal = function (req, res) {
	var data = req.session.username;
	connection.query('DELETE from movieinfo WHERE username = ?', data,function (err){
		res.redirect('/'); 
	});
}

exports.logout = function(req, res){
	console.log('로그아웃');
	req.session.destroy(function(){
		    	res.redirect('/'); 
	});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
} 
exports.is_login = function (req, res) { 
	connection.query('SELECT * FROM movieinfo WHERE username = ?', [req.session.username], function (err, data) {
		console.log(data);
		res.send(data)
	});
}