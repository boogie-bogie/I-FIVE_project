const express = require('express') //모듈 로드시키기
const ejs = require('ejs');
var bodyParser = require('body-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)

const app = express();
const port = 3000 //서버 접속 번호

// 세션 및 동작 기능 설정
app.set('view engine', 'ejs');
app.set('views', './views')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret: 'jiminjimin',	// 원하는 문자 입력
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
}))
// 정적 파일을 제공하는 미들웨어 추가
app.use(express.static('C:\\developer\\i_Five_page'));
app.use(express.static('C:\\developer\\i_Five_page\\views'));


// sql 연결 설정
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'coriny',
    password: '1234',
    database: 'memberinfo'
});


// 회원가입
app.post('/addmember', (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const memberinfo_insert = {
        id: `${id}`,
        name: `${name}`,
        email: `${email}`,
        password: `${password}`
    }

    console.log(memberinfo_insert);

    pool.getConnection((err, connection) => {
        if (err) throw err;

        connection.query('INSERT INTO memberinfo SET ?', memberinfo_insert, (error, results, fields) => {
            connection.release();

            if (error) {
                console.error(error);
                res.status(500).json({ error: '데이터 삽입 실패' });
                return;
            }
            // 데이터 삽입 성공 시 클라이언트 측에서 리디렉션을 수행
            res.redirect(`/main`);
        });
    });
});


// 로그인
app.post('/login', (req, res) => {
    const id = req.body.id;
    const password = req.body.password;

    pool.getConnection(function (err, connection) {
        if (err) throw err;

        const sql = 'SELECT * FROM memberinfo WHERE id = ? AND password = ?';
        connection.query(sql, [id, password], function (error, results, fields) {
            if (error) {
                console.error('Error executing query:', error);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // 세션 닉네임 세션에 대입
            req.session.nickname = id;
            req.session.is_logon = true;
            console.log('Session after login:', req.session); // 세션 확인
            
            //닉네임으로 대입한 세션 저장해서 리다이렉트
            req.session.save(function () {
                connection.release();
                res.redirect(`/main`);
            });
        });
    });
});

// 로그아웃
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {

            res.redirect(`/main`);

    });
});


// 메인페이지
app.get('/main', (req, res) => {
    console.log('Session in mainpage:', req.session);
        // is_logon 및 nickname 설정
        const is_logon = req.session.nickname ? true : false;
        const nickname = req.session.nickname || '';

    res.render('main',{ is_logon, nickname });
});














app.listen(port, () => {
    console.log(`서버가 실행되었습니다. 접속주소 : http://localhost: ${port}`)
})