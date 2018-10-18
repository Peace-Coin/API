const Joi = require('joi');
const helper = require('./helper');

module.exports = {
  validateProfile: schema => {
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

  profileSchema: {
    profileCheck: Joi.object().keys({
      firstName: Joi.string()
        .max(50)
        .required()
        .regex(/^[a-zA-Z0-9./=-]*$/)
        .label('First Name')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [./=-]'
              }
            }
          }
        }),
      lastName: Joi.string()
        .max(50)
        .required()
        .regex(/^[a-zA-Z0-9./=-]*$/)
        .label('Last Name')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [./=-]'
              }
            }
          }
        }),
      gender: Joi.string()
        .max(50)
        .required()
        .regex(/^[a-zA-Z0-9./=-]*$/)
        .label('Gender')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [[./=-]'
              }
            }
          }
        }),
      phoneNumber1: Joi.string()
        .max(5)
        .required()
        .regex(/^[0-9+]*$/)
        .label('Phone Number (country)')
        .options({
          language: {
            string: {
              max: 'less than 5 char',
              regex: {
                base: 'fails to match the required pattern: half-width number and [+]'
              }
            }
          }
        }),
      phoneNumber2: Joi.string()
        .max(15)
        .required()
        .regex(/^[0-9-]*$/)
        .label('Phone Number')
        .options({
          language: {
            string: {
              max: 'less than 15 char',
              regex: {
                base: 'fails to match the required pattern: half-width number and [-]'
              }
            }
          }
        }),
      streetAddress: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9.,/=-\s　]*$/)
        .max(50)
        .label('Street Address')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [.,/=-]'
              }
            }
          }
        }),
      cityAddress: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9.,/=-\s　]*$/)
        .max(50)
        .label('City')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [.,/=-]'
              }
            }
          }
        }),
      postalCode: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9./=-]*$/)
        .max(50)
        .label('Postal Code')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [./=-]'
              }
            }
          }
        }),
      nationality: Joi.string()
        .required()
        .label('Nationality')
        .max(50)
        .options({
          language: {
            string: {
              max: 'less than 50 char',
            }
          }
        }),
      idNumber: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9./=-]*$/)
        .max(50)
        .label('ID Number')
        .options({
          language: {
            string: {
              max: 'less than 50 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number and [./=-]'
              }
            }
          }
        }),
      birth: Joi.string()
        .required()
        .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(\d{4})$/)
        .label('Birthday')
        .options({
          language: {
            string: {
              regex: {
                base: 'fails to match the required pattern: MM-DD-YYYY',
              },
            },
          }
        }),
      country: Joi.string()
        .required()
        .label('Country')
        .max(50)
        .options({
          language: {
            string: {
              max: 'less than 50 char',
            }
          }
        }),
      passport: Joi.string()
        .required()
        .max(5000000)
        .label('Photo ID document')
        .options({
          language: {
            string: {
              max: 'less than 3MB byte size'
            }
          }
        }),
      certificateResidence: Joi.string()
        .required()
        .max(5000000)
        .label('Address proof image')
        .options({
          language: {
            string: {
              max: 'less than 3MB byte size'
            }
          }
        }),
      picture: Joi.string()
        .required()
        .max(5000000)
        .label('Selfy image')
        .options({
          language: {
            string: {
              max: 'less than 3MB byte size'
            }
          }
        }),
      ethereumAddress: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9]*$/)
        .max(250)
        .label('ERC20 Address')
        .options({
          language: {
            string: {
              max: 'less than 250 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number'
              }
            },
          }
        }),
        bitcoinAddress: Joi.string()
          .allow('')
          .max(250)
          .regex(/^[a-zA-Z0-9]*$/)
          .label('BITCOIN Address')
          .options({
            language: {
              string: {
                max: 'less than 250 char',
                regex: {
                  base: 'fails to match the required pattern: half-width alphanumeric and number'
                }
              },
            }
          }),
      aml: Joi.boolean()
        .valid(true)
        .required()
        .label('AML(anti-money laundering)?')
        .options({
          language: {
            any: {
              allowOnly: 'must be Checked',
            }
          }
        }),
    }),
    changeEthreumAddressCheck: Joi.object().keys({
      ethereumAddress: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9]*$/)
        .max(250)
        .label('Ethereum Address')
        .options({
          language: {
            string: {
              max: 'less than 250 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number'
              }
            },
          }
        }),
    }),
    changeBitcoinAddressCheck: Joi.object().keys({
      bitcoinAddress: Joi.string()
        .required()
        .regex(/^[a-zA-Z0-9]*$/)
        .max(250)
        .label('Bitcoin Address')
        .options({
          language: {
            string: {
              max: 'less than 250 char',
              regex: {
                base: 'fails to match the required pattern: half-width alphanumeric and number'
              }
            },
          }
        }),
    }),
  }
};
