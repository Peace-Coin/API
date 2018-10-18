module.exports = verifyHtml => {

  var conf;

  if (process.env.NODE_ENV === 'production') {

    conf = require('../../../config/prodconf.json');

  }else{

    conf = require('../../../config/devconf.json');
  }

  let url = conf.VERIFY_PASSWORD_URL + verifyHtml.local.secretToken;

  let fbPngImage = conf.DOMAIN_URL + 'fb.png';
  let ghPngImage = conf.DOMAIN_URL + 'gh.png';
  let logoPngImage = conf.DOMAIN_URL + 'logo.png';
  let tgPngImage = conf.DOMAIN_URL + 'tg.png';
  let twPngImage = conf.DOMAIN_URL + 'tw.png';

  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd" />
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Language" content="ja" />
      <meta http-equiv="Content-Type" content="text/html;charset=UTF8" />
      <meta name="viewport" content="initial-scale=1.0,width=device-width" />
      <title>[タイトル]</title>
  <style type="text/css">
    * {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      -o-box-sizing: border-box;
      -ms-box-sizing: border-box;
       box-sizing: border-box;
       word-wrap: break-word;
       overflow-wrap:break-word;
       color: #333333;
       font-weight: 400;
       letter-spacing: .08em;
       line-height: 1.6;
       font-family: Hiragino Kaku Gothic ProN,Yu Gothic,YuGothic,メイリオ,meiryo,sans-serif;
  }

    body{
      width: 100% !important;
      min-width: 100%;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
      background:#f2f2f2;
    }
    table {
      width:100%;
      border:none;
      margin:0;
    }
    td {
      width:100%;
      border:none;
      margin:0;
    }
    @media only screen and (max-width: 680px) {
    }
  </style>
    </head>
  <body class="res" width="100%" bgcolor="#f2f2f2" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-left:auto;margin-right:auto;max-width:720px;">
        <tr>
          <td width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:10px;">
      <!-- コンテンツここから -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td width="100%" bgcolor="#fff" border="0" cellpadding="0" cellspacing="0" style="background:#fff;padding:30px;padding-top:60px;padding-bottom:50px">

                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="100%" border="0" cellpadding="0" cellspacing="0" align="left" style="text-align:center;">
              <img src=${logoPngImage} width="180" alt="Peace Coin ICO logo"/>
                      </td>
                    </tr>
                    <tr>
                      <td width="100%" border="0" cellpadding="0" cellspacing="0" align="left" style="text-align:center;padding-top:20px;padding-bottom:10px;">
                        <font color="#00adbf" size="3" style="font-size:1.3rem;font-weight:600;color:#00adbf;">
                          ARIGATO!!!
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align:center;padding-top:0px;padding-bottom:40px;border-bottom:1px solid #f2f2f2;color:#acacac;">Thank you for registering on our platform!</td>
                    </tr>
                    <tr>
                      <td width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;text-align:left;">
                      Dear Member,<br/>
                      You can change this password in your back office.<br/>
                      Please activate your account by clicking on the activation link below.
                      </td>
                    </tr>
                    <tr>
                      <td width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align:center;font-size:110%;padding-top:40px;padding-bottom:20px;font-weight:700">
                      Your activation link</td>
                    </tr>
                    <tr>
                      <td width="100%" bgcolor="#ebf5f5" border="0" cellpadding="0" cellspacing="0" style="text-align:left;backgound:#ebf5f5; padding:20px;">
                      <a color="#00adbf" style="color:#00adbf;margin:0;word-break: break-all;" href=${url}>
                      ${
                        url
                      }
                      </a>
                      </td>
                    </tr>
                  </table>

          </td>
        </tr>
        <tr>
          <td width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:50px;padding-bottom:25px;text-align:center;">
                      <img src=${twPngImage} width="40" style="margin-right:20px;" alt="tw" />
                      <img src=${fbPngImage} width="21" style="margin-right:20px;" alt="fb" />
                      <img src=${ghPngImage} width="40" style="margin-right:20px;" alt="gh" />
                      <img src=${tgPngImage} width="40" alt="tg" />
          </td>
        </tr>
        <tr>
          <td width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align:center;color:#acacac;padding-bottom:30px;font-size:90%;font-weight:400;">
          Narva mnt 5, Tallinn.<br/>
          Harjumma, 10117, ESTONIA<br/>
          ©︎&nbsp;2018&nbsp;by&nbsp;PEACE&nbsp;COIN&nbsp;OÜ
          </td>
        </tr>
      </table>

          </td>
        </tr>
      </table>
      <!-- コンテンツここまで -->

  </body>
  </html>
  `;
};
