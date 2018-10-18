const MysqlConnection = require('../util/MysqlConnection');
const ValidateUtil = require('../util/ValidateUtil');
const HashUtil = require('../util/HashUtil');
const FileUtil = require('../util/FileUtil');
const PcecoinMobileConst = require('../util/PcecoinMobileConst');
const JWT = require('jsonwebtoken');
const User = require('../models/user');
const { JWT_SECRET } = require('../config/keys');
const randomstring = require('randomstring');

const mailer = require('../services/mailer/mailer');
const verifyHtml = require('../services/mailer/template/verifyHtml');
const forgotWalletPasswordHtml = require('../services/mailer/template/forgotWalletPasswordHtml');
const verifyWalletHtml = require('../services/mailer/template/verifyWalletHtml');
const config = require('../config/mailer');

process.on('unhandledRejection', (err) => {

  console.log('unhandledRejection');
  console.log(err);
});

process.on('uncaughtException', function(err) {

    console.log('uncaughtException');
    console.log(err);

    //ここで落とすべきだが、現状はサーバーは稼働させ続ける
    //process.exit(1);
});

//メモ：verifyWalletHtmlを本番サーバー移行時にメールURLを確認すること
//メモ：getCurrentTimeは海外サーバのため、9時間足している

signMobileToken = user => {
  let handleName = 'guest';

  if (user.local != undefined) {
    handleName = user.local.email;
  } else if (user.google != undefined) {
    handleName = user.google.email;
  } else if (user.facebook != undefined) {
    handleName = user.facebook.email;
  }

  return JWT.sign(
    {
      iss: 'pcecoin-wallet',
      sub: user.id,
      iat: new Date().getTime(), // Current Time
      exp: new Date().setDate(new Date().getDate() + 1), // Current time + 1 day ahead
      email: handleName
    },
    JWT_SECRET
  );
};

function getCurrentTime() {
	var now = new Date();
  now.setHours(now.getHours() + 9);
	var res = "" + now.getFullYear() + "/" + padZero(now.getMonth() + 1) +
		"/" + padZero(now.getDate()) + " " + padZero(now.getHours()) + ":" +
		padZero(now.getMinutes()) + ":" + padZero(now.getSeconds());
	return res;
}

function padZero(num) {
	var result;
	if (num < 10) {
		result = "0" + num;
	} else {
		result = "" + num;
	}
	return result;
}

//非同期処理中に再スローが不可のため
function createFailedResponse(res, result, err, conn){

  if(conn){

    MysqlConnection.endConnection(conn);
  }

  result.result = false;
  result.error = err;
  Error.captureStackTrace(err);
  result.stacktrace = err.stack;

  console.log('ERROR -------------------------')
  console.log(err.stack)

  return res
    .status(400)
    .json({ result: result });
}

module.exports = {

  googleOAuth: async (req, res, next) => {
    const token = signMobileToken(req.user);
    res.status(200).json({
      success: true,
      token: token
    });
  },

  facebookOAuth: async (req, res, next) => {
    const token = signMobileToken(req.user);
    res.status(200).json({
      success: true,
      token: token
    });
  },
  getSystemInfo: async (req, res, next) => {

    let result = {};
    result.api = 'getSystemInfo';

    console.log('getSystemInfo start...')

    const {key} = req.body;
    console.log('key -> ' + key)

    if(!key){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETSYSTEMINFO_1
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error, conn);
    }

    try {

      conn = MysqlConnection.getConnection();

      console.log('conn -> ' + conn)

      conn.query('SELECT * from m_system where `key` = ?', [key], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_GETSYSTEMINFO_2
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        result.value = rows[0].value

        MysqlConnection.endConnection(conn);

        result.result = true;
        return res
            .status(200)
            .json({ result: result });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  checkExistEmail: async (req, res, next) => {

    let result = {};
    result.api = 'checkExistEmail';

    console.log('checkExistEmail start...')

    const { email} = req.body;

    try{

      // Check if there is a user with the same mail
      const foundUser = await User.findOne({ 'local.email': email });

      if (foundUser) {
        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D001;

        throw error;
      }

    }catch(err){

      console.log(err)

      return createFailedResponse(res, result, err);
    }

    result.result = true;
    result.message = PcecoinMobileConst.MESSAGE_CHECKEXISTEMAIL_1

    res
      .status(200)
      .json({ result: result });
  },
  initialSetup: async (req, res, next) => {

    let result = {};
    result.api = 'initialSetup';

    console.log('initialSetup start...')

    const { email, password, user_name, user_introduction, user_image, background_image} = req.body;

    console.log('email -> ' + email)
    console.log('password -> ' + password)
    console.log('user_name -> ' + user_name)

    try{

      //バリデーション

      if(!email){

        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P005;

        throw error;

      }else{

        if(!ValidateUtil.checkEmail(email)){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_7
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P006;

          throw error;
        }

        if(email.length > 256){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_6
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P007;

          throw error;
        }
      }

      if(!password){

        let error = {
          password: PcecoinMobileConst.MESSAGE_SIGNUP_4
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P008;

        throw error;

      }else{

        if(password.length > 20 || password.length < 8){

          let error = {
            password: PcecoinMobileConst.MESSAGE_SIGNUP_5
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P009;

          throw error;
        }
      }

      // Check if there is a user with the same mail
      const foundUser = await User.findOne({ 'local.email': email });

      if (foundUser) {
        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D001;

        throw error;
      }

      let profile = {

        user_name: user_name,
        user_image: user_image,
        user_introduction: user_introduction,
        background_image: background_image
      };

      result = ValidateUtil.checkMobileProfile(profile);

      if(!result.result){

        return res
            .status(400)
            .json({ result: result });
      }

    }catch(err){

      console.log(err)

      return createFailedResponse(res, result, err);
    }

    //ユーザー作成
    // generate reset token
    let secretToken;

    let existFlg = true;

    //secretToken 重複チェック
    while (existFlg){

      secretToken = randomstring.generate(128);

      let existSecretTokenUser = await User.findOne({ 'local.secretToken': secretToken });

      console.log('secretToken -> ' + secretToken)
      console.log('!existSecretTokenUser -> ' + !existSecretTokenUser)

      if (!existSecretTokenUser) {

        existFlg = false;
      }
    }

    //ここではhash作成のため、activeはfalse
    // creae a new user
    const newUser = new User({
      method: 'local',
      local: {
        email: email,
        password: password,
        active: false,
        secretToken: secretToken
      }
    });

    await newUser.save();

    const message = {
      from: config.MAIL_SENDER,
      to: email,
      subject: 'Notification of Activation Link/アクティベートリンクのご案内',
      html: verifyWalletHtml(secretToken)
    };
    await mailer.sendEmail(message);

    // //一度saveし、active trueで再度save
    // newUser.local.active = true;
    // newUser.save();

    const user = await User.findOne({ 'local.email': email });

    //プロフィール作成
    const user_id = user.id;

    //登録＆更新
    let conn;

    try{

      let user_image_path = user_id + "_prof_image";
      let background_image_path = user_id + "_background_image";

      let save_user_image_url = await FileUtil.saveImage(user_image_path, user_image);
      let save_background_image_url = await FileUtil.saveImage(background_image_path, background_image);

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_profile where user_id = ?', [user_id], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          console.log('INSERT m_profile start...')

          let jpNowDate = getCurrentTime();

          conn.query('INSERT INTO m_profile(user_id, user_name, user_image, user_introduction, background_image, create_at, update_at) values(?, ?, ?, ?, ?, ?, ?)', [user_id, user_name, save_user_image_url, user_introduction, save_background_image_url, jpNowDate, jpNowDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.affectedRows;

            if(rows.affectedRows != 1){

              result.result = false;
            }

            console.log('INSERT m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_1

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });

        }else{

          console.log('UPDATE m_profile start...')

          let toDate = getCurrentTime();

          console.log('toDate -> ' + toDate)

          conn.query('UPDATE m_profile SET user_name = ?, user_image = ?, user_introduction = ?, update_at = ?, background_image = ? where user_id = ?', [user_name, save_user_image_url, user_introduction, toDate, save_background_image_url, user_id], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.changedRows;

            if(rows.changedRows != 1){

              result.result = false;
            }

            console.log('UPDATE m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_2

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  signUp: async (req, res, next) => {

    let result = {};
    result.api = 'signup';

    try{

      const { email, password } = req.body;

      if(!email){

        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P005;

        throw error;

      }else{

        if(!ValidateUtil.checkEmail(email)){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_7
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P006;

          throw error;
        }

        if(email.length > 256){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_6
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P007;

          throw error;
        }
      }

      if(!password){

        let error = {
          password: PcecoinMobileConst.MESSAGE_SIGNUP_4
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P008;

        throw error;

      }else{

        if(password.length > 20 || password.length < 8){

          let error = {
            password: PcecoinMobileConst.MESSAGE_SIGNUP_5
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P009;

          throw error;
        }
      }

      // Check if there is a user with the same mail
      const foundUser = await User.findOne({ 'local.email': email });

      if (foundUser) {
        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D001;

        throw error;
      }

      // generate reset token
      let secretToken;

      let existFlg = true;

      //secretToken 重複チェック
      while (existFlg){

        secretToken = randomstring.generate(128);

        let existSecretTokenUser = await User.findOne({ 'local.secretToken': secretToken });

        console.log('secretToken -> ' + secretToken)
        console.log('!existSecretTokenUser -> ' + !existSecretTokenUser)

        if (!existSecretTokenUser) {

          existFlg = false;
        }
      }

      //ここではhash作成のため、activeはfalse
      // creae a new user
      const newUser = new User({
        method: 'local',
        local: {
          email: email,
          password: password,
          active: false,
          secretToken: secretToken
        }
      });

      await newUser.save();

      const message = {
        from: config.MAIL_SENDER,
        to: email,
        subject: 'アクティベートリンクのご案内',
        html: verifyWalletHtml(secretToken)
      };
      await mailer.sendEmail(message);

      // //一度saveし、active trueで再度save
      // newUser.local.active = true;
      // newUser.save();

    }catch(err){

      return createFailedResponse(res, result, err);
    }

    result.result = true;
    result.message = PcecoinMobileConst.MESSAGE_SIGNUP_3

    res
      .status(200)
      .json({ result: result });
  },
  verify: async (req, res, next) => {

    try{

      var secretToken = req.params.id;
      var ua = JSON.stringify(req.headers['user-agent']);
      ua = ua.toLowerCase();

      console.log("ua is " + ua);
      console.log(secretToken)

      const user = await User.findOne({ 'local.secretToken': secretToken });

      if (!user) {
        return res.status(403).json({
          error: 'Secret Token not found'
        });
      }

      // Activate Account
      user.local.active = true;

      await user.save();

      // iPhone
      var isiPhone = (ua.indexOf('iphone') > -1);
      // iPad
      var isiPad = (ua.indexOf('ipad') > -1);
      // Android
      var isAndroid = (ua.indexOf('android') > -1) && (ua.indexOf('mobile') > -1);
      // Android Tablet
      var isAndroidTablet = (ua.indexOf('android') > -1) && (ua.indexOf('mobile') == -1);

      var IOS_SCHEME = 'peacecoin://activate';
      var ANDROID_SCHEME = '';
      var ANDROID_PACKAGE = '';
      var PC_SITE = ''

      if(isiPhone || isiPad) {

          console.log('is iPhone')

          // var url = IOS_SCHEME;
          //
          // res.redirect(302, url);

          res.status(200).json({
            message: 'Activation has been completed./アクティベートが完了しました'
          });

      }else if(isAndroid || isAndroidTablet) {

          console.log('is Android')

          // var url = 'intent://#Intent;scheme=' + ANDROID_SCHEME
          //               + ';package=' + ANDROID_PACKAGE + ';end';
          //
          // res.redirect(302, url);

          res.status(200).json({
            message: 'Activation has been completed./アクティベートが完了しました'
          });

      }else {

          console.log('is PC')

          res.status(200).json({
            message: 'Activation has been completed./アクティベートが完了しました'
          });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  signIn: async (req, res, next) => {

    let result = {};
    result.api = 'signin';

    try{

      const token = signMobileToken(req.user);

      result.result = true;
      result.token = token;
      result.userid = req.user.id;

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  resetPassword: async (req, res, next) => {

    let result = {};
    result.api = 'resetPassword';

    try{

      const { email } = req.body;

      if(!email){

        let error = {
          email: PcecoinMobileConst.MESSAGE_RESETPASSWORD_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P005;

        throw error;

      }else{

        if(!ValidateUtil.checkEmail(email)){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_7
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P006;

          throw error;
        }
      }

      // Check if there is a user with the same mail
      const foundUser = await User.findOne({ 'local.email': email });
      if (!foundUser) {
        let error = {
          email: PcecoinMobileConst.MESSAGE_RESETPASSWORD_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D002;

        throw error;
      }

      // generate reset token
      let secretToken;

      let existFlg = true;

      //secretToken 重複チェック
      while (existFlg){

        secretToken = randomstring.generate(128);

        let existSecretTokenUser = await User.findOne({ 'local.secretToken': secretToken });

        console.log('secretToken -> ' + secretToken)
        console.log('!existSecretTokenUser -> ' + !existSecretTokenUser)

        if (!existSecretTokenUser) {

          existFlg = false;
        }
      }

      let confirmCode = randomstring.generate({
        length: 5,
        charset: 'numeric'
      });

      // Save Secret Token
      foundUser.local.secretToken = secretToken;
      foundUser.local.confirmCode = confirmCode;
      foundUser.save();

      result.result = true;
      result.secretToken = secretToken;
      result.message = PcecoinMobileConst.MESSAGE_RESETPASSWORD_3;

      const message = {
        from: config.MAIL_SENDER,
        to: foundUser.local.email,
        subject: 'Notification of Authentication Code/認証コードのご案内',
        html: forgotWalletPasswordHtml(confirmCode)
      };
      await mailer.sendEmail(message);

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  verifyAuthenticationCode: async (req, res, next) => {

    let result = {};
    result.api = 'verifyAuthenticationCode';

    try{

      // Secret Token Check
      const { secretToken, code } = req.body;

      const foundUser = await User.findOne({ 'local.secretToken': secretToken, 'local.confirmCode': code });

      console.log('secretToken -> ' + secretToken)

      if (!foundUser || secretToken === null || secretToken === '') {

        let error = {
          message: PcecoinMobileConst.MESSAGE_CONFIRMCODE_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D017;

        throw error;
      }

      result.result = true;
      result.message = PcecoinMobileConst.MESSAGE_CONFIRMCODE_2

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }

  },
  changePassword: async (req, res, next) => {

    let result = {};
    result.api = 'changePassword';

    try{

      const user_id = req.user.id;

      // Secret Token Check
      const { oldPassword, newPassword } = req.body;

      if(!oldPassword){

        let error = {
          password: PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P017;

        throw error;

      }else{

        if(!newPassword){

          let error = {
            password: PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_2
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P018;

          throw error;
        }

        if(newPassword.length > 20 || newPassword.length < 8){

          let error = {
            password: PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_3
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P018;

          throw error;
        }
      }

      const foundUser = await User.findOne({ '_id': user_id });

      //console.log(foundUser)

      if (!foundUser) {

        let error = {
          message: PcecoinMobileConst.MESSAGE_UPDATEPASSWORD_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D003;

        throw error;
      }

      const isMatch = await foundUser.isValidPassword(oldPassword);

      if(!isMatch){

        let error = {
          message: PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_4
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P018;

        throw error;
      }

      // Generate Rondom Token
      const newSecretToken = randomstring.generate(128);

      // Password & secretToken is updated
      await foundUser.updatePassword(newPassword);
      foundUser.local.secretToken = newSecretToken;
      foundUser.local.active = true;
      foundUser.save();

      result.result = true;
      result.message = PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_5

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  changeEmail: async (req, res, next) => {

    let result = {};
    result.api = 'changeEmail';

    try{

      const user_id = req.user.id;

      // Secret Token Check
      const { email } = req.body;

      if(!email){

        let error = {
          email: PcecoinMobileConst.MESSAGE_CHANGEEMAIL_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P019;

        throw error;

      }else{

        if(!ValidateUtil.checkEmail(email)){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_7
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P019;

          throw error;
        }

        if(email.length > 256){

          let error = {
            email: PcecoinMobileConst.MESSAGE_SIGNUP_6
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P019;

          throw error;
        }
      }

      const emailUser = await User.findOne({ 'local.email': email });

      if (emailUser) {
        let error = {
          email: PcecoinMobileConst.MESSAGE_SIGNUP_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D001;

        throw error;
      }

      var foundUser = await User.findOne({ '_id': user_id });

      //console.log(foundUser)

      if (!foundUser) {

        let error = {
          message: PcecoinMobileConst.MESSAGE_UPDATEPASSWORD_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D003;

        throw error;
      }

      foundUser.local.email = email;
      foundUser.save();

      result.result = true;
      result.message = PcecoinMobileConst.MESSAGE_CHANGEPASSWORD_5

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  updatePassword: async (req, res, next) => {

    let result = {};
    result.api = 'updatePassword';

    try{

      // Secret Token Check
      const { secretToken, password } = req.body;

      if(!password){

        let error = {
          password: PcecoinMobileConst.MESSAGE_SIGNUP_4
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P008;

        throw error;

      }else{

        if(password.length > 20 || password.length < 8){

          let error = {
            password: PcecoinMobileConst.MESSAGE_SIGNUP_5
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P009;

          throw error;
        }
      }

      const foundUser = await User.findOne({ 'local.secretToken': secretToken });

      console.log('secretToken -> ' + secretToken)

      if (!foundUser || secretToken === null || secretToken === '') {

        let error = {
          message: PcecoinMobileConst.MESSAGE_UPDATEPASSWORD_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D003;

        throw error;
      }

      // Generate Rondom Token
      const newSecretToken = randomstring.generate(128);

      // Password & secretToken is updated
      await foundUser.updatePassword(password);
      foundUser.local.secretToken = newSecretToken;
      foundUser.local.active = true;
      foundUser.save();

      // Check if the password is correct
      const isMatch = await foundUser.isValidPassword(password);
      // If not, handle it
      if (!isMatch) {

        let error = {
          message: PcecoinMobileConst.MESSAGE_UPDATEPASSWORD_2
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

        throw error;
      }

      result.result = true;
      result.message = PcecoinMobileConst.MESSAGE_UPDATEPASSWORD_3

      res.status(200).json({
        result: result
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },

  getCurrency: (req, res, next) => {

    let result = {};
    result.api = 'getCurrency';
    let conn;

    const userid = req.user.id;

    try {

      //const { email, password } = req.value.body;

      console.log('getCurrency controller start...')

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * FROM m_currency LEFT JOIN (select balance, currency_code as mwcc from m_wallet where user_id = ?) m_wallet ON m_currency.currency_code = m_wallet.mwcc ORDER BY balance DESC', [userid], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        result.currency = rows;

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: result });
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },

  getUserProfile: (req, res, next) => {

    let result = {};
    result.api = 'getUserProfile';
    result.result = true;
    let conn;

    const userid = req.user.id;

    console.log('userid -> ')
    console.log(userid)

    try {

      //const { email, password } = req.value.body;

      console.log('getUserProfile controller start...')

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_profile where user_id = ?', [userid], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        result.profile = rows;

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: result });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  checkUserProfile: (req, res, next) => {

    let result = {};
    result.api = 'checkUserProfile';
    let conn;

    const {user_name, user_image, user_introduction} = req.body;

    // console.log('user_name -> ' + user_name)
    // console.log('user_image -> ' + user_image)
    // console.log('user_introduction -> ' + user_introduction)

    try {

      let profile = {

        user_name: user_name,
        user_image: user_image,
        user_introduction: user_introduction,
      };

      let result = ValidateUtil.checkMobileProfile(profile);

      if(result.result){

        return res
            .status(200)
            .json({ result: result });

      }else{

        return res
            .status(400)
            .json({ result: result });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  updateBackgroundImage: async(req, res, next) => {

    let result = {};
    result.api = 'updateBackgroundImage';
    result.result = true;

    const {background_image} = req.body;

    try {

      if(!ValidateUtil.maxLength(background_image, 14000000)){

        if(!result.error_param_code){

          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P014;
        }

        if(!error.background_image){

          error.background_image = PcecoinMobileConst.LABEL_BACKGROUND_IMAGE + PcecoinMobileConst.ERROR_MESSAGE_MAX_BYTE_LENGTH.replace("?", 10);
        }

        result.result = false;
        result.error = error;

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
      }

      if(!result.result){

        return res
            .status(400)
            .json({ result: result });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }

    const user_id = req.user.id;

    //登録＆更新
    let conn;

    try{

      let background_image_path = user_id + "_background_image";
      let save_background_image_url = await FileUtil.saveImage(background_image_path, background_image);

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_profile where user_id = ?', [user_id], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
          result.message = PcecoinMobileConst.MESSAGE_NOT_EXIST_PROFILE

          return createFailedResponse(res, result, err, conn);

        }else{

          console.log('UPDATE m_profile start...')

          let toDate = getCurrentTime();

          console.log('toDate -> ' + toDate)

          conn.query('UPDATE m_profile SET background_image = ?, update_at = ? where user_id = ?', [save_background_image_url, toDate, user_id], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.changedRows;

            if(rows.changedRows != 1){

              result.result = false;
            }

            console.log('UPDATE m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_2

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  updateUserImage: async(req, res, next) => {

    let result = {};
    result.api = 'updateUserImage';
    result.result = true;

    const {user_image} = req.body;

    try {

      if(!ValidateUtil.maxLength(user_image, 14000000)){

        if(!result.error_param_code){

          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P004;
        }

        if(!error.user_image){

          error.user_image = PcecoinMobileConst.LABEL_USER_IMAGE + PcecoinMobileConst.ERROR_MESSAGE_MAX_BYTE_LENGTH.replace("?", 10);
        }

        result.result = false;
        result.error = error;

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
      }

      if(!result.result){

        return res
            .status(400)
            .json({ result: result });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }

    const user_id = req.user.id;

    //登録＆更新
    let conn;

    try{

      let user_image_path = user_id + "_prof_image";

      let save_user_image_url = await FileUtil.saveImage(user_image_path, user_image);

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_profile where user_id = ?', [user_id], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
          result.message = PcecoinMobileConst.MESSAGE_NOT_EXIST_PROFILE

          return createFailedResponse(res, result, err, conn);

        }else{

          console.log('UPDATE m_profile start...')

          let toDate = getCurrentTime();

          console.log('toDate -> ' + toDate)

          conn.query('UPDATE m_profile SET user_image = ?, update_at = ? where user_id = ?', [save_user_image_url, toDate, user_id], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.changedRows;

            if(rows.changedRows != 1){

              result.result = false;
            }

            console.log('UPDATE m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_2

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  updateUserProfile: async(req, res, next) => {

    let result = {};
    result.api = 'updateUserProfile';

    const {user_name, user_image, user_introduction, background_image} = req.body;

    // console.log('user_name -> ' + user_name)
    // console.log('user_image -> ' + user_image)
    // console.log('user_introduction -> ' + user_introduction)

    try {

      let profile = {

        user_name: user_name,
        user_image: user_image,
        user_introduction: user_introduction,
        background_image: background_image
      };

      let result = ValidateUtil.checkMobileProfile(profile);

      if(!result.result){

        return res
            .status(400)
            .json({ result: result });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }

    const user_id = req.user.id;

    //登録＆更新
    let conn;

    try{

      let user_image_path = user_id + "_prof_image";
      let background_image_path = user_id + "_background_image";

      let save_user_image_url = await FileUtil.saveImage(user_image_path, user_image);
      let save_background_image_url = await FileUtil.saveImage(background_image_path, background_image);

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_profile where user_id = ?', [user_id], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          console.log('INSERT m_profile start...')

          let jpNowDate = getCurrentTime();

          conn.query('INSERT INTO m_profile(user_id, user_name, user_image, user_introduction, background_image, create_at, update_at) values(?, ?, ?, ?, ?, ?, ?)', [user_id, user_name, save_user_image_url, user_introduction, save_background_image_url, jpNowDate, jpNowDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.affectedRows;

            if(rows.affectedRows != 1){

              result.result = false;
            }

            console.log('INSERT m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_1

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });

        }else{

          console.log('UPDATE m_profile start...')

          let toDate = getCurrentTime();

          console.log('toDate -> ' + toDate)

          conn.query('UPDATE m_profile SET user_name = ?, user_image = ?, user_introduction = ?, update_at = ?, background_image = ? where user_id = ?', [user_name, save_user_image_url, user_introduction, toDate, save_background_image_url, user_id], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.count = rows.changedRows;

            if(rows.changedRows != 1){

              result.result = false;
            }

            console.log('UPDATE m_profile end...')

            result.message = PcecoinMobileConst.MESSAGE_UPDATEPROFILE_2

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  //開発テスト用API
  testInitCoin: (req, res, next) => {

    let result = {};
    result.api = 'testInitCoin';

    const {currency_code, amount} = req.body;
    const user_id = req.user.id;

    console.log('user_id -> ' + user_id)
    console.log('currency_code -> ' + currency_code)

    let conn;

    try{

      if(!currency_code){

        let error = {
          message: PcecoinMobileConst.MESSAGE_CREATEWALLET_3
        };

        throw error;
      }

      if(!amount){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_5
        };

        return createFailedResponse(res, result, error);

      }else{

        if(!ValidateUtil.checkNumber(amount)){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_6
          };

          return createFailedResponse(res, result, error);
        }

        if(amount <= 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_12
          };

          return createFailedResponse(res, result, error);
        }
      }

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_currency where currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err) {

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_CREATEWALLET_2
          };

          return createFailedResponse(res, result, error, conn);
        }

        conn.query('SELECT * from m_wallet where user_id = ?', [user_id], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          if(rows.length == 0){

            let error = {
              message: PcecoinMobileConst.MESSAGE_GETWALLET_1
            };

            return createFailedResponse(res, result, error, conn);
          }

          conn.query('UPDATE m_wallet SET balance = ? where user_id = ? and currency_code = ?', [amount, user_id, currency_code], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            console.log('coin init !')

            result.message = '開発テスト用に残高を' + amount + currency_code + 'に初期化しました'

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  createAllCurrencyWallet: (req, res, next) => {

    let result = {};
    result.api = 'createAllCurrencyWallet';
    result.result = true;

    const user_id = req.user.id;

    let conn;

    try{

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_wallet where user_id = ?', user_id, (err, rows, fields) => {

        if (err) {

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        //ウォレット未作成時
        if(rows.length == 0){

          let walletAddress = HashUtil.createWalletAddressHash();

          conn.query('SELECT * from m_wallet where wallet_address = ?', [walletAddress], (err, rows, fields) => {

            if (err) {

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            if(rows.length == 0){

              conn.query('SELECT * from m_currency', (err, rows, fields) => {

                if (err) {

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                  return createFailedResponse(res, result, err, conn);
                }

                let insertValuesBindSet = '';
                var insertValuesBindParam = [];

                let jpNowDate = getCurrentTime();

                for(let i = 0; i < rows.length; i++) {

                  if(insertValuesBindSet.length == 0){

                    insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?)';

                  }else{

                    insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?)';
                  }

                  insertValuesBindParam.push(user_id);
                  insertValuesBindParam.push(walletAddress);
                  insertValuesBindParam.push(rows[i].currency_code);
                  insertValuesBindParam.push(jpNowDate);
                  insertValuesBindParam.push(jpNowDate);
                }

                console.log('insertValuesBindSet -> ' + insertValuesBindSet);
                console.log('insertValuesBindParam -> ' + insertValuesBindParam);

                conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

                  if (err) {

                    result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                    return createFailedResponse(res, result, err, conn);
                  }

                  result.count = rows.affectedRows;

                  if(rows.affectedRows == 0){

                    let error = {
                      message: PcecoinMobileConst.ERROR_DB
                    };

                    return createFailedResponse(res, result, error, conn);
                  }

                  console.log('createWallet Success')

                  result.message = PcecoinMobileConst.MESSAGE_CREATEWALLET_1

                  MysqlConnection.endConnection(conn);

                  return res
                      .status(200)
                      .json({ result: result });

                });
              });

            }else{

              let error = {
                message: PcecoinMobileConst.MESSAGE_CREATEWALLET_4
              };

              result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

              return createFailedResponse(res, result, error, conn);
            }
          });

        }else{

          //すでに何らかの通貨コードのウォレットがある場合

          let walletAddress;
          let existCurrencyCode = [];
          let existBindValuesBindSet = '';

          for(let i = 0; i < rows.length; i++) {

            walletAddress = rows[i].wallet_address;

            existCurrencyCode.push(rows[i].currency_code);

            if(existBindValuesBindSet.length == 0){

              existBindValuesBindSet = '?';

            }else{

              existBindValuesBindSet = existBindValuesBindSet + ',?';
            }
          }

          console.log('existBindValuesBindSet -> ' + existBindValuesBindSet)
          console.log('existCurrencyCode -> ' + existCurrencyCode)

          conn.query('SELECT * from m_currency WHERE currency_code NOT IN (' + existBindValuesBindSet + ')', existCurrencyCode, (err, rows, fields) => {

            if (err) {

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            if(rows.length != 0){

              let insertValuesBindSet = '';
              let insertValuesBindParam = [];

              let jpNowDate = getCurrentTime();

              for(let i = 0; i < rows.length; i++) {

                if(insertValuesBindSet.length == 0){

                  insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?)';

                }else{

                  insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?)';
                }

                insertValuesBindParam.push(user_id);
                insertValuesBindParam.push(walletAddress);
                insertValuesBindParam.push(rows[i].currency_code);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
              }

              console.log('insertValuesBindSet -> ' + insertValuesBindSet);
              console.log('insertValuesBindParam -> ' + insertValuesBindParam);

              conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

                if (err) {

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                  return createFailedResponse(res, result, err, conn);
                }

                result.count = rows.affectedRows;

                if(rows.affectedRows == 0){

                  let error = {
                    message: PcecoinMobileConst.ERROR_DB
                  };

                  return createFailedResponse(res, result, error, conn);
                }

                console.log('createWallet Success')

                result.message = PcecoinMobileConst.MESSAGE_CREATEWALLET_1

                MysqlConnection.endConnection(conn);

                return res
                    .status(200)
                    .json({ result: result });

              });

            }else{

              let error = {
                message: PcecoinMobileConst.MESSAGE_CREATEWALLET_6
              };

              result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

              return createFailedResponse(res, result, error, conn);
            }
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  createWallet: (req, res, next) => {

    let result = {};
    result.api = 'createWallet';

    const {currency_code} = req.body;
    const user_id = req.user.id;

    console.log('user_id -> ' + user_id)
    console.log('currency_code -> ' + currency_code)

    //登録
    let conn;

    try{

      if(!currency_code){

        let error = {
          message: PcecoinMobileConst.MESSAGE_CREATEWALLET_3
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        throw error;
      }

      result.result = true;

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_currency where currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err) {

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_CREATEWALLET_2
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

          return createFailedResponse(res, result, error, conn);
        }

        conn.query('SELECT * from m_wallet where user_id = ?', [user_id], (err, rows, fields) => {

          if (err) {

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          if(rows.length == 0){

            let walletAddress = HashUtil.createWalletAddressHash();

              conn.query('SELECT * from m_wallet where wallet_address = ?', [walletAddress], (err, rows, fields) => {

                if (err) {

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                  return createFailedResponse(res, result, err, conn);
                }

                if(rows.length == 0){

                  let jpNowDate = getCurrentTime();

                  conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, create_at, update_at) values(?, ?, ?, ?, ?)', [user_id, walletAddress, currency_code, jpNowDate, jpNowDate], (err, rows, fields) => {

                    if (err) {

                      result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                      return createFailedResponse(res, result, err, conn);
                    }

                    result.count = rows.affectedRows;

                    if(rows.affectedRows != 1){

                      let error = {
                        message: PcecoinMobileConst.ERROR_DB
                      };

                      return createFailedResponse(res, result, error, conn);
                    }

                    console.log('createWallet Success')

                    result.message = PcecoinMobileConst.MESSAGE_CREATEWALLET_1

                    MysqlConnection.endConnection(conn);

                    return res
                        .status(200)
                        .json({ result: result });

                  });

                }else{

                  let error = {
                    message: PcecoinMobileConst.MESSAGE_CREATEWALLET_4
                  };

                  result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                  return createFailedResponse(res, result, error, conn);
                }
              });

          }else{

            console.log('rows -> ')
            console.log(rows)

            let walletAddress = rows[0].wallet_address;
            console.log('walletAddress ->' + walletAddress)

            let jpNowDate = getCurrentTime();

            //すでに自分のwalletアドレスがある場合、別通貨コードでもそれを使用する
            conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, create_at, update_at) values(?, ?, ?, ?, ?)', [user_id, walletAddress, currency_code, jpNowDate, jpNowDate], (err, rows, fields) => {

              if (err) {

                let error = {
                  message: PcecoinMobileConst.MESSAGE_CREATEWALLET_5
                };

                result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                return createFailedResponse(res, result, error, conn);
              }

              result.count = rows.affectedRows;

              console.log('createWallet Success')

              result.message = PcecoinMobileConst.MESSAGE_CREATEWALLET_1

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });

            });
          }
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  getWallet: (req, res, next) => {

    let result = {};
    result.api = 'getWallet';
    let conn;

    const userid = req.user.id;

    console.log('userid -> ')
    console.log(userid)

    try {

      //const { email, password } = req.value.body;

      console.log('getWallet controller start...')

      conn = MysqlConnection.getConnection();

      console.log('conn -> ' + conn)

      conn.query('SELECT * from m_wallet INNER JOIN m_currency ON m_wallet.currency_code = m_currency.currency_code where user_id = ? ORDER BY balance DESC', [userid], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_GETWALLET_1
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        result.wallet = rows;

        var total_pce = 0;

        for(let i = 0; i < rows.length; i++) {

          total_pce = total_pce + rows[i].balance;
        }

        result.total_pce = total_pce;

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: result });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  getUserInfoByWalletAddress: (req, res, next) => {

    let result = {};
    result.api = 'getUserInfoByWalletAddress';
    let conn;

    const userid = req.user.id;

    console.log('userid -> ')
    console.log(userid)

    const { wallet_address } = req.body;

    if(!wallet_address){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETUSERINFOBYWALLETADDRESS_3
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error);
    }

    try {

      //const { email, password } = req.value.body;

      console.log('getUserInfoByWalletAddress controller start...')

      conn = MysqlConnection.getConnection();

      conn.query('SELECT DISTINCT user_id from m_wallet_mgt where wallet_address = ?', [wallet_address], (err, rows, fields) => {

        if(rows.length != 0){

          let targetUserId = rows[0].user_id;

          conn.query('SELECT * from m_profile where user_id = ?', [targetUserId], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            if(rows.length == 0){

              let error = {
                message: PcecoinMobileConst.MESSAGE_GETUSERINFOBYWALLETADDRESS_2
              };

              result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

              return createFailedResponse(res, result, error, conn);
            }

            result.user = rows;

            MysqlConnection.endConnection(conn);

            return res
                .status(200)
                .json({ result: result });
          });

        }else{

          conn.query('SELECT DISTINCT user_id from m_wallet where wallet_address = ?', [wallet_address], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            if(rows.length == 0){

              let error = {
                message: PcecoinMobileConst.MESSAGE_GETUSERINFOBYWALLETADDRESS_1
              };

              result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

              return createFailedResponse(res, result, error, conn);
            }

            let targetUserId = rows[0].user_id;

            conn.query('SELECT * from m_profile where user_id = ?', [targetUserId], (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              if(rows.length == 0){

                let error = {
                  message: PcecoinMobileConst.MESSAGE_GETUSERINFOBYWALLETADDRESS_2
                };

                result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                return createFailedResponse(res, result, error, conn);
              }

              result.user = rows;

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });
            });
          });
        }
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  addFriend: (req, res, next) => {

    let result = {};
    result.api = 'addFriend';

    const {target_user_id} = req.body;
    const user_id = req.user.id;

    console.log('user_id -> ' + user_id)

    //登録
    let conn;

    try{

      if(!target_user_id){

        let error = {
          message: PcecoinMobileConst.MESSAGE_ADDFRIEND_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        throw error;
      }

      if(user_id === target_user_id){

        let error = {
          message: PcecoinMobileConst.MESSAGE_ADDFRIEND_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        throw error;
      }

      result.result = true;

      conn = MysqlConnection.getConnection();

      //ユーザー情報が存在するか
      conn.query('SELECT * from m_profile where user_id = ?', [target_user_id], (err, rows, fields) => {

        if (err) {

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_ADDFRIEND_3
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        //すでにフレンド登録済みか
        conn.query('SELECT * from m_friend where user_id = ? and friend_user_id = ?', [user_id, target_user_id], (err, rows, fields) => {

          if (err) {

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          //未登録でフレンド登録
          if(rows.length == 0){

            let jpNowDate = getCurrentTime();

            conn.query('INSERT INTO m_friend (user_id, friend_user_id, create_at, update_at) values(?, ?, ?, ?)', [user_id, target_user_id, jpNowDate, jpNowDate], (err, rows, fields) => {

              if (err) {return createFailedResponse(res, result, err, conn);}

              result.count = rows.affectedRows;

              console.log('addFriend Success')

              result.message = PcecoinMobileConst.MESSAGE_ADDFRIEND_4

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });

            });

          }else{

            let error = {
              message: PcecoinMobileConst.MESSAGE_ADDFRIEND_2
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

            return createFailedResponse(res, result, error, conn);
          }
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  removeFriend: (req, res, next) => {

    let result = {};
    result.api = 'removeFriend';

    const {target_user_id} = req.body;
    const user_id = req.user.id;

    console.log('user_id -> ' + user_id)

    //登録
    let conn;

    try{

      if(!target_user_id){

        let error = {
          message: PcecoinMobileConst.MESSAGE_REMOVEFRIEND_1
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        throw error;
      }

      result.result = true;

      conn = MysqlConnection.getConnection();

      //ユーザー情報が存在するか
      conn.query('SELECT * from m_profile where user_id = ?', [target_user_id], (err, rows, fields) => {

        if (err) {

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_REMOVEFRIEND_3
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        //現在フレンド登録済みか
        conn.query('SELECT * from m_friend where user_id = ? and friend_user_id = ?', [user_id, target_user_id], (err, rows, fields) => {

          if (err) {

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          //登録済みでフレンド解除
          if(rows.length != 0){

            conn.query('DELETE FROM m_friend where user_id = ? and friend_user_id = ?', [user_id, target_user_id], (err, rows, fields) => {

              if (err) {

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              result.count = rows.affectedRows;

              console.log('addFriend Success')

              result.message = PcecoinMobileConst.MESSAGE_REMOVEFRIEND_4

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });

            });

          }else{

            let error = {
              message: PcecoinMobileConst.MESSAGE_REMOVEFRIEND_2
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

            return createFailedResponse(res, result, error, conn);
          }
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  getFriendList: (req, res, next) => {

    let result = {};
    result.api = 'getFriendList';
    result.result = true;
    let conn;

    const userid = req.user.id;

    console.log('userid -> ')
    console.log(userid)

    let {limit, offset} = req.body;

    if(!limit){

      limit = "50";

    }else{

      if(!ValidateUtil.checkNumber(limit)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    if(!offset){

      offset = "0";

    }else{

      if(!ValidateUtil.checkNumber(offset)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_6
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    let lmt = Number(limit)
    let ofst = Number(offset)

    try {

      //const { email, password } = req.value.body;

      console.log('getFriendList controller start...')

      conn = MysqlConnection.getConnection();

      //フレンド取得
      conn.query('SELECT distinct m_wallet.wallet_address, T.user_id, T.user_name, T.user_image, T.user_introduction, T.latest_transaction_date FROM peace_coin.m_wallet INNER JOIN (SELECT m_profile.user_id, m_profile.user_name, m_profile.user_image, m_profile.user_introduction, m_friend.latest_transaction_date FROM m_profile INNER JOIN m_friend ON m_profile.user_id = m_friend.friend_user_id WHERE m_friend.user_id = ? ORDER BY latest_transaction_date DESC LIMIT ?, ?) T ON T.user_id = m_wallet.user_id', [userid, ofst, lmt], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        // if(rows.length == 0){
        //
        //   let error = {
        //     message: PcecoinMobileConst.MESSAGE_GETFRIENDLIST_1
        //   };
        //
        //   return createFailedResponse(res, result, error, conn);
        // }

        result.friend = rows;
        result.count = rows.length;

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: result });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  sendCoin: (req, res, next) => {

    let result = {};
    result.api = 'sendCoin';
    result.result = true;
    let conn;

    console.log('sendCoin controller start...')

    const userid = req.user.id;
    const {send_wallet_address, currency_code, amount, message} = req.body;

    console.log('send_wallet_address -> ' + send_wallet_address)
    console.log('currency_code -> ' + currency_code)
    console.log('amount -> ' + amount)
    console.log('message -> ' + message)

    let {group_id} = req.body;

    console.log('userid -> ')
    console.log(userid)

    try {

      //バリデーション開始
      if(!send_wallet_address){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_8
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D007;

        return createFailedResponse(res, result, error);
      }

      if(!currency_code){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_3
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D004;

        return createFailedResponse(res, result, error);
      }

      if(!amount){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P010;

        return createFailedResponse(res, result, error);

      }else{

        if(!ValidateUtil.checkNumber(amount)){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_6
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P011;

          return createFailedResponse(res, result, error);
        }

        if(amount <= 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_12
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P011;

          return createFailedResponse(res, result, error);
        }

        if(amount.length > 10){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_16
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P012;

          return createFailedResponse(res, result, error);
        }
      }

      if(message){

        if(message.length >= 500){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_9
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P013;

          return createFailedResponse(res, result, error);
        }
      }

      if(group_id){

        if(group_id.length != 50){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_14
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error);
        }
      }else{

        group_id = null;
      }

      //バリデーション終了

      conn = MysqlConnection.getConnection();

      //送金先のウォレット情報取得
      conn.query('SELECT DISTINCT user_id FROM m_wallet WHERE wallet_address = ?', [send_wallet_address], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if (rows == undefined){

          console.log('------ send coin rows undefined')

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_4
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        if(rows[0].user_id === userid){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_10
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        var sendUserId = rows[0].user_id;
        var myWalletAddress;

        console.log('userid -> ' + userid)
        console.log('currency_code -> ' + currency_code)

        //自分のウォレットを取得
        conn.query('SELECT * FROM m_wallet WHERE user_id = ? AND currency_code = ?', [userid, currency_code], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          //自分の情報チェック（スマホ側でウォレット作成APIを実施してない）
          if(rows.length == 0){

            let error = {
              message: PcecoinMobileConst.MESSAGE_SENDCOIN_12
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
            return createFailedResponse(res, result, error, conn);
          }

          var balance = rows[0].balance;
          myWalletAddress = rows[0].wallet_address;

          //残高チェック
          if(balance < amount){

            let error = {
              message: PcecoinMobileConst.MESSAGE_SENDCOIN_1
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
            return createFailedResponse(res, result, error, conn);
          }

          conn.query('SELECT * FROM t_transaction WHERE `from` = ? AND `to` = ? AND currency_code = ? ORDER BY transaction_date DESC', [myWalletAddress, send_wallet_address, currency_code], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            //連続送金チェック
            if(rows.length != 0){

              let transactionDate = rows[0].transaction_date;
              let toDate = new Date(getCurrentTime());

              var msDiff = toDate.getTime() - transactionDate.getTime();
              var secondDiff = Math.floor(msDiff / (1000));

              console.log('secondDiff -> ' + secondDiff)

              //1分以内に同じ相手に送金している場合
              if(secondDiff < 60){

                let error = {
                  message: PcecoinMobileConst.MESSAGE_SENDCOIN_2
                };

                result.error_code = PcecoinMobileConst.ERROR_CODE_0002;

                return createFailedResponse(res, result, error, conn);
              }
            }

            //ウォレット残高の更新とトランザクションの挿入、その後相手ウォレットへの反映
            conn.beginTransaction(function(err) {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              let ins_transaction_id = HashUtil.createTransactionAddressHash();
              let ins_currency_code = currency_code;
              let ins_from = myWalletAddress;
              let ins_to = send_wallet_address;
              let ins_amount = amount;
              let ins_message = message;
              let ins_transaction_date = getCurrentTime();
              let ins_status = 1;

              let jpNowDate = getCurrentTime();

              //トランザクションの挿入
              conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, message, transaction_date, status, group_id, create_at, update_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ins_transaction_id, ins_currency_code, ins_from, ins_to, ins_amount, ins_message, ins_transaction_date, ins_status, group_id, jpNowDate, jpNowDate], (err, rows, fields) => {

                if (err) {

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                  //ロールバック
                  conn.rollback(function() {
                    return createFailedResponse(res, result, err, conn);
                  });
                }

                let upd_balance = balance - amount;
                let upd_update_at = getCurrentTime();

                //自分の残高を減額
                conn.query('UPDATE m_wallet SET balance = ?, update_at = ? where user_id = ? and wallet_address = ? and currency_code = ?', [upd_balance, upd_update_at, userid, myWalletAddress, currency_code], (err, rows, fields) => {

                  if (err){

                    result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                    //ロールバック
                    conn.rollback(function() {
                      return createFailedResponse(res, result, err, conn);
                    });
                  }

                  //相手先の通貨コード指定のウォレット残高を取得
                  conn.query('SELECT * FROM m_wallet WHERE wallet_address = ? and currency_code = ?', [send_wallet_address, currency_code], (err, rows, fields) => {

                    if (err){

                      result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                      //ロールバック
                      conn.rollback(function() {
                        return createFailedResponse(res, result, err, conn);
                      });
                    }

                    console.log('rows -> ')
                    console.log(rows)

                    //取得結果0件の場合は、新たに作成する
                    if(rows.length == 0){

                      let ins_wa_send_user_id = sendUserId;
                      let ins_wa_send_wallet_address = send_wallet_address;
                      let ins_wa_currency_code = currency_code;
                      let ins_wa_balance = Number(amount);

                      conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, balance, create_at, update_at) values(?, ?, ?, ?, ?, ?)', [ins_wa_send_user_id, ins_wa_send_wallet_address, ins_wa_currency_code, ins_wa_balance, jpNowDate, jpNowDate], (err, rows, fields) => {

                        if (err){

                          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                          //ロールバック
                          conn.rollback(function() {
                            return createFailedResponse(res, result, err, conn);
                          });

                        }else{

                          result.count = rows.affectedRows;

                          if(rows.affectedRows != 1){

                            //ロールバック
                            conn.rollback(function() {
                              return createFailedResponse(res, result, err, conn);
                            });
                          }

                          //コミット
                          conn.commit(function(err) {

                            if (err) {

                              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                              conn.rollback(function() {
                                return createFailedResponse(res, result, err, conn);
                              });

                            }else{

                              let upd_fl_update_at = getCurrentTime();

                              conn.query('UPDATE m_friend SET latest_transaction_date = ?, update_at = ? where user_id = ? and friend_user_id = ?', [upd_fl_update_at, upd_fl_update_at, userid, sendUserId], (err, rows, fields) => {

                                if (err) {

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                                  let error = {
                                    message: PcecoinMobileConst.MESSAGE_SENDCOIN_15
                                  };

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                                  return createFailedResponse(res, result, error, conn);
                                }

                                console.log('sendCoin Success');

                                result.message = PcecoinMobileConst.MESSAGE_SENDCOIN_11

                                MysqlConnection.endConnection(conn);

                                return res
                                    .status(200)
                                    .json({ result: result });
                              });
                            }
                          });
                        }
                      });

                    }else{

                      let oldSendBalance = rows[0].balance;

                      let upd_wa_balance = Number(oldSendBalance) + Number(amount);
                      let upd_wa_update_at = getCurrentTime();
                      let upd_wa_user_id = sendUserId;
                      let upd_wa_wallet_address = send_wallet_address;
                      let upd_wa_currency_code = currency_code;

                      console.log('upd_wa_balance -> ' + upd_wa_balance)
                      console.log('upd_wa_update_at -> ' + upd_wa_update_at)
                      console.log('upd_wa_user_id -> ' + upd_wa_user_id)
                      console.log('upd_wa_wallet_address -> ' + upd_wa_wallet_address)
                      console.log('upd_wa_currency_code -> ' + upd_wa_currency_code)

                      //相手先の残高更新
                      conn.query('UPDATE m_wallet SET balance = ?, update_at = ? where user_id = ? and wallet_address = ? and currency_code = ?', [upd_wa_balance, upd_wa_update_at, upd_wa_user_id, upd_wa_wallet_address, upd_wa_currency_code], (err, rows, fields) => {

                        if (err){

                          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                          //ロールバック
                          conn.rollback(function() {

                            console.log('roll back ')

                            return createFailedResponse(res, result, err, conn);
                          });

                        }else{

                          result.count = rows.changedRows;

                          if(rows.changedRows != 1){

                            result.result = false;

                            //ロールバック
                            conn.rollback(function() {
                              return createFailedResponse(res, result, err, conn);
                            });
                          }

                          //コミット
                          conn.commit(function(err) {

                            if (err) {

                              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                              conn.rollback(function() {
                                return createFailedResponse(res, result, err, conn);
                              });

                            }else{

                              let upd_fl_update_at = getCurrentTime();

                              conn.query('UPDATE m_friend SET latest_transaction_date = ?, update_at = ? where user_id = ? and friend_user_id = ?', [upd_fl_update_at, upd_fl_update_at, userid, sendUserId], (err, rows, fields) => {

                                if (err) {

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                                  let error = {
                                    message: PcecoinMobileConst.MESSAGE_SENDCOIN_15
                                  };

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                                  return createFailedResponse(res, result, error, conn);
                                }

                                console.log('sendCoin Success');

                                result.message = PcecoinMobileConst.MESSAGE_SENDCOIN_11

                                MysqlConnection.endConnection(conn);

                                return res
                                    .status(200)
                                    .json({ result: result });
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  getHistory: (req, res, next) => {

    let result = {};
    result.api = 'getHistory';
    result.result = true;
    result.data = {};
    let conn;

    const userid = req.user.id;

    const {currency_code, limit, offset} = req.body;

    if(!currency_code){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETHISTORY_1
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error);
    }

    if(!limit){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETHISTORY_2
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error);

    }else{

      if(!ValidateUtil.checkNumber(limit)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    if(!offset){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETHISTORY_3
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error);

    }else{

      if(!ValidateUtil.checkNumber(offset)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_6
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    let lmt = Number(limit)
    let ofst = Number(offset)

    try {

      console.log('getHistory controller start...')

      conn = MysqlConnection.getConnection();

      //自分のウォレット取得
      conn.query('SELECT * from m_wallet where user_id = ? and currency_code = ?', [userid, currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        if (rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_GETHISTORY_4
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        let walletAddress = rows[0].wallet_address;

        result.data.wallet_address = walletAddress;

        //履歴を取得
        conn.query('SELECT * FROM peace_coin.t_transaction where (`from` = ? OR `to` = ?) and currency_code = ? ORDER BY transaction_date DESC LIMIT ?, ?', [walletAddress, walletAddress, currency_code, ofst, lmt], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          result.data.history = rows;

          result.count = rows.length;

          //fromに含まれるユーザー情報を取得
          conn.query('SELECT m_wallet.user_id, m_wallet.wallet_address, user_name, user_image FROM m_wallet INNER JOIN m_profile ON m_wallet.user_id = m_profile.user_id  where wallet_address IN (SELECT distinct `from` as wallet_address FROM (select * from peace_coin.t_transaction where (`from` = ? OR `to` = ?) and currency_code = ? ORDER BY transaction_date DESC LIMIT ?, ?) T)', [walletAddress, walletAddress, currency_code, ofst, lmt], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

              return createFailedResponse(res, result, err, conn);
            }

            result.data.from = rows;

            //toに含まれるユーザー情報を取得
            conn.query('SELECT m_wallet.user_id, m_wallet.wallet_address, user_name, user_image FROM m_wallet INNER JOIN m_profile ON m_wallet.user_id = m_profile.user_id  where wallet_address IN (SELECT distinct `to` as wallet_address FROM (select * from peace_coin.t_transaction where (`from` = ? OR `to` = ?) and currency_code = ? ORDER BY transaction_date DESC LIMIT ?, ?) T)', [walletAddress, walletAddress, currency_code, ofst, lmt], (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                return createFailedResponse(res, result, err, conn);
              }

              result.data.to = rows;

              let jpNowDate = getCurrentTime();

              //read_flgを更新
              conn.query('UPDATE t_transaction SET read_flg = 1, update_at = ? where `to` = ? AND currency_code = ?', [jpNowDate, walletAddress, currency_code], (err, rows, fields) => {

                if (err){

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                  return createFailedResponse(res, result, err, conn);
                }

                MysqlConnection.endConnection(conn);

                return res
                    .status(200)
                    .json({ result: result });

              });
            });
          });
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },

  getShop: (req, res, next) => {

    let result = {};
    result.api = 'getShop';
    result.result = true;
    result.data = {};
    let conn;

    const userid = req.user.id;

    const {currency_code, limit, offset} = req.body;

    if(!limit){

      limit = "50";

    }else{

      if(!ValidateUtil.checkNumber(limit)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    if(!offset){

      offset = "0";

    }else{

      if(!ValidateUtil.checkNumber(offset)){

        let error = {
          message: PcecoinMobileConst.MESSAGE_GETHISTORY_6
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

        return createFailedResponse(res, result, error);
      }
    }

    try {

      let lmt = Number(limit)
      let ofst = Number(offset)

      console.log('getShop controller start...')

      let sql;

      conn = MysqlConnection.getConnection();

      if(!currency_code){

        conn.query('SELECT * from m_shop WHERE delete_flg = 0 ORDER BY currency_code, sort LIMIT ?, ?', [ofst, lmt], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          result.data.shop = rows;

          result.count = rows.length;

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: result });
        });

      }else{

        conn.query('SELECT * from m_shop WHERE currency_code = ? AND delete_flg = 0 ORDER BY currency_code, sort LIMIT ?, ?', [currency_code, ofst, lmt], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          result.data.shop = rows;

          result.count = rows.length;

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: result });

        });
      }

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  getManageCurrency: (req, res, next) => {

    let result = {};
    result.api = 'getManageCurrency';
    let conn;

    try {

      console.log('getManageCurrency controller start...')

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * from m_currency order by sort asc', [], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: rows });
      });

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  getManageUserList: async (req, res, next) => {

    let result = {};
    result.api = 'getManageUserList';
    let conn;

    let {offset, currency_code} = req.body;

    let ofst;

    if(offset){

      ofst = Number(offset);
    }else{

      ofst = 0;
    }

    try {

      console.log('getManageUserList controller start...')

      conn = MysqlConnection.getConnection();

      if(!currency_code){

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id ORDER BY mwt.create_at DESC LIMIT ?, 100', [ofst], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });

      }else{

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE currency_code = ? ORDER BY mwt.create_at DESC LIMIT ?, 100', [currency_code, ofst], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  getUserEmail: async (req, res, next) => {

    console.log('getUserEmail start.. ')

    let result = {};
    result.api = 'getUserEmail';

    const {user_id} = req.body;

    let user = await User.findById(user_id);
    console.log('user_id -> ' + user_id)

    if(user){

      let email = user.local.email;

      return res
          .status(200)
          .json({ email });

    }else{

      return res
          .status(200)
          .json({});

    }
  },
  getManageUserByEmail: async (req, res, next) => {

    let result = {};
    result.api = 'getManageUserByEmail';
    let conn;

    try {

      let {email, currency_code} = req.body;

      let user = await User.findOne({ 'local.email': email });

      if(!user){

        return createFailedResponse(res, result, err);
      }

      let user_id = user.id;

      console.log('getManageUserByEmail controller start...')

      conn = MysqlConnection.getConnection();

      if(!currency_code){

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE mpr.user_id = ? ', [user_id], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });

      }else{

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE currency_code = ? AND mpr.user_id = ?', [currency_code, user_id], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  getManageUserByWalletAddress: async (req, res, next) => {

    let result = {};
    result.api = 'getManageUserList';
    let conn;

    let {wallet_address, currency_code} = req.body;

    try {

      console.log('getManageUserList controller start...')

      conn = MysqlConnection.getConnection();

      if(!currency_code){

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE wallet_address = ? ', [wallet_address], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });

      }else{

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE currency_code = ? AND wallet_address = ? ', [currency_code, wallet_address], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  getManageUserByUserName: async (req, res, next) => {

    let result = {};
    result.api = 'getManageUserByUserName';
    let conn;

    let {user_name, currency_code} = req.body;

    try {

      console.log('getManageUserList controller start...')

      conn = MysqlConnection.getConnection();

      if(!currency_code){

        let likeParam = '%' + user_name + '%';

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE mpr.user_name like ? ', [likeParam], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });

      }else{

        let likeParam = '%' + user_name + '%';

        conn.query('select mwt.user_id, user_name, currency_code, wallet_address, balance, mwt.create_at FROM m_wallet mwt INNER JOIN m_profile mpr ON mwt.user_id = mpr.user_id WHERE currency_code = ? AND mpr.user_name like ? ', [currency_code, likeParam], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

            return createFailedResponse(res, result, err, conn);
          }

          MysqlConnection.endConnection(conn);

          return res
              .status(200)
              .json({ result: rows });
        });
      }

    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  manageSendCoin: (req, res, next) => {

    let result = {};
    result.api = 'manageSendCoin';
    result.result = true;
    let conn;

    const {send_wallet_address, currency_code, amount, message} = req.body;

    let {group_id} = req.body;

    try {

      //バリデーション開始
      if(!send_wallet_address){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_8
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D007;

        return createFailedResponse(res, result, error);
      }

      if(!currency_code){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_3
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_D004;

        return createFailedResponse(res, result, error);
      }

      if(!amount){

        let error = {
          message: PcecoinMobileConst.MESSAGE_SENDCOIN_5
        };

        result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P010;

        return createFailedResponse(res, result, error);

      }else{

        if(!ValidateUtil.checkNumber(amount)){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_6
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P011;

          return createFailedResponse(res, result, error);
        }

        if(amount <= 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_12
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P011;

          return createFailedResponse(res, result, error);
        }

        if(amount.length > 10){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_16
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P012;

          return createFailedResponse(res, result, error);
        }
      }

      if(message){

        if(message.length >= 500){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_9
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
          result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P013;

          return createFailedResponse(res, result, error);
        }
      }

      if(group_id){

        if(group_id.length != 50){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_14
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error);
        }
      }else{

        group_id = null;
      }

      //バリデーション終了

      console.log('sendCoin controller start...')

      conn = MysqlConnection.getConnection();

      //送金先のウォレット情報取得
      conn.query('SELECT DISTINCT user_id FROM m_wallet WHERE wallet_address = ?', [send_wallet_address], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        if(rows.length == 0){

          let error = {
            message: PcecoinMobileConst.MESSAGE_SENDCOIN_4
          };

          result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

          return createFailedResponse(res, result, error, conn);
        }

        var sendUserId = rows[0].user_id;
        var myWalletAddress;

        console.log('currency_code -> ' + currency_code)

        //自分のウォレットを取得
        conn.query('SELECT * FROM m_wallet_mgt WHERE currency_code = ?', [currency_code], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          //自分の情報チェック（スマホ側でウォレット作成APIを実施してない）
          if(rows.length == 0){

            let error = {
              message: PcecoinMobileConst.MESSAGE_SENDCOIN_12
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
            return createFailedResponse(res, result, error, conn);
          }

          var balance = rows[0].balance;
          myWalletAddress = rows[0].wallet_address;
          var userid = rows[0].user_id;

          //残高チェック
          if(balance < amount){

            let error = {
              message: PcecoinMobileConst.MESSAGE_SENDCOIN_1
            };

            result.error_code = PcecoinMobileConst.ERROR_CODE_0001;
            return createFailedResponse(res, result, error, conn);
          }

          conn.query('SELECT * FROM t_transaction WHERE `from` = ? AND `to` = ? AND currency_code = ? ORDER BY transaction_date DESC', [myWalletAddress, send_wallet_address, currency_code], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            //ウォレット残高の更新とトランザクションの挿入、その後相手ウォレットへの反映
            conn.beginTransaction(function(err) {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              let ins_transaction_id = HashUtil.createTransactionAddressHash();
              let ins_currency_code = currency_code;
              let ins_from = myWalletAddress;
              let ins_to = send_wallet_address;
              let ins_amount = amount;
              let ins_message = message;
              let ins_transaction_date = getCurrentTime();
              let ins_status = 1;

              let jpNowDate = getCurrentTime();

              //トランザクションの挿入
              conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, message, transaction_date, status, group_id, create_at, update_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ins_transaction_id, ins_currency_code, ins_from, ins_to, ins_amount, ins_message, ins_transaction_date, ins_status, group_id, jpNowDate, jpNowDate], (err, rows, fields) => {

                if (err) {

                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                  //ロールバック
                  conn.rollback(function() {
                    return createFailedResponse(res, result, err, conn);
                  });
                }

                let upd_balance = balance - amount;
                let upd_update_at = getCurrentTime();

                //自分の残高を減額
                conn.query('UPDATE m_wallet_mgt SET balance = ?, update_at = ? where wallet_address = ? and currency_code = ?', [upd_balance, upd_update_at, myWalletAddress, currency_code], (err, rows, fields) => {

                  if (err){

                    result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                    //ロールバック
                    conn.rollback(function() {
                      return createFailedResponse(res, result, err, conn);
                    });
                  }

                  //相手先の通貨コード指定のウォレット残高を取得
                  conn.query('SELECT * FROM m_wallet WHERE wallet_address = ? and currency_code = ?', [send_wallet_address, currency_code], (err, rows, fields) => {

                    if (err){

                      result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                      //ロールバック
                      conn.rollback(function() {
                        return createFailedResponse(res, result, err, conn);
                      });
                    }

                    console.log('rows -> ')
                    console.log(rows)

                    //取得結果0件の場合は、新たに作成する
                    if(rows.length == 0){

                      let ins_wa_send_user_id = sendUserId;
                      let ins_wa_send_wallet_address = send_wallet_address;
                      let ins_wa_currency_code = currency_code;
                      let ins_wa_balance = Number(amount);

                      conn.query('INSERT INTO m_wallet (user_id, wallet_address, currency_code, balance, create_at, update_at) values(?, ?, ?, ?, ?, ?)', [ins_wa_send_user_id, ins_wa_send_wallet_address, ins_wa_currency_code, ins_wa_balance, jpNowDate, jpNowDate], (err, rows, fields) => {

                        if (err){

                          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                          //ロールバック
                          conn.rollback(function() {
                            return createFailedResponse(res, result, err, conn);
                          });

                        }else{

                          result.count = rows.affectedRows;

                          if(rows.affectedRows != 1){

                            //ロールバック
                            conn.rollback(function() {
                              return createFailedResponse(res, result, err, conn);
                            });
                          }

                          //コミット
                          conn.commit(function(err) {

                            if (err) {

                              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                              conn.rollback(function() {
                                return createFailedResponse(res, result, err, conn);
                              });

                            }else{

                              let upd_fl_update_at = getCurrentTime();

                              conn.query('UPDATE m_friend SET latest_transaction_date = ?, update_at = ? where user_id = ? and friend_user_id = ?', [upd_fl_update_at, upd_fl_update_at, userid, sendUserId], (err, rows, fields) => {

                                if (err) {

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                                  let error = {
                                    message: PcecoinMobileConst.MESSAGE_SENDCOIN_15
                                  };

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                                  return createFailedResponse(res, result, error, conn);
                                }

                                console.log('sendCoin Success');

                                result.message = PcecoinMobileConst.MESSAGE_SENDCOIN_11

                                MysqlConnection.endConnection(conn);

                                return res
                                    .status(200)
                                    .json({ result: result });
                              });
                            }
                          });
                        }
                      });

                    }else{

                      let oldSendBalance = rows[0].balance;

                      let upd_wa_balance = Number(oldSendBalance) + Number(amount);
                      let upd_wa_update_at = getCurrentTime();
                      let upd_wa_user_id = sendUserId;
                      let upd_wa_wallet_address = send_wallet_address;
                      let upd_wa_currency_code = currency_code;

                      console.log('upd_wa_balance -> ' + upd_wa_balance)
                      console.log('upd_wa_update_at -> ' + upd_wa_update_at)
                      console.log('upd_wa_user_id -> ' + upd_wa_user_id)
                      console.log('upd_wa_wallet_address -> ' + upd_wa_wallet_address)
                      console.log('upd_wa_currency_code -> ' + upd_wa_currency_code)

                      //相手先の残高更新
                      conn.query('UPDATE m_wallet SET balance = ?, update_at = ? where user_id = ? and wallet_address = ? and currency_code = ?', [upd_wa_balance, upd_wa_update_at, upd_wa_user_id, upd_wa_wallet_address, upd_wa_currency_code], (err, rows, fields) => {

                        if (err){

                          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                          //ロールバック
                          conn.rollback(function() {

                            console.log('roll back ')

                            return createFailedResponse(res, result, err, conn);
                          });

                        }else{

                          result.count = rows.changedRows;

                          if(rows.changedRows != 1){

                            result.result = false;

                            //ロールバック
                            conn.rollback(function() {
                              return createFailedResponse(res, result, err, conn);
                            });
                          }

                          //コミット
                          conn.commit(function(err) {

                            if (err) {

                              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                              conn.rollback(function() {
                                return createFailedResponse(res, result, err, conn);
                              });

                            }else{

                              let upd_fl_update_at = getCurrentTime();

                              conn.query('UPDATE m_friend SET latest_transaction_date = ?, update_at = ? where user_id = ? and friend_user_id = ?', [upd_fl_update_at, upd_fl_update_at, userid, sendUserId], (err, rows, fields) => {

                                if (err) {

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

                                  let error = {
                                    message: PcecoinMobileConst.MESSAGE_SENDCOIN_15
                                  };

                                  result.error_code = PcecoinMobileConst.ERROR_CODE_0001;

                                  return createFailedResponse(res, result, error, conn);
                                }

                                console.log('sendCoin Success');

                                result.message = PcecoinMobileConst.MESSAGE_SENDCOIN_11

                                MysqlConnection.endConnection(conn);

                                return res
                                    .status(200)
                                    .json({ result: result });
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  getManageHistory: (req, res, next) => {

    let result = {};
    result.api = 'getManageHistory';
    result.result = true;
    result.data = {};
    let conn;

    const {currency_code, wallet_address} = req.body;

    if(!currency_code){

      let error = {
        message: PcecoinMobileConst.MESSAGE_GETHISTORY_1
      };

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;

      return createFailedResponse(res, result, error);
    }

    try {

      console.log('getManageHistory controller start...')

      conn = MysqlConnection.getConnection();


      //履歴を取得
      conn.query('SELECT * FROM peace_coin.t_transaction where (`from` = ? OR `to` = ?) and currency_code = ? ORDER BY transaction_date DESC', [wallet_address, wallet_address, currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;

          return createFailedResponse(res, result, err, conn);
        }

        MysqlConnection.endConnection(conn);

        return res
            .status(200)
            .json({ result: rows });
      });

    }catch(err){

      return createFailedResponse(res, result, err);

    }
  },
  //1-100で12増加
  easyGameReflection100: (req, res, next) => {

    let result = {};
    result.api = 'easyGameReflection100';
    result.result = true;
    let conn;

    const {fromDate, toDate, currency_code} = req.body;

    console.log('easyGameReflection100 start.. ')
    console.log('fromDate -> ' + fromDate)
    console.log('toDate -> ' + toDate)
    console.log('currency_code -> ' + currency_code)

    try {

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * FROM m_wallet_mgt WHERE currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        var mngWalletAddress = rows[0].wallet_address;

        //0 <= 100 までの送金者のbalanceを送金回数 * 12 増加
        conn.query('UPDATE m_wallet, (select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 0 and amount <= 100 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code) T SET balance = balance + (count * 12) WHERE m_wallet.wallet_address = T.wallet_address and m_wallet.currency_code = T.currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          console.log('0 <= 100 rows.changedRows -> ' + rows.changedRows)

          if(rows.changedRows == 0){

            result.count = 0;

            return res
                .status(200)
                .json({ result: result });
          }

          //上記の増加対象者を取得
          conn.query('select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 0 and amount <= 100 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            let insertValuesBindSet = '';
            var insertValuesBindParam = [];

            let jpNowDate = getCurrentTime();

            for(let i = 0; i < rows.length; i++) {

              if(mngWalletAddress != rows[i].wallet_address){

                if(insertValuesBindSet.length == 0){

                  insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?, ?, ?, ?)';

                }else{

                  insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?, ?, ?, ?)';
                }

                console.log(rows[i].wallet_address + ' -> ' + (rows[i].count * 12) + ' ' + currency_code)

                insertValuesBindParam.push(HashUtil.createTransactionAddressHash());
                insertValuesBindParam.push(currency_code);
                insertValuesBindParam.push(mngWalletAddress);
                insertValuesBindParam.push(rows[i].wallet_address);
                insertValuesBindParam.push(rows[i].count * 12);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
              }
            }

            conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, transaction_date, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              result.count = rows.affectedRows;

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });
            });
          });
        });
      });
    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  //100-1000で50増加
  easyGameReflection1000: (req, res, next) => {

    let result = {};
    result.api = 'easyGameReflection1000';
    result.result = true;
    let conn;

    const {fromDate, toDate, currency_code} = req.body;

    console.log('easyGameReflection1000 start.. ')
    console.log('fromDate -> ' + fromDate)
    console.log('toDate -> ' + toDate)
    console.log('currency_code -> ' + currency_code)

    try {

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * FROM m_wallet_mgt WHERE currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        var mngWalletAddress = rows[0].wallet_address;

        //100 <= 1000 までの送金者のbalanceを送金回数 * 50 増加 (100は含まず)
        conn.query('UPDATE m_wallet, (select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 100 and amount <= 1000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code) T SET balance = balance + (count * 50) WHERE m_wallet.wallet_address = T.wallet_address and m_wallet.currency_code = T.currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          console.log('100 <= 1000 rows.changedRows -> ' + rows.changedRows)

          if(rows.changedRows == 0){

            result.count = 0;

            return res
                .status(200)
                .json({ result: result });
          }

          //上記の増加対象者を取得
          conn.query('select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 100 and amount <= 1000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            let insertValuesBindSet = '';
            var insertValuesBindParam = [];

            let jpNowDate = getCurrentTime();

            for(let i = 0; i < rows.length; i++) {

              if(mngWalletAddress != rows[i].wallet_address){

                if(insertValuesBindSet.length == 0){

                  insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?, ?, ?, ?)';

                }else{

                  insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?, ?, ?, ?)';
                }

                console.log(rows[i].wallet_address + ' -> ' + (rows[i].count * 50) + ' ' + currency_code)

                insertValuesBindParam.push(HashUtil.createTransactionAddressHash());
                insertValuesBindParam.push(currency_code);
                insertValuesBindParam.push(mngWalletAddress);
                insertValuesBindParam.push(rows[i].wallet_address);
                insertValuesBindParam.push(rows[i].count * 50);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
              }
            }

            conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, transaction_date, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              result.count = rows.affectedRows;

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });
            });
          });
        });
      });
    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  //1000-10000で300増加
  easyGameReflection10000: (req, res, next) => {

    let result = {};
    result.api = 'easyGameReflection10000';
    result.result = true;
    let conn;

    const {fromDate, toDate, currency_code} = req.body;

    console.log('easyGameReflection10000 start.. ')
    console.log('fromDate -> ' + fromDate)
    console.log('toDate -> ' + toDate)
    console.log('currency_code -> ' + currency_code)

    try {

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * FROM m_wallet_mgt WHERE currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        var mngWalletAddress = rows[0].wallet_address;

        //1000 <= 10000 までの送金者のbalanceを送金回数 * 300 増加 (1000は含まず)
        conn.query('UPDATE m_wallet, (select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 1000 and amount <= 10000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code) T SET balance = balance + (count * 300) WHERE m_wallet.wallet_address = T.wallet_address and m_wallet.currency_code = T.currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          console.log('1000 <= 10000 rows.changedRows -> ' + rows.changedRows)

          if(rows.changedRows == 0){

            result.count = 0;

            return res
                .status(200)
                .json({ result: result });
          }

          //上記の増加対象者を取得
          conn.query('select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 1000 and amount <= 10000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            let insertValuesBindSet = '';
            var insertValuesBindParam = [];

            let jpNowDate = getCurrentTime();

            for(let i = 0; i < rows.length; i++) {

              if(mngWalletAddress != rows[i].wallet_address){

                if(insertValuesBindSet.length == 0){

                  insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?, ?, ?, ?)';

                }else{

                  insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?, ?, ?, ?)';
                }

                console.log(rows[i].wallet_address + ' -> ' + (rows[i].count * 300) + ' ' + currency_code)

                insertValuesBindParam.push(HashUtil.createTransactionAddressHash());
                insertValuesBindParam.push(currency_code);
                insertValuesBindParam.push(mngWalletAddress);
                insertValuesBindParam.push(rows[i].wallet_address);
                insertValuesBindParam.push(rows[i].count * 300);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
              }
            }

            conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, transaction_date, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              result.count = rows.affectedRows;

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });
            });
          });
        });
      });
    }catch(err){

      return createFailedResponse(res, result, err);
    }
  },
  //10000-で1500増加
  easyGameReflectionMax: (req, res, next) => {

    let result = {};
    result.api = 'easyGameReflectionMax';
    result.result = true;
    let conn;

    const {fromDate, toDate, currency_code} = req.body;

    console.log('easyGameReflectionMax start.. ')
    console.log('fromDate -> ' + fromDate)
    console.log('toDate -> ' + toDate)
    console.log('currency_code -> ' + currency_code)

    try {

      conn = MysqlConnection.getConnection();

      conn.query('SELECT * FROM m_wallet_mgt WHERE currency_code = ?', [currency_code], (err, rows, fields) => {

        if (err){

          result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
          return createFailedResponse(res, result, err, conn);
        }

        var mngWalletAddress = rows[0].wallet_address;

        //10000 <= 上限なし までの送金者のbalanceを送金回数 * 1500 増加 (10000は含まず)
        conn.query('UPDATE m_wallet, (select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 10000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code) T SET balance = balance + (count * 1500) WHERE m_wallet.wallet_address = T.wallet_address and m_wallet.currency_code = T.currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

          if (err){

            result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
            return createFailedResponse(res, result, err, conn);
          }

          console.log('10000 < rows.changedRows -> ' + rows.changedRows)

          if(rows.changedRows == 0){

            result.count = 0;

            return res
                .status(200)
                .json({ result: result });
          }

          //上記の増加対象者を取得
          conn.query('select count(*) AS count, `from` AS wallet_address, currency_code from t_transaction where amount > 10000 and currency_code = ? and transaction_date BETWEEN ? AND ? group by `from`, currency_code', [currency_code, fromDate, toDate], (err, rows, fields) => {

            if (err){

              result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
              return createFailedResponse(res, result, err, conn);
            }

            let insertValuesBindSet = '';
            var insertValuesBindParam = [];

            let jpNowDate = getCurrentTime();

            for(let i = 0; i < rows.length; i++) {

              if(mngWalletAddress != rows[i].wallet_address){

                if(insertValuesBindSet.length == 0){

                  insertValuesBindSet = insertValuesBindSet + '(?, ?, ?, ?, ?, ?, ?, ?)';

                }else{

                  insertValuesBindSet = insertValuesBindSet + ', (?, ?, ?, ?, ?, ?, ?, ?)';
                }

                console.log(rows[i].wallet_address + ' -> ' + (rows[i].count * 1500) + ' ' + currency_code)

                insertValuesBindParam.push(HashUtil.createTransactionAddressHash());
                insertValuesBindParam.push(currency_code);
                insertValuesBindParam.push(mngWalletAddress);
                insertValuesBindParam.push(rows[i].wallet_address);
                insertValuesBindParam.push(rows[i].count * 1500);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
                insertValuesBindParam.push(jpNowDate);
              }
            }

            conn.query('INSERT INTO t_transaction (transaction_id, currency_code, `from`, `to`, amount, transaction_date, create_at, update_at) values' + insertValuesBindSet, insertValuesBindParam, (err, rows, fields) => {

              if (err){

                result.error_code = PcecoinMobileConst.ERROR_CODE_9999;
                return createFailedResponse(res, result, err, conn);
              }

              result.count = rows.affectedRows;

              MysqlConnection.endConnection(conn);

              return res
                  .status(200)
                  .json({ result: result });
            });
          });
        });
      });
    }catch(err){

      return createFailedResponse(res, result, err);
    }
  }
};
