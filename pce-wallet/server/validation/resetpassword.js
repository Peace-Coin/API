const Joi = require('joi');
const helper = require('./helper');

module.exports = {
  validateResetPassword: schema => {
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

  resetPasswordSchema: {
    authSchema: Joi.object().keys({
      email: Joi.string()
        .email()
        .label('Email')
        .required()
    })
  }
};

// password: Joi.string().regex(/^\S+$/, 'firstName').regex(/[A-Z]+/, 'secondName').regex(/\d+/, 'thirdName').required().options({
//   language: {
//     string: {
//       regex: {
//         base: 'base',
//         firstName: 'first',
//         secondName: 'second',
//         thirdName: 'third'
//       }
//     }
//   }
// })
