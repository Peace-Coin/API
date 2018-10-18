const PcecoinMobileConst = require('../util/PcecoinMobileConst');
const HashUtil = require('./HashUtil');

module.exports = {

  saveImage: (saveName, imageUrl) => {

    return new Promise(resolve => {

      console.log('saveImage start...')

      if(!imageUrl){

        console.log('imageUrl empty')
        console.log('saveImage failed end...')
        resolve();
      }

      //console.log('imageUrl ==> ')
      //console.log(imageUrl)

      const fileData = imageUrl.replace(/^data:\w+\/\w+;base64,/, '');
      const decodedFile = new Buffer(fileData, 'base64');

      //const decodedFile = new Buffer(imageUrl, 'base64');

      const fileExtension = imageUrl.toString().slice(imageUrl.indexOf('/') + 1, imageUrl.indexOf(';'));

      let hash = HashUtil.createImageUrlHash();

      let path = PcecoinMobileConst.SAVE_DIR + saveName + hash + '.' + fileExtension;
      let url = PcecoinMobileConst.SAVE_URL + saveName + hash + '.' + fileExtension;

      console.log('dir -> ' + path)
      console.log('url -> ' + url)

      var fs = require('fs');
      
      fs.writeFile(path, decodedFile, function (err) {
        if (err) {

          console.log('saveImage failed end...')
          resolve();

        }else{

          console.log('saveImage success end...')
          resolve(url);
        }
      });

      // "use strict";
      // const sharp = require("sharp");
      //
      // // sharp(decodedFile)
      // //   .withMetadata()
      // //   .toFile(path)
      // //   .then(info => {
      // //
      // //     console.log('info -----> ' + info)
      // //     console.log(info)
      // //   });
      //
      //   // var ExifImage = require('exif').ExifImage;
      //   //
      //   // try {
      //   //     new ExifImage({ image : decodedFile }, function (error, exifData) {
      //   //         if (error)
      //   //
      //   //             console.log('Error1: ---> '+error.message);
      //   //         else
      //   //             console.log('exifData ---> ');
      //   //             console.log(exifData); // Do something with your data!
      //   //     });
      //   // } catch (error) {
      //   //     console.log('Error2: ---> ' + error.message);
      //   // }
      //
      // var aaa = sharp(decodedFile).withMetadata();
      // console.log('aaa --> ')
      // console.log(aaa)
      //
      // sharp(decodedFile).withMetadata().rotate().toFile(path, (err, info) => {
      //
      //     console.log('path ---> ')
      //     console.log(path)
      //     console.log('err ---> ')
      //     console.log(err)
      //     console.log('info ---> ')
      //     console.log(info)
      //
      //     resolve(url);
      //
      //     // var fs = require('fs');
      //     //
      //     // fs.writeFile(path, outfile, function (err) {
      //     //   if (err) {
      //     //
      //     //     console.log('saveImage failed end...')
      //     //     resolve();
      //     //
      //     //   }else{
      //     //
      //     //     console.log('saveImage success end...')
      //     //     resolve(url);
      //     //   }
      //     // });
      //   });
    })
  }
};
