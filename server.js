const express = require('express')
const passport = require('passport')

const app = express()

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/MyDatabase')

const Schema = mongoose.Schema

const userDetails = new Schema({
	username: String,
	password: String
})

const UserDetails = mongoose.model('userInfo', userDetails, 'userInfo')

const LocalStrategy = require('passport-local').Strategy

passport.use(
  new LocalStrategy(function (username, password, done) {
    UserDetails.findOne({ username: username }, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false)
      }
      if (user.password !== password) {
        return done(null, false)
      }
      return done(null, user)
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
  console.log('serializing user: ')
  console.log(user)
  done(null, user._id)
})

passport.deserializeUser(function (id, done) {
  UserDetails.findById(id, function (err, user) {
    console.log('no im not serial')
    done(err, user)
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
