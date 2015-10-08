import express from 'express';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as FacebookStrategy} from 'passport-facebook';
import {Strategy as GoogleStrategy} from 'passport-google-oauth2';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import Server from 'socket.io';
import fileStore from 'session-file-store';
import passportSocketIo from 'passport.socketio'
import config from './config';

/* File Store */
var MongoStore = require('connect-mongo')(expressSession);
var mongoOptions = {
  url: 'mongodb://admin:admin@localhost/express-session',
}
var mStore =  new MongoStore(mongoOptions);

/* Express server */
var app = express();

app.use(express.static('static'));
app.use(express.static('bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser());
app.use(expressSession({
    key: 'express-session-cookie',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: mStore,
    cookie: {
      httpOnly: false,
      secure: false
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Local strategy
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

// Facebook strategy
passport.use(new FacebookStrategy({
    clientID: config.FB_APP_ID,
    clientSecret: config.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    enableProof: false,
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken, profile);
    console.log('auth with facebook');
    return done(null, {
      name: 'Ruben',
      mail: 'rubentdlh@gmail.com',
    });
  }
));

// Google strategy
passport.use(new GoogleStrategy({
    clientID:     config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    return done(null, {
      name: 'Ruben',
      mail: 'rubentdlh@gmail.com',
    });
  }
));

app.get('/', function(req, res){
  if(req.isAuthenticated()){
    res.sendFile('./private/index.html', { root: __dirname });
  }else{
    res.sendFile('./public/index.html', { root: __dirname });
  }
});

app.get('/pictures', (req, res) => {
  if(req.isAuthenticated()){
    res.sendFile('./private/pictures.html', { root: __dirname });
  }else{
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile('./public/login.html', { root: __dirname });
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/auth/google',
  passport.authenticate('google', { scope:
    [ 'https://www.googleapis.com/auth/plus.login',
    , 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }
));

app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
}));

app.get( '/auth/google/success', function(req, res) {
    res.redirect('/');
});

app.get( '/auth/google/failure', function(req, res) {
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('Coming from local authentication');
  res.redirect('/');
});

passport.serializeUser( (req, user, done) => {
  var userString = JSON.stringify(user);
  done(null, userString);
});

passport.deserializeUser( (req, userString, done) => {
  var user = JSON.parse(userString);
  done(null, user);
});

var server = app.listen(3000, function () {
  var port = server.address().port;

  console.log(`Server listening port ${port}`);
});


/* Socket.io server */
var io = new Server(server);

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,       // the same middleware you registrer in express
  key:          'express-session-cookie',       // the name of the cookie where express/connect stores its session_id
  secret:       'keyboard cat',    // the session_secret to parse the cookie
  store:        mStore,        // we NEED to use a sessionstore
  success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
  fail:         onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

function onAuthorizeSuccess(data, accept){
  console.log('socket authenticated');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  if(error){
    throw new Error(message);
  }
  console.log('socket not authenticated', message);
  accept(null, false);
}

io.on('connection', function(socket){
  console.log('socket connection received');
  socket.emit('handshake', { msg: 'Connection successful' });
  console.log('User:', socket.request.user);
  console.log(socket.handshake.query);
  const user = socket.request.user;

  socket.on('hello', function(data){
    console.log('hello received');
    socket.emit('hello', { msg: 'hello there!' });
  });

  socket.on('wink', function(data){
    console.log('wink received');
    if(user.logged_in){
      socket.emit('wink', { msg: 'wink wink' });
    }else{
      socket.emit('wink', { msg: 'wink denied' });
    }
  });

});
