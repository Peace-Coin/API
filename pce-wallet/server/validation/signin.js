const Joi = require('joi');
const helper = require('./helper');

module.exports = {
  validateSignin: schema => {
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

  signinSchema: {
    authSchema: Joi.object().keys({
      email: Joi.string()
        //.email()
        .label('email')
        .required(),
      password: Joi.string()
        // .regex(
        //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!-/:-@[-`{-~])[!-~]{8,48}/
        // )
        .regex(/^[a-zA-Z0-9!"\#$%&@()*+,-./_]*$/)
        .label('password')
        .max(48)
        .min(8)
        .required()
        .options({
          language: {
            string: {
              max: 'less than 48 char',
              min: 'more than 8 char',
              regex: {
                base:
                  'fails to match the required pattern: half-width alphanumeric and number and [!"#$%&@()*+,-./_]'
              }
            }
          }
        })
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
