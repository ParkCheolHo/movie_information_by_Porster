var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var app = require('../app');
var fs = require('fs');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var connection;
var db_config = {
    host: 'us-cdbr-iron-east-04.cleardb.net',
    port: 3306,
    user: 'b2dad284808da0',
    password: '9a1637ecf2b5c8d',
    // host : 'localhost',
    // port : 3306,
    // user : 'root',
    // password : 'smlemfdl12~',
    database: 'heroku_7af29d928daec7e' 
};

function handleDisconnect() {
  connection = mysql.createConnection(db_config); 
  connection.connect(function(err) {              
    if(err) {                                     
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); 
    }                                     
  });                                     
                                          
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      handleDisconnect();                         
    } else {                                      
      throw err;                                  
    }
  });
}
handleDisconnect();
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
    
    connection.query('insert into users(id,email,password,time) values(?,?,?,now())', [req.body.id, req.body.email, req.body.password], function (err, result) {
        console.log(req.body.id + ":" + req.body.email + ":" + req.body.password);
        console.log(result);
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                console.log(err);
                return next(err);
            }
            if (!user) {
                console.log("login failed");
                console.log("test");
                
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
    connection.query('INSERT INTO board (board_user, board_title, board_content,board_edit_time) VALUES (?,?,?,now())', [req.session.passport.user,
        req.body.title, req.body.content], function (err, result) {
        res.redirect('/board/view');
    })
})
router.get('/api/search',function(req,res,next){
    var split = req.query.data.split(" ");
    var query;
    for(var i in split){
    console.log(i);
    console.log(split[i]);
    if(split[i] != ""){
        if(i == 0){
            console.log("test")
            query = 'SELECT * FROM movies where name like "%'+split[i]+'%"';
            console.log(query);
        }else{
        query = 'SELECT * FROM '+ '('+ query +')t'+i+ ' where name like "%'+split[i]+'%"';
        console.log(query);
        }
    }
    }
    if(query != undefined){
    connection.query(query,function(err, movie){
        if(err){
            conole.log(err);
            return err;
        }
        if(movie[0] != undefined){
            console.log(movie);
            res.send(movie);
        }else{
            console.log(false);
            res.status(401).send("검색결과 없음");
        }
    })
    }else{
        res.status(401).send("검색결과 없음");
    }
})

router.post('/api/replay', checkAuthenticated ,function(req, res, next){
    console.log(req.body);
    console.log(req.session.url);
    console.log(req.session.passport.user);
        connection.query('insert into replays(movie_index,user_id,content) values (?,?,?)',[req.session.url,req.session.passport.user,req.body.content], function(err, result){
            if(!err)
                res.send({
                    id :req.session.passport.user
                });
            else{
                console.log(err);
                res.status(401).send();
            }
                    
        })
})
router.post('/api/changePassword', checkAuthenticated, function(req,res,next){
    connection.query('select password from users where id = ?',[req.session.passport.user],function(err,result){
        if(err)
            console.log(err);

        if(req.body.current == result[0].password){
           connection.query('update users set password = ? where id = ?',[req.body.change, req.session.passport.user], function(err1,result){
                if(err1)
                    console.log(err1);
                console.log(result);
           })
            res.redirect('/user/'+req.session.passport.user+'/profile');    
        }else
            res.status(401).send('비밀번호 틀림');
    });
    // res.send('<script type="text/javascript">alert("오류발생");</script>');
    // res.redirect('/user/'+req.session.passport.user+'/profile');
    
})
router.post('/api/deleteAccount', checkAuthenticated, function(req, res, next){
    console.log(req.body.current);
    connection.query('select password from users where id = ?',[req.session.passport.user],function(err,result){
        if(req.body.current == result[0].password){
            console.log("test");
                connection.query('delete from users where id = ?',[req.session.passport.user], function(err, result){
                if(!err){
                    console.log(err);
                    req.logout(); 
                    res.redirect('/');
                
                }
                console.log(err);
                })
        }else
            res.send('<script type="text/javascript">alert("비밀번호가 다릅니다.");</script>');
    })
})
router.get('/movie/:url', function (req, res, next) {
    // 이미지가 있는지 체크 하고 보낸다.
    var query = 'SELECT code,name, engname, storyname, story, running_time,DATE_FORMAT(open_date, "%Y/%m/%d") as open_date ,grade_name, contry_name FROM movies INNER JOIN  grade on movies.grade = grade.grade_index INNER JOIN  contry on movies.contry_id = contry.contry_index where code = ?';
    connection.query(query, [req.params.url], function (err, movie) {
        connection.query('select * from actors where code in (SELECT actors_index FROM relrationship_actor INNER JOIN  movies on movies.code = relrationship_actor.movie_index where movie_index = ?)', [req.params.url], function (err, actors) {
            connection.query('select user_id,content from replays where movie_index = ?',[req.params.url], function(errr, replays){
            // console.log(result);
            for (var m in actors) {   
               	if(actors[m].has_picture !== 1){
                 actors[m].code = 'unknown';
                }
            }
        req.session.url = movie[0].code;
        if(req.isAuthenticated()){
            res.render('movie', {
                replay : replays,
                row: movie[0],
                actors: actors,
                name: req.session.passport.user
                });
        }else{
            res.render('movie', {
                replay : replays,
                row: movie[0],
                actors: actors
                }); 
                }     
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
//게시판 로딩
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
    connection.query('SELECT  board_index, board_user, board_title,DATE_FORMAT(board_edit_time, "%Y/%m/%d %T") as datetimealpha, board_view_count from board ORDER BY board_index desc limit ?,20', 
        [(current_page - 1) * 20], function (err, result) {
        var start_page = current_page - position;
        var offset;
        if (end_page_num <= 10) {
            start_page = 1;
            if(end_page_num == 0)
                end_page_num =1;
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
//게시글 로딩
router.get('/board/:url', function (req, res, next) {
    connection.query('select * from board where board_index = ?',[req.params.url], function (err, result) {
        var date = new Date();
        console.log(date);
        console.log(req.cookies);
        var al = req.params.url;
        res.cookie('board',{al : req.params.url },{ expires: new Date(Date.now() + 900000), httpOnly: true });
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
//게시글 수정
router.get('/board/:url/edit' , checkAuthenticated ,function(req, res, next){
    connection.query('select * from board where board_index = ?',[req.params.url], function (err, result) {
        console.log(result[0]);
        res.render('board/write',{
            name: req.session.passport.user,
            content : result[0]
        })
    })
})

router.post('/board/:url' , checkAuthenticated ,function(req, res, next){
    console.log(req.params);
    console.log(req.body);

    connection.query('update board set board_title = ? , board_content = ? where board_index = ? ',
        [req.body.title, req.body.content, req.params.url], function (err, result) {
        !(err)
            res.redirect('/board/view');
    })
})
router.get('/testboard', function (req, res, next) {
    for (var i = 1; i <= 50; i++) {
        connection.query('INSERT INTO board (board_user, board_title, board_content) VALUES (?,?,?)', ['beakya',
            '테스트' + i, '글내용' + i], function (err, result) {
        })
    }
})
router.delete('/board/delete/:url', checkAuthenticated, function(req, res, next){
    console.log(req.params.url);
    connection.query('select * from board where board_index = ?',[req.params.url], function (err, aresult) {
        console.log(aresult[0].board_user);
        if(aresult[0].board_user === req.session.passport.user)
            connection.query('delete from board where board_index = ?',[req.params.url], function (err, result) {
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
    connection.query('select count("board_index") as board_count from board', function (err, count) {
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
    res.redirect('/');
}