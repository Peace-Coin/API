function isRequired(field){

  console.log('field -> ' + field)

  if(field == undefined || field == null){

    return false;
  }

  //数値の0は許容
  if(!field){

    return false;
  }

  return true;
};

function isMailAddress(email){

  //var regexp = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9]{1,}$/;
  //var regexp = /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$/;

  return true;

  // if (regexp.test(email)) {
  //
  //   return true;
  //
  // } else {
  //
  //   return false;
  // }
}

function isHalfAlphabet(field, markPermissionFlg){

  let result = true;

  if(!field){

    return result;
  }

  if(markPermissionFlg){

    if(!field.match(/^[a-zA-Z-=.,/]+$/)){

      result = false;
    }

  }else{

    if(!field.match(/^[a-zA-Z]+$/)){

      result = false;
    }
  }

  return result;
};

function isHalfAlphanumeric(field, markPermissionFlg){

  console.log('isHalfAlphanumeric start...')
  //console.log('field -> ' + field)
  console.log('markPermissionFlg -> ' + markPermissionFlg)

  let result = true;

  if(!field){

    return result;
  }

  if(markPermissionFlg){

    if(!field.match(/^[a-zA-Z0-9-=.,/]+$/)){

      result = false;
    }

  }else{

    if(!field.match(/^[a-zA-Z0-9]+$/)){

      result = false;
    }
  }

  return result;
};

function isHalfNumber(field, markPermissionFlg){

  let result = true;

  if(!field){

    return result;
  }

  if(markPermissionFlg){

    if(!field.match(/^[0-9-+.,/]+$/)){

      result = false;
    }

  }else{

    if(!field.match(/^[0-9]+$/)){

      result = false;
    }
  }

  return result;
};

function maxLength(field, length){


  console.log('maxLength start...')
  //console.log('field -> ' + field)
  console.log('length -> ' + length)

  let result = true;

  if(!field){

    return result;
  }

  if(field.length > length){

    result = false;
  }

  console.log('maxLength end...')

  return result;
};

function minLength(field, length){

  let result = true;

  if(!field){

    return result;
  }

  if(field.length < length + 1){

    result = false;
  }

  return result;
};

const PcecoinMobileConst = require('./PcecoinMobileConst');

module.exports = {

  //モバイルプロフィール登録チェック
  checkMobileProfile: profile => {

    let result = {};
    let error = {};

    //必須チェック
    if(!isRequired(profile.user_name)){

      if(!result.error_param_code){

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P001;
      }

      if(!error.user_name){

        error.user_name =  PcecoinMobileConst.LABEL_USER_NAME + PcecoinMobileConst.ERROR_MESSAGE_REQUIRED;
      }
    }

    // //形式チェック
    // if(!isHalfAlphanumeric(profile.user_name, true)){
    //
    //   if(!error.user_name){
    //
    //     error.user_name = PcecoinMobileConst.LABEL_USER_NAME + PcecoinMobileConst.ERROR_MESSAGE_HALF_ALPHANUMERIC_MARK;
    //   }
    // }
    //
    // if(!isHalfAlphanumeric(profile.user_introduction, true)){
    //
    //   if(!error.user_introduction){
    //
    //     error.user_introduction =  PcecoinMobileConst.LABEL_USER_INTRODUCTION + PcecoinMobileConst.ERROR_MESSAGE_HALF_ALPHANUMERIC_MARK;
    //   }
    // }

    //桁数チェック
    if(!maxLength(profile.user_name, 45)){

      if(!result.error_param_code){

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P002;
      }

      if(!error.user_name){

        error.user_name =  PcecoinMobileConst.LABEL_USER_NAME + PcecoinMobileConst.ERROR_MESSAGE_MAX_LENGTH.replace("?", 45);
      }
    }

    if(!maxLength(profile.user_introduction, 500)){

      if(!result.error_param_code){

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P003;
      }

      if(!error.user_introduction){

        error.user_introduction = PcecoinMobileConst.LABEL_USER_INTRODUCTION + PcecoinMobileConst.ERROR_MESSAGE_MAX_LENGTH.replace("?", 500);
      }
    }

    //画像サイズチェック
    if(!maxLength(profile.user_image, 14000000)){

      if(!result.error_param_code){

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P004;
      }

      if(!error.user_image){

        error.user_image = PcecoinMobileConst.LABEL_USER_IMAGE + PcecoinMobileConst.ERROR_MESSAGE_MAX_BYTE_LENGTH.replace("?", 10);
      }
    }

    if(!maxLength(profile.background_image, 14000000)){

      if(!result.error_param_code){

        result.error_param_code = PcecoinMobileConst.ERROR_PARAM_CODE_P014;
      }

      if(!error.background_image){

        error.background_image = PcecoinMobileConst.LABEL_BACKGROUND_IMAGE + PcecoinMobileConst.ERROR_MESSAGE_MAX_BYTE_LENGTH.replace("?", 10);
      }
    }

    console.log('checkMobileProfile error -> ')
    console.log(error)

    if(Object.keys(error).length === 0){

      result.result = true;

    }else{

      result.result = false;
      result.error = error;

      result.error_code = PcecoinMobileConst.ERROR_CODE_0000;
    }

    return result;
  }
  ,
  checkNumber: value => {

    return isHalfNumber(value, false);
  }
  ,
  checkEmail: value => {

    return isMailAddress(value);
  }
  ,
  maxLength: (value, number) => {

    return maxLength(value, number);
  }
};
