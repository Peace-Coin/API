function createConnection(){

  var conf;

  if (process.env.NODE_ENV === 'production') {

    conf = require('../config/prodconf.json');

  }else{

    conf = require('../config/devconf.json');
  }

  'use strict';

  console.log('DB_HOST -> ' + conf.DB_HOST)
  console.log('DB_USER -> ' + conf.DB_USER)
  console.log('DB_PASSWORD -> ' + conf.DB_PASSWORD)
  console.log('DB_PORT -> ' + conf.DB_PORT)
  console.log('DB_SCHEMA -> ' + conf.DB_SCHEMA)

  let mysql = require('mysql');
  let connection = mysql.createConnection({
    host : conf.DB_HOST,
    user : conf.DB_USER,
    password : conf.DB_PASSWORD,
    port : Number(conf.DB_PORT),
    database: conf.DB_SCHEMA,
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
      if (err) {
          console.log('ERROR.CONNECTION_DB: ', err);
          setTimeout(createConnection, 1000);
      }
  });

  //error('PROTOCOL_CONNECTION_LOST')時に再接続
  connection.on('error', function(err) {
     console.log('ERROR.DB: ', err);
     if (err.code === 'PROTOCOL_CONNECTION_LOST') {
         console.log('ERROR.CONNECTION_LOST: ', err);
         console.log('Mysql再接続...')
         createConnection();
     } else {
         throw err;
     }
  });

  return connection;
};

module.exports = {

  //MysqlConnectionの作成、使用後必ずfinnaly内でendConnectionすること。
  getConnection: () => {

    console.log('MysqlConnection getConnection() start...')

    let connection = createConnection();

    console.log('mysql connect success')

    return connection;

    // connection.query('SELECT * from test_table LIMIT 10;', (err, rows, fields) => {
    //   if (err) throw err;
    //
    //   console.log('The solution is: ', rows);
    // });
    //
    // connection.end();
  },
  endConnection: connection => {

    console.log('connection -> ' + connection)

    //connect end 共に現状バージョンでは不要のためコメントアウト
    //→トランザクションを有効にするため、コネクションは毎回新規作成し、必ず閉じる
    //成功時、およびコントロラーのエラーレスポンス返却時に必ず実施する
    connection.end();
  }
};


// var conf;
//
// if (process.env.NODE_ENV === 'production') {
//
//   conf = require('../config/prodconf.json');
//
// }else{
//
//   conf = require('../config/devconf.json');
// }
//
// 'use strict';
//
// let mysql = require('mysql');
// var connection;
//
// function handleDisconnect() {
//     console.log('INFO.CONNECTION_DB: ');
//     connection = mysql.createConnection({
//       host : conf.DB_HOST,
//       user : conf.DB_USER,
//       password : conf.DB_PASSWORD,
//       port : Number(conf.DB_PORT),
//       database: conf.DB_SCHEMA,
//     });
//
//     //connection取得
//     connection.connect(function(err) {
//         if (err) {
//             console.log('ERROR.CONNECTION_DB: ', err);
//             setTimeout(handleDisconnect, 5000);
//         }
//     });
//
//     //error('PROTOCOL_CONNECTION_LOST')時に再接続
//     connection.on('error', function(err) {
//         console.log('ERROR.DB: ', err);
//         if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//
//             console.log('ERROR.CONNECTION_LOST: ', err);
//             console.log('コネクション切れ...再接続の実施...');
//             handleDisconnect();
//         } else {
//             throw err;
//         }
//     });
// }
//
// handleDisconnect();
//
// module.exports = {
//
//   //MysqlConnectionの作成、使用後必ずfinnaly内でendConnectionすること。
//   getConnection: () => {
//
//     // console.log('MysqlConnection getConnection() start...')
//     //
//     // var conf;
//     //
//     // if (process.env.NODE_ENV === 'production') {
//     //
//     //   conf = require('../config/prodconf.json');
//     //
//     // }else{
//     //
//     //   conf = require('../config/devconf.json');
//     // }
//     //
//     // 'use strict';
//     //
//     // //console.log('DB_HOST -> ' + conf.DB_HOST)
//     // //console.log('DB_USER -> ' + conf.DB_USER)
//     // //console.log('DB_PASSWORD -> ' + conf.DB_PASSWORD)
//     // //console.log('DB_PORT -> ' + conf.DB_PORT)
//     // //console.log('DB_SCHEMA -> ' + conf.DB_SCHEMA)
//     //
//     // let mysql = require('mysql');
//     // let connection = mysql.createConnection({
//     //   host : conf.DB_HOST,
//     //   user : conf.DB_USER,
//     //   password : conf.DB_PASSWORD,
//     //   port : Number(conf.DB_PORT),
//     //   database: conf.DB_SCHEMA,
//     // });
//     //
//     // //connect end 共に現状バージョンでは不要のためコメントアウト
//     // //connection.connect();
//     //
//     // console.log('mysql connect success')
//     // console.log('use mysql connection start...')
//
//     return connection;
//
//   },
//   endConnection: connection => {
//
//     console.log('use mysql connection end... ')
//
//     //connect end 共に現状バージョンでは不要のためコメントアウト
//     //connection.end();
//   }
// };
