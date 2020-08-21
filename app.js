// express
const express = require('express')
const app = express()
const port = 3000

// express-validator
const { body, check, validationResult } = require('express-validator');

// database
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

const lodashId = require('lodash-id')
db._.mixin(lodashId)

const users = db.defaults({ users: [] }).get('users')

// miscellaneous
const hash = require('pbkdf2-password')()

// middleware
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  // TODO: Add API Doc here
  res.send('Hello World!')
})

// user
app.post('/register', [
    body('username').not().isEmpty().trim().escape(),
    check('username').custom( username => {
      if (users.find({ username: username }).value() !== undefined) { throw new Error('username already exists'); }
      return true;
    }),
    body('password').not().isEmpty().trim().escape(),
    check('password')
        .isLength({ min: 6 }).withMessage('must be at least 6 chars long')
        .matches(/\d/).withMessage('must contain a number')
        .matches(/[a-zA-Z]/).withMessage('must contain a letter'),
    body('passwordConfirmation').custom((value, { req }) => {
      if (value !== req.body.password) { throw new Error('password confirmation does not match password'); }
      return true;
    })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }

  hash({ password: req.body.password }, (err, pass, salt, hash) => {
    if (err) throw err;
    users.insert({ username: req.body.username, salt: salt, hash: hash }).write()
    res.json( {status: 'success'} )
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
