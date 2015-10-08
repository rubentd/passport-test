import express from 'express';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

var app = express();

app.use(express.static('static'));
app.use(express.static('bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Define authentication strategy
passport.use( new LocalStrategy( (username, password, done) => {

  console.log('authenticating with local strategy');
  console.log(username, password);

  if (username === 'admin' && password === 'admin') {
    return done(null, {
      name: 'Ruben',
      mail: 'rubentdlh@gmail.com',
    });
  }
  return done(null, false, {message: 'wrong user name or password'});
}

));

function isAuth(req) {
  if(req.user){
    console.log(`User: ${req.user} is authenticated`);
    return true;
  }
  return false;
}

app.get('/', function(req, res){
  if(isAuth(req)){
    res.sendFile('./private/index.html', { root: __dirname });
  }else{
    res.sendFile('./public/index.html', { root: __dirname });
  }
});

app.get('/pictures', (req, res) => {
  if(isAuth(req)){
    res.sendFile('./private/pictures.html', { root: __dirname });
  }else{
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile('./public/login.html', { root: __dirname });
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('User authentication successful');
  res.redirect('/');
});

passport.serializeUser( (req, user, done) => {
  var userString = JSON.stringify(user);
  done(null, userString);
});

passport.deserializeUser( (req, userString, done) => {
  console.log(`deserializing from ${userString}`);
  var user = JSON.parse(userString);
  done(null, user);
});

var server = app.listen(3000, function () {
  var port = server.address().port;

  console.log(`Server listening port ${port}`);
});
