// auth.js

/**
 * Required External Modules
 */
const express = require('express')
const router = express.Router()
const passport = require('passport')
const querystring = require('querystring')

require('dotenv').config()

/**
 * Routes Definitions
 */

router.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  (req, res) => {
    console.debug(`Inside /login`)
    res.redirect('/')
  }
)

router.get('/callback', (req, res, next) => {
  console.debug(`returnTo in /callback = ${req.session.returnTo}`)
  passport.authenticate('auth0', (err, user, info) => {
    if (err) {
      return next(err)
    }
    if (!user) {
      return res.redirect('/login')
    }
    console.debug(`returnTo in passport.authenticate = ${req.session.returnTo}`)
    const returnTo = req.session.returnTo
    req.logIn(user, (err) => {
      if (err) {
        return next(err)
      }
      //const returnTo = req.session.returnTo
      console.debug(`returnTo = ${returnTo}`)
      delete req.session.returnTo
      res.redirect(returnTo || '/')
    })
  })(req, res, next)
})

router.get('/logout', (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.error(`Unable to log out due to error ${err}`)
    }
  })
  let returnTo = req.protocol + '://' + req.hostname
  //const port = req.connection.localPort
  //const port = req.socket.localPort
  console.debug('req.headers[referer]=', req.headers['referer'])
  const port =
    req.headers['referer'] &&
    req.headers['referer'].match(/:([0-9]+)/) &&
    req.headers['referer'].match(/:([0-9]+)/).length >= 2
      ? req.headers['referer'].match(/:([0-9]+)/)[1]
      : req.socket.localPort

  console.debug('port=', port)
  if (port != undefined && port != 80 && port != 443) {
    returnTo =
      process.env.NODE_ENV === 'production'
        ? `${returnTo}/`
        : `${returnTo}:${port}/`
  }

  const logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`)

  const searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  })

  logoutURL.search = searchString

  res.redirect(logoutURL)
})

/**
 * Module Exports
 */

module.exports = router
