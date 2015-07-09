//모듈을 추출합니다.
var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path');

//웹 서버를 생성합니다.
var app = express();

app.configure(function () {
	app.set('port', process.env.PORT || 52273);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());//추가
	app.use(express.session({
		key: 'sid', // 세션키
		secret: 'secret', // 비밀키
		cookie: {
			maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
		}
	}));//추가
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/movie/:url', routes.movie);
app.get('/user/:username/profile', routes.userinfoform);

app.get('/register', routes.registerForm);
app.post('/register', routes.register);
app.get('/login', routes.loginForm);
app.post('/login', routes.login);
app.get('/user/:username', routes.userIndex);

app.post('/user/:username/change', routes.change);
app.post('/user/:username/withdrawal', routes.withdrawal);

app.get('/logout', routes.logout);
app.get('/api/login', routes.is_login);
app.get('/api/count', routes.count)


//웹서버를 실행합니다.
var server = http.createServer(app);

//module.parent는 현재 실행된 모듈 프로세스의 부모가 있는 지 확인할 수 있는 속성입니다. 이를 이용하여 최초 실행되는 프로세스만 서버를 실행합니다.
if (!module.parent) {
	server.listen(app.get('port'), function(){
		console.log("Express server listening on port " + app.get('port'));
	});
}
else {
	module.exports = server;
}