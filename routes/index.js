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
//전체 페이지의 갯수를 저장하는 변수
var end_page_num;
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
            return res.send(req.headers.referer);
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
        console.log(req.body.id + ":" + req.body.email + ":" + req.body.password);
        console.log(result);
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
router.get('/api/write', checkAuthenticated, function (req, res, next) {
    res.render('board/write', {
        name: req.session.passport.user
    })
})
router.post('/api/write', checkAuthenticated, function (req, res, next) {
    console.log(req.body.content);
    connection.query('INSERT INTO movie.movie_board (user, title, content) VALUES (?,?,?)', [req.session.passport.user,
        req.body.title, req.body.content], function (err, result) {
        res.redirect('/board/view');
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
router.get('/user/:url/profile', checkAuthenticated, function (req, res, next) {
    res.render('profile', {
        name: req.session.passport.user
    });
})
router.get('/board/view', function (req, res, next) {
    var current_page;
    var position = 5;
    if (req.query.page !== undefined) {
        current_page = req.query.page;
        if (current_page == 1)
            check_total_page();
    }
    else {
        check_total_page();
        current_page = 1;
    }
    connection.query('SELECT  board_index, user, title, time, viewcount from movie_board ORDER BY board_index desc limit ?,20', [(current_page - 1) * 20], function (err, result) {
        var start_page = current_page - position;
        var offset;
        if (end_page_num <= 10) {
            start_page = 1;
            offset = end_page_num;
        } else {
            if (current_page <= position) {
                start_page = 1;
                offset = 10;
            } else if (position < current_page && current_page <= end_page_num - position) {
                offset = 10;
                start_page = current_page - position;
            } else if ((end_page_num - position) < current_page && current_page <= end_page_num) {
                offset = 10;
                start_page = end_page_num - offset + 1;
            }
        }
        // console.log('start_page : ' + start_page);
        // console.log('offset  : ' + offset);
        // console.log('request_page_num : ' + current_page);
        // console.log('end_page_num  : ' + end_page_num);
        // console.log('test : ' + (end_page_num - 5));
        if (req.isAuthenticated()) {
            res.render('board/free_board', {
                name: req.session.passport.user,
                start_page: start_page,
                offset: offset,
                now_page: current_page,
                end_page_num: end_page_num,
                result: result
            })
        } else {
            res.render('board/free_board', {
                start_page: start_page,
                offset: offset,
                now_page: current_page,
                end_page_num: end_page_num,
                result: result
            });
        }
    })
})
router.get('/board/:url', function (req, res, next) {
    connection.query('select * from movie_board where board_index = ?',[req.params.url], function (err, result) {
        console.log(result[0]);
        if(req.isAuthenticated()) {
            res.render('board/watch_writing',{
                name: req.session.passport.user,
                content : result[0]
            })
        }else{
            res.render('board/watch_writing',{
                content : result[0]
            })
        }

    })
})
router.get('/board/:url/edit' , function(req, res, next){
    connection.query('select * from movie_board where board_index = ?',[req.params.url], function (err, result) {
        console.log(result[0]);
        res.render('board/write',{
            name: req.session.passport.user,
            content : result[0]
        })
    })
})
router.post('/board/:url' , function(req, res, next){
    console.log(req.params);
    console.log(req.body);

    connection.query('update movie_board set title = ? , content = ? where board_index = ? ',
        [req.body.title, req.body.content, req.params.url], function (err, result) {
        !(err)
            res.redirect('/board/view');
    })
})
router.get('/testboard', function (req, res, next) {
    for (var i = 1; i <= 50; i++) {
        connection.query('INSERT INTO movie.movie_board (user, title, content) VALUES (?,?,?)', ['beakya',
            '테스트' + i, '글내용' + i], function (err, result) {
        })
    }
})
router.delete('/board/delete/:url', checkAuthenticated, function(req, res, next){
    connection.query('select * from movie_board where board_index = ?',[req.params.url], function (err, result) {
        if(result[0].user === req.session.passport.user)
            connection.query('delete from movie_board where board_index = ?',[req.params.url], function (err, result) {
                !(err)
                {
                    console.log(req.params.url + ' 글 제거 성공')
                    res.redirect('/board/view');
                }
            })
    })
})
module.exports = router;
function check_total_page() {
    connection.query('select count("board_index") as board_count from movie_board', function (err, count) {
        //noinspection JSUnresolvedVariable
        console.log(count[0].board_count);
        //noinspection JSUnresolvedVariable
        end_page_num = parseInt(count[0].board_count / 20);
        //noinspection JSUnresolvedVariable
        var lest_page = count[0].board_count % 20;
        if (lest_page > 0) {
            end_page_num += 1;
        }
    })
}
function checkAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) {
        return next();
    }
    // 로그인이 안되어 있으면, login 페이지로 진행
    res.status(401).send('<script type="text/javascript">alert("오류발생");</script>');
}