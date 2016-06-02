var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var app = require('../app');
var fs = require('fs');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'smlemfdl1',
    database: 'movie'
});


router.use(passport.initialize());
router.use(passport.session());
passport.use('local', new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    }
    , function (req, id, password, done) {
        connection.query('select * from users where id = ?', [id], function (err, result) {
            if (result[0] !== undefined) {
                if (result[0].password === password) {
                    var user = {
                        'id': id,
                        'password': password
                    };
                    console.log("로그인");
                    return done(null, user);
                }
                else {
                    console.log("비밀번호를 다르게 입력하였습니다.");
                    return done(null, false);
                }
            }
            else {
                console.log("가입되어 있지 않습니다.");
                return done(null, false);
            }
        });
    }
));
passport.serializeUser(function (user, done) {
    console.log('serialize');
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    console.log("deserialize");
    done(null, id);

});
connection.connect(function (err) {
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});


/* GET home page. */
router.get('/', function (req, res, next) {
    connection.query('select code from movies order by rand() limit 30', function (err, result) {

        if (req.isAuthenticated()) {
            res.render('users', {
                row: result,
                name: req.session.passport.user
            });

        } else {
            res.render('index', {row: result});

        }
    });
});

router.get('/api/scroll', function (req, res, next) {
    connection.query('select code from movies order by rand() limit 30', function (err, result) {
        res.send(result);
    });
});

//로그인
router.post('/api/login', function (req, res) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log("login failed");
            console.log();
            return res.status(401).send("posterroor");
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            console.log("login");

            var test = req.headers.referer;
            return res.send(test);
        });

    })(req, res);
});
//로그아웃
router.get('/api/logout', function (req, res) { // 세션 삭제
    req.logout();
    res.redirect(req.headers.referer);
});
router.post('/api/register', function (req, res, next) {
    connection.query('insert into users values(?,?,?)', [req.body.id, req.body.email, req.body.password], function (err, result) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                console.log("login failed");
                console.log();
                return res.status(401).send("posterroor");
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                console.log("login");
                return res.redirect('/');
            });
        })(req, res, next);

    })
});
router.post('/api/id_check', function (req, res, next) {
    connection.query('select id from users where id = ? ', [req.body.id], function (err, result) {
        console.log(result[0]);
        if (result[0] !== undefined) {
            res.status(401).send('사용불가');
        } else {
            console.log("사용가능");
            res.send("사용가능");
        }
    })
});
router.get('/api/wirte', ensureAuthenticated, function (req, res, next) {

    res.render('write', {
        name: req.session.passport.user
    })
})
router.post('/api/write', ensureAuthenticated, function (req, res, next) {

    connection.query('INSERT INTO movie.movie_board (user, title, content) VALUES (?,?,?)', [req.session.passport.user,
        req.body.title, req.body.content], function (err, result) {
        console.log(req.headers.referer);
        res.send('http://' + req.headers.host + '/board');
    })
})
router.get('/movie/:url', function (req, res, next) {
    // 이미지가 있는지 체크 하고 보낸다.
    connection.query('SELECT code,name, engname, storyname, story,year,grade_name, contry_name FROM movie.movies INNER JOIN  movie.grade on movies.grade = grade.grade_index INNER JOIN  movie.contry on movies.contry_id = contry.contry_index where code = ?', [req.params.url], function (err, movie) {
        connection.query('select * from actors where code in (SELECT actors_index FROM movie.relrationship_actor INNER JOIN  movie.movies on movies.code = relrationship_actor.movie_index where movie_index = ?)', [req.params.url], function (err, actors) {
            for (var m in actors) {
                // console.log(test[m].code);
                var path = 'public\\images\\Actors\\' + actors[m].code + '.jpg';
                // console.log(path);
                try {
                    fs.accessSync(path, fs.F_OK);
                    // Do something
                    // console.log(actors[m].code+' : 접근가능');
                } catch (e) {
                    // console.log(actors[m].code+' : 접근불가');
                    actors[m].code = '0000';
                    // It isn't accessible
                }
            }

            res.render('movie', {
                row: movie[0],
                actors: actors
            });
        });
    });
});


router.get('/session', function (req, res) { // 세션 보기
    console.log(req.session);
    res.send('user : ' + req.session.passport.user);
});
router.get('/user/:url/profile', ensureAuthenticated, function (req, res, next) {
    res.render('profile', {
        name: req.session.passport.user
    });
})
router.get('/board', function (req, res, next) {
    connection.query('select count("board_index") as boardcount from movie_board', function (err, result) {
        connection.query('SELECT  board_index, user, title, time, viewcount from movie_board ORDER BY board_index desc limit 0,10', function (err, result) {
            console.log(result[0].boardcount);
            var pagenum = parseInt(result[0].boardcount / 20);
            var lestpage = result[0].boardcount % 20;
            if (pagenum > 10) {
                pagenum = 10;
            } else {
                if (lestpage > 0)
                    pagenum += 1;
            }
            console.log(pagenum);

            if (req.isAuthenticated()) {
                res.render('freeboard', {
                    name: req.session.passport.user,
                    page: pagenum,
                    result : result
                })
            } else {
                res.render('freeboard', {
                    page: pagenum,
                    result: result
                });
            }
        })
    })
})

module.exports = router;
function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) {
        return next();
    }
    // 로그인이 안되어 있으면, login 페이지로 진행
    res.redirect(req.headers.referer);
}