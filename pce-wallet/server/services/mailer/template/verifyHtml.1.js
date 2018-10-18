const { HOME_URL } = require('../../../config/keys');

module.exports = verifyHtml => {
  return `
  <html>
    <body>
      <p>Hello</p>
      <p>Thankyou for registeration!</p>
      <p>Please verifty your email cliking following url:</p>
      ${HOME_URL}/verify/${verifyHtml.local.secretToken}
      <br />
    </body>
  </html>
  `;
};
