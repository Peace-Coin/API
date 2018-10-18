const express = require('express');
// https://www.npmjs.com/package/express-promise-router
const router = require('express-promise-router')();
const passport = require('passport');
const passportConf = require('../../services/passport');

// Controllers
const MobileController = require('../../controllers/mobile');

// Passport JWT
const passportJWT = passport.authenticate('jwt', { session: false });

// Local auth
const passportSignIn = passport.authenticate('local', {
  session: false,
  failWithError: false
});

// Google auth
const passportGooogle = passport.authenticate('googleToken', {
  session: false
});

// Facebook auth
const passportFacebook = passport.authenticate('facebookToken', {
  session: false
});

// // @reute  GET api/users/oauth/google
// // @desc   google oauth
// // @access Public
// router
//   .route('/oauth/google')
//   .post(passportGooogle, UsersController.googleOAuth);
//
// // @reute  POST api/users/oauth/facebook
// // @desc   facebook oauth
// // @access Public
// router
//   .route('/oauth/facebook')
//   .post(passportFacebook, UsersController.facebookOAuth);

router
  .route('/oauth/google')
  .post(passportGooogle, MobileController.googleOAuth);

router
  .route('/initialSetup')
  .post( MobileController.initialSetup);

router
  .route('/checkExistEmail')
  .post( MobileController.checkExistEmail);

router
  .route('/getSystemInfo')
  .post( MobileController.getSystemInfo);

router
  .route('/signup')
  .post( MobileController.signUp);

router
  .route('/signin')
  .post(
    passportSignIn,
    MobileController.signIn
  );

router.route('/verify/:id').get(MobileController.verify);

router
  .route('/oauth/facebook')
  .post(
    passportFacebook,
    function(err, req, res, next) {

      if(err){
        res.send(401);
      }
    },
    MobileController.facebookOAuth
  );

router
  .route('/resetPassword')
  .post( MobileController.resetPassword);

router
  .route('/verifyAuthenticationCode')
  .post( MobileController.verifyAuthenticationCode);

router
  .route('/updatePassword')
  .post( MobileController.updatePassword);

router
  .route('/changePassword')
  .post(
    passportJWT,
    MobileController.changePassword
  );

router
  .route('/changeEmail')
  .post(
    passportJWT,
    MobileController.changeEmail
  );

router
  .route('/getUserProfile')
  .post(
    passportJWT,
    MobileController.getUserProfile
);

router
  .route('/getUserInfoByWalletAddress')
  .post(
    passportJWT,
    MobileController.getUserInfoByWalletAddress
);

router
  .route('/checkUserProfile')
  .post(
    passportJWT,
    MobileController.checkUserProfile
);

router
  .route('/updateBackgroundImage')
  .post(
    passportJWT,
    MobileController.updateBackgroundImage
);

router
  .route('/updateUserImage')
  .post(
    passportJWT,
    MobileController.updateUserImage
);

router
  .route('/updateUserProfile')
  .post(
    passportJWT,
    MobileController.updateUserProfile
);

router
  .route('/createWallet')
  .post(
    passportJWT,
    MobileController.createWallet
);

router
  .route('/createAllCurrencyWallet')
  .post(
    passportJWT,
    MobileController.createAllCurrencyWallet
);

router
  .route('/getCurrency')
  .post(
    passportJWT,
    MobileController.getCurrency
);

router
  .route('/getWallet')
  .post(
    passportJWT,
    MobileController.getWallet
);

router
  .route('/addFriend')
  .post(
    passportJWT,
    MobileController.addFriend
);

router
  .route('/removeFriend')
  .post(
    passportJWT,
    MobileController.removeFriend
);

router
  .route('/getFriendList')
  .post(
    passportJWT,
    MobileController.getFriendList
);

router
  .route('/sendCoin')
  .post(
    passportJWT,
    MobileController.sendCoin
);

router
  .route('/testInitCoin')
  .post(
    passportJWT,
    MobileController.testInitCoin
);

router
  .route('/getHistory')
  .post(
    passportJWT,
    MobileController.getHistory
);

router
  .route('/getShop')
  .post(
    passportJWT,
    MobileController.getShop
);

router
  .route('/getManageCurrency')
  .post(
    MobileController.getManageCurrency
);

router
  .route('/getManageUserList')
  .post(
    MobileController.getManageUserList
);

router
  .route('/getUserEmail')
  .post(
    MobileController.getUserEmail
);

router
  .route('/getManageUserByEmail')
  .post(
    MobileController.getManageUserByEmail
);

router
  .route('/getManageUserByWalletAddress')
  .post(
    MobileController.getManageUserByWalletAddress
);

router
  .route('/getManageUserByUserName')
  .post(
    MobileController.getManageUserByUserName
);

router
  .route('/manageSendCoin')
  .post(
    MobileController.manageSendCoin
);

router
  .route('/getManageHistory')
  .post(
    MobileController.getManageHistory
);

router
  .route('/easyGameReflection100')
  .post(
    MobileController.easyGameReflection100
);

router
  .route('/easyGameReflection1000')
  .post(
    MobileController.easyGameReflection1000
);

router
  .route('/easyGameReflection10000')
  .post(
    MobileController.easyGameReflection10000
);

router
  .route('/easyGameReflectionMax')
  .post(
    MobileController.easyGameReflectionMax
);

module.exports = router;
