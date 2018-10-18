const Joi = require('joi');
const helper = require('./helper');

module.exports = {
  validateSignup: schema => {
    return (req, res, next) => {
      const result = Joi.validate(req.body, schema, {
        abortEarly: false
      });

      if (result.error) {
        const validation = helper.validationErrorMessage(result.error.details);
        return res.status(400).json({
          validation: validation
        });
      }

      if (!req.value) {
        req.value = {};
      }
      req.value['body'] = result.value;
      next();
    };
  },

  // Password using Regular Expression
  // ^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!-/:-@[-`{-~])[!-~]{8,48}
  // More than 8 char and less than 48 char
  // At least more than one Lowercase Alphabet
  // At least more than one Uppercase Alphabet
  // Alphabet and Numbers
  // At least more than one Symbols such as　!"#$%&'()*+,-./:;<=>?@[]^_`{|}~）
  signupSchema: {
    authSchema: Joi.object().keys({
      email: Joi.string()
        .email()
        .label('email')
        .required(),
      password: Joi.string()
      .required()
      .regex(/^[a-zA-Z0-9!"\#$%&@()*+,-./_]*$/)
      .max(48)
      .min(8)
      .label('password')
      .options({
        language: {
          string: {
            max: 'less than 48 char',
            min: 'more than 8 char',
            regex: {
              base: 'fails to match the required pattern: half-width alphanumeric and number and [!"\#$%&@()*+,-./_]'
            }
          },
        }
      }),
    })
  }
};
