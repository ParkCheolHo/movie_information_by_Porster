//모듈을 추출합니다.
var mysql = require('mysql');

//데이터베이스와 연결합니다.
var connection = mysql.createConnection({
    user: 'root',
    password: 'smlemfdl1',
    database: 'movie',
});

//DB 조회 -json으로 변환 10개씩
var idcheck = false;
var start = 0;
var offset = 28;//item per page
var refreshoffset = 16;
var page = 1;
exports.index = function (req, res) {
    start = (page - 1) * offset;
    connection.query('SELECT * FROM movie LIMIT ?, ?', [start, offset], function (err, rows) {
        res.render('index', {row: rows});
        start = offset + 1;
        console.log(start + '::' + offset);
    });
};

exports.movie = function (req, res) {
    connection.query('SELECT  *  FROM movie WHERE url= ?', [req.params.url], function (err, row) {
        req.session.url = req.params.url,
            req.session.moviename = row[0].name;
        res.render('movie', {row: row[0]});
        console.log(req.session.moviename);
    });
}

exports.count = function (req, res) {
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
exports.idcheck = function (req, res){
    var info = {
        username: req.body.username
    }
    connection.query('SELECT * FROM movieinfo WHERE username = ?', info.username, function (err, results) {
        if(err != null){
            console.log(info);
            console.log(err);
        }
        if (results[0] !== undefined) {
            console.log(info);
            console.log("이미 가입 되어 있습니다.");
            res.send(500,'false');
            idcheck = false;
            console.log(idcheck);
        }
        else{
            res.send('true');
            idcheck = true;
            console.log(idcheck);
        }
    })

}
exports.registerForm = function (req, res) {
    res.render('register-form');
};

exports.register = function (req, res) {
    var info = {
        username: req.body.username,
        password: req.body.password,
        password2: req.body.password2
    }
    if(idcheck == true) {
        if (info.password === info.password2) {
            //전부 맞을때 sql 입력
            connection.query('INSERT INTO  movieinfo SET username = ?, password = ?', [info.username, info.password], function (err) {
                console.log("가입되었습니다. 환영합니다");
                //exports.index다시 실행될때 변수로 넣기 위해 선언
                req.session.username = info.username;
                //index를 다시 띄움
                res.redirect('/user/' + req.session.username);
            });
        }
        else {
            //입력 비밀번호가 다를때
            console.log("비밀번호가 다릅니다.");
            res.redirect('/register');

        }
    }
    else
    //res.send(500, 'false2')
    res.redirect('/register');
};

exports.loginForm = function (req, res) {
    res.render('login-form');
}


exports.login = function (req, res) {
    connection.query('SELECT * FROM movieinfo WHERE username = ?', [req.body.username], function (err, results) {
        if (results[0] !== undefined) {
            if (results[0].password === req.body.password) {
                console.log("로그인 가능합니다.");
                //exports.index다시 실행될때 변수로 넣기 위해 선언
                req.session.username = results[0].username;
                //index를 다시 띄움
                res.redirect('/user/' + req.session.username);
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

exports.userIndex = function (req, res) {
    connection.query('SELECT * FROM movie LIMIT ?, ?', [start, offset], function (err, rows) {
        console.log(req.session.username);
        res.render('login', {
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
        res.redirect('/user/' + data + '/profile');
    }
    else {
        console.log("변경 하고자 하는 비밀번호가 맞지 않습니다.");
        res.redirect('/user/' + data + '/profile');
    }
};

exports.withdrawal = function (req, res) {
    var data = req.session.username;
    connection.query('DELETE from movieinfo WHERE username = ?', data, function (err) {
        res.redirect('/');
    });
}

exports.logout = function (req, res) {
    console.log('로그아웃');
    req.session.destroy(function () {
        res.redirect('/');
    });

}
exports.is_login = function (req, res) {
    connection.query('SELECT * FROM movieinfo WHERE username = ?', [req.session.username], function (err, data) {
        console.log(data);
        res.send(data)
    });
}
exports.scroll = function (req, res) {

    connection.query('SELECT * FROM movie LIMIT ?, ?', [start, refreshoffset], function (err, data1) {
        //console.log(data1);
        start += refreshoffset + 1;
        console.log(start + '::' + refreshoffset);
        res.send(data1);
    });
}
exports.serach = function (req, res) {
    var distinctionvalue = req.body.serachvalue;
    var signature = distinctionvalue.substring(0,1);
    console.log(signature);
    if(signature == ":"){
        var data = distinction(req.body.serachvalue);
        connection.query(data, function (err, data1) {
            console.log(data1);
            res.render('index', {row: data1});
        });
    }
    else {
        var querystring = "%"+distinctionvalue+"%";
        connection.query('SELECT * FROM movie WHERE  name LIKE ?', [querystring], function (err, data1) {
            console.log(data1);
            res.render('index', {row: data1});
        });
    }
}

function distinction(value) {
    var query = "SELECT * FROM movie WHERE  year = ";
    var valuearray = value.split(' ');
    var year = valuearray[0].substring(1, 5);
    query += year;
    if(valuearray[1] != null) {
        var genre = valuearray[1].split(',');

        if (genre != null)
            query += ' and ';

        console.log(genre[0]);


        for (var i = 0; i < genre.length; i++) {
            if (i > 0) {
                query += ' or ';
            }
            query += "genre1 ='" + genre[i] + "'";
        }
    }
    console.log(query);
    return query;
}





