const express = require('express')
const passport = require('passport')
var pgp = require('pg-promise')({})

const app = express()

const pgpConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'mapengel', // postgres
  password: process.env.PGPASS || 'postgres',
  database: process.env.PGDATABASE || 'auth-test',
  port: process.env.PGPORT || 5432
}

const db = pgp(pgpConfig)

const LocalStrategy = require('passport-local').Strategy

passport.use(
  new LocalStrategy(function (username, password, done) {
    console.log(username)
    console.log(password)
    db
      .one('SELECT password FROM users WHERE username = $1', [username])
      .then(user => {
        console.log(user)
        if(!password || !user){
          done('invalid credentials')
        }

        if (password !== user.password) {
          done('invalid credentials')
        }

        done(null, user)
      })
      .catch(error => {
        done(error)
      })
  })
)

const bodyParser = require('body-parser')
app.use(require('cookie-parser')())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(
  require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      secure: false
    },
  })
)
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
  console.log('serializeUser:', user)
  done(null, user)
})

passport.deserializeUser(function (usr, done) {
  console.log('deserializeUser:', user)
  db
    .one('SELECT * FROM users WHERE password = $1', [usr.password])
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error)
    })
}
)

app.get('/', (req, res) => res.send('Hello World!'))

app.post(
  '/login',
  passport.authenticate('local', {
    // successRedirect: '/profile',
    // failureRedirect: '/error'
  }),
  (req, res) => {
    res.send('authenticated!')
  }
)

function isAuthenticated (req, res, next) {
  if (req.user) {
    return next()
  } else {
    return res.status(401).json({
      error: 'User not authenticated'
    })
  }
}

app.get('/profile', isAuthenticated, (req, res) => {
  res.send('user profile access')
})

app.get('/logout', (req, res) => {
  console.log('logging user out')
  req.logout()
  res.redirect('/login')
})

app.listen(3001, () => console.log('Example app listening on port 3001!'))
