const router = require('express').Router();
const multer = require('multer');

const UserController = require('../controllers/userController');
const LogController = require('../controllers/logController');

const automaticLogin = true;

// multer

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/../public/img/users`)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now() + file.originalname}`)
  }
})

const fileFilter = (req, file, cb) => {
  if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg' || file.mimetype == 'image/png'){
    cb(null, true);
  }else{
    cb(null, false);
  }
}

let upload = multer({
  storage: storage,
  fileFilter: fileFilter
})

// login/register/logout

router.post('/register', upload.single('profilepicture'), (req, res) => {

  if(req.body.email && req.body.password && req.body.name && req.file.filename && req.body.age && req.body.job && req.body.association && req.body.bio){
    let password = req.body.password

    // LogController.log('POST', '/api/user/register', req.body);
    console.log('POST', '/api/user/register');

    // foto word door middleware al upgeload -> req.file is een extra zekerheid dat het gelukt is
    if(req.file){

      UserController.register(req.body.email, password, req.body.name, req.file.filename, req.body.age, req.body.job, req.body.association, req.body.bio).then((value) => {
        if(value){
          // succes
          if(automaticLogin){
            UserController.login(email, password).then((value) => {
              req.session.user = value;
              req.session.loggedin = true;
              res.statusCode = 200;
              res.json(value);
            });
          }else{
            res.statusCode = 200;
            res.json(value);
          }
        }else{
          res.statusCode = 500;
          res.json({
            error: 'Unknown Error (DB 1)'
          });
        }
      }).catch((error) => {
        res.statusCode = 500;
        res.json({
          error: `Error: ${error}`
        });
      });

    }else{
      res.statusCode = 500;
      res.json({
        error: 'Error: no picture'
      });
    }
  }else{
    res.statusCode = 200;
    res.json({
      error: 'Error: missing data'
    });
  }
  

});

router.post('/login', (req, res) => {

  let password = req.body.password;

  LogController.log('POST', '/api/user/login', req.body);

  UserController.login(req.body.email, password).then((value) => {
    if(value){
      req.session.user = value;
      req.session.loggedin = true;
    }
    res.statusCode = 200;
    res.json(value); // value is false bij onjuist wachtwoord | bij goed antwoord het User object
  }).catch((value) => {
    res.statusCode = 500;
    res.json({
      error: 'Unknown Error'
    });
  });
});

router.get('/logout', (req, res) => {
  console.log('GET', '/api/user/logout', req.body);
  req.session.loggedin = false;
  req.session.user = null;
  res.status(200);
  res.redirect('/login');
});

// andere

// check als de mail al in gebruik is
router.post('/checkmail', (req, res) => {
  console.log('POST', '/api/user/checkmail', req.body);

  UserController.getUserByEmail(req.body.email).then((user) => {

    if(user){
      // gebruiker bestaat als
      res.statusCode = 200;
      res.json({
        emailExist: true
      });
    }else{
      // gebruiker bestaat niet
      res.statusCode = 200 ;
      res.json({
        emailExist: false
      });
    }
  }).catch((error) => {
    res.statusCode = 500;
      res.json({
        error: error
      });
  });

});

router.get('/userdata', (req, res) => {
  console.log('GET', '/api/user/userdata', req.body);

  if(req.session.user){
    UserController.getUser(req.session.user.id).then((user) => {
      if(user){
        res.status = 200;
        res.json(user);
      }else{
        res.status = 500;
        res.json({error: 'no user'});
      }
    }).catch((error) => {
      res.status = 500;
      res.json({error: error});
    });
  }else{
    res.status = 401;
    res.json({error: 'No session, please login again'});
  }
});

router.post('/change', (req, res) => {
  console.log('POST', '/api/user/change', req.body)
  if(req.session.user){
    if(req.body.name && req.body.age && req.body.job && req.body.association && req.body.bio){
      UserController.editProfile(req.session.user.id, {
        name: req.body.name,
        age: req.body.age,
        job: req.body.job,
        association: req.body.association,
        bio: req.body.bio,
      }).then((value) => {
        res.status = 200;
        res.json(value);
      }).catch((error) => {
        res.status = 500;
        res.json({error: error});
      });
    }else{
      res.status = 500;
      res.json({error: 'Missing data'});
    }
  }else{
    res.status = 401;
    res.json({error: 'No session, please login again'});
  }

});

module.exports = router;