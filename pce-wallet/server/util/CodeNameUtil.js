module.exports = {

  getProfileStatus: profile => {
    
    if (profile.Profile.status === '1') {
      //確認中
      profile.Profile.statusName = 'We have been under confirmation';
    } else if (profile.Profile.status === '2') {
      //承認済
      profile.Profile.statusName = 'approved';
    } else if (profile.Profile.status === '3') {
      //パスポート画像不備
      profile.Profile.statusName = 'passport image is incomplete';
    } else if (profile.Profile.status === '4') {
      //住民票画像不備
      profile.Profile.statusName =
        'Certificate of Residence image is incomplete';
    } else if (profile.Profile.status === '5') {
      //自画像不備
      profile.Profile.statusName = 'picture image is incomplete';
    } else if (profile.Profile.status === '6') {
      //イーサリアムアドレス不備
      profile.Profile.statusName = 'EthereumAddress is incomplete';
    } else {
      //その他
      profile.Profile.statusName = 'systemError';
    }

    return profile;
  }
};
