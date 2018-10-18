//image save console.dir
//exports.SAVE_DIR = '/opt/';
exports.SAVE_DIR = '/var/www/public/';
exports.SAVE_URL = 'https://wallet-app-dev.peace-coin.org/public/';

//プロフィールバリデーションエラーメッセージ
exports.ERROR_MESSAGE_REQUIRED = ' が未入力です';

exports.ERROR_MESSAGE_HALF_ALPHABET = 'は半角英字で入力してください';
exports.ERROR_MESSAGE_HALF_ALPHABET_MARK = 'は半角英字と[-=.,/]で入力してください';

exports.ERROR_MESSAGE_HALF_ALPHANUMERIC = 'は半角英数字で入力してください';
exports.ERROR_MESSAGE_HALF_ALPHANUMERIC_MARK = 'は半角英数字と[-=.,/]で入力してください';

exports.ERROR_MESSAGE_HALF_NUMBER = 'は半角数字で入力してください';
exports.ERROR_MESSAGE_HALF_NUMBER_MARK = 'は半角数字と[-+.,/]で入力してください';

exports.ERROR_MESSAGE_MIN_LENGTH = 'は ? 文字以上で入力してください';
exports.ERROR_MESSAGE_MAX_LENGTH = 'は ? 文字以下で入力してください';
exports.ERROR_MESSAGE_MAX_BYTE_LENGTH = 'は ? MB以内のサイズのファイルを選択してください';

exports.LABEL_USER_NAME = "ユーザー名";
exports.LABEL_USER_INTRODUCTION = "プロフィール";
exports.LABEL_USER_IMAGE = "プロフィール画像";
exports.LABEL_BACKGROUND_IMAGE = "プロフィール背景画像";

exports.MESSAGE_NOT_EXIST_PROFILE = "プロフィールがありません";

//システム設定
exports.MESSAGE_GETSYSTEMINFO_1 = "パラメータが不正です";
exports.MESSAGE_GETSYSTEMINFO_2 = "有効な情報はありません";

//メール登録済みチェック
exports.MESSAGE_CHECKEXISTEMAIL_1 = "このメールアドレスは有効です";

//メッセージ サインアップ
exports.MESSAGE_SIGNUP_1 = "メールアドレスが未入力です";
exports.MESSAGE_SIGNUP_2 = "このメールアドレスはすでに登録されています";
exports.MESSAGE_SIGNUP_3 = "登録が完了しました";
exports.MESSAGE_SIGNUP_4 = "パスワードが未入力です";
exports.MESSAGE_SIGNUP_5 = "パスワードは8-20桁を指定してください";
exports.MESSAGE_SIGNUP_6 = "メールアドレスは256桁以内を指定してください";
exports.MESSAGE_SIGNUP_7 = "メールアドレスの形式が不正です";

//メッセージ リセットパスワード
exports.MESSAGE_RESETPASSWORD_1 = "メールアドレスが未入力です";
exports.MESSAGE_RESETPASSWORD_2 = "このメールアドレスは登録されていません";
exports.MESSAGE_RESETPASSWORD_3 = "パスワード変更用のキーを発行しました";

//メッセージ パスワード変更（忘れた場合）
exports.MESSAGE_UPDATEPASSWORD_1 = "パスワード変更用のキーが不正です";
exports.MESSAGE_UPDATEPASSWORD_2 = "パスワードハッシュ生成エラー";
exports.MESSAGE_UPDATEPASSWORD_3 = "パスワード変更が完了しました";

//メッセージ パスワード変更（ログイン後）
exports.MESSAGE_CHANGEPASSWORD_1 = "旧パスワードが未入力です";
exports.MESSAGE_CHANGEPASSWORD_2 = "新パスワードが未入力です";
exports.MESSAGE_CHANGEPASSWORD_3 = "新パスワードは8-20桁を指定してください";
exports.MESSAGE_CHANGEPASSWORD_4 = "旧パスワードが正しくありません";
exports.MESSAGE_CHANGEPASSWORD_5 = "パスワード変更が完了しました";

//メールアドレス変更
exports.MESSAGE_CHANGEEMAIL_1 = "メールアドレスが未入力です";
exports.MESSAGE_CHANGEEMAIL_2 = "メールアドレスは256桁以内を指定してください";
exports.MESSAGE_CHANGEEMAIL_3 = "メールアドレスの形式が不正です";
exports.MESSAGE_CHANGEEMAIL_4 = "このメールアドレスはすでに登録されています";
exports.MESSAGE_CHANGEEMAIL_5 = "メールアドレスを更新しました";

//認証コードチェック
exports.MESSAGE_CONFIRMCODE_1 = "認証コードに誤りがあります";
exports.MESSAGE_CONFIRMCODE_2 = "正しい認証コードが入力されました";

//プロフィール登録変更
exports.MESSAGE_UPDATEPROFILE_1 = "プロフィール登録が完了しました";
exports.MESSAGE_UPDATEPROFILE_2 = "プロフィール変更が完了しました";

//ウォレット作成
exports.MESSAGE_CREATEWALLET_1 = "ウォレット作成が完了しました";
exports.MESSAGE_CREATEWALLET_2 = "通貨コードが不正です";
exports.MESSAGE_CREATEWALLET_3 = "通貨コードは必須項目です";
exports.MESSAGE_CREATEWALLET_4 = "ウォレットアドレスの生成に失敗しました。お手数ですが、再度お試しください";
exports.MESSAGE_CREATEWALLET_5 = "すでに指定の通貨のウォレットが作成されています";
exports.MESSAGE_CREATEWALLET_6 = "すでに全ての通貨のウォレットが作成されています";

//ウォレット情報取得
exports.MESSAGE_GETWALLET_1 = "ウォレット情報が存在しません";

//ユーザー情報取得（ウォレットアドレス）
exports.MESSAGE_GETUSERINFOBYWALLETADDRESS_1 = "ウォレット情報が存在しません";
exports.MESSAGE_GETUSERINFOBYWALLETADDRESS_2 = "ユーザー情報が存在しません";
exports.MESSAGE_GETUSERINFOBYWALLETADDRESS_3 = "ウォレットアドレスが未入力です";

//フレンド登録
exports.MESSAGE_ADDFRIEND_1 = "ユーザーIDが未入力です";
exports.MESSAGE_ADDFRIEND_2 = "すでにフレンド登録済みです";
exports.MESSAGE_ADDFRIEND_3 = "ユーザー情報がありません";
exports.MESSAGE_ADDFRIEND_4 = "フレンド登録が完了しました";
exports.MESSAGE_ADDFRIEND_5 = "自分は指定できません";

//フレンド解除
exports.MESSAGE_REMOVEFRIEND_1 = "ユーザーIDが未入力です";
exports.MESSAGE_REMOVEFRIEND_2 = "すでにフレンド解除済みです";
exports.MESSAGE_REMOVEFRIEND_3 = "ユーザー情報がありません";
exports.MESSAGE_REMOVEFRIEND_4 = "フレンド解除が完了しました";

//フレンド一覧取得
exports.MESSAGE_GETFRIENDLIST_1 = "フレンドが存在しません";

//送金
exports.MESSAGE_SENDCOIN_1 = "残高が不足しています";
exports.MESSAGE_SENDCOIN_2 = "同じ相手には１分以内に連続して送金できません";
exports.MESSAGE_SENDCOIN_3 = "通貨コードが未入力です";
exports.MESSAGE_SENDCOIN_4 = "送金先が見つかりません。送金先のアドレスに誤りがある可能性があります";
exports.MESSAGE_SENDCOIN_5 = "金額が未入力です";
exports.MESSAGE_SENDCOIN_6 = "金額が数値ではありません";
exports.MESSAGE_SENDCOIN_7 = "送金が完了しました";
exports.MESSAGE_SENDCOIN_8 = "送金先アドレスが未入力です";
exports.MESSAGE_SENDCOIN_9 = "メッセージは500文字以内が許可されています";
exports.MESSAGE_SENDCOIN_10 = "送金先に自分のアドレスは指定できません";
exports.MESSAGE_SENDCOIN_11 = "送金が完了しました";
exports.MESSAGE_SENDCOIN_12 = "amountは0以上を指定してください";
exports.MESSAGE_SENDCOIN_13 = "ウォレットが存在しません";
exports.MESSAGE_SENDCOIN_14 = "グループIDは半角英数50桁を指定してください";
exports.MESSAGE_SENDCOIN_15 = "送金は完了しましたが、フレンド情報を更新できませんでした。先にフレンド登録を実施してください。";
exports.MESSAGE_SENDCOIN_16 = "amountは1-10桁を指定してください";

//取引履歴取得
exports.MESSAGE_GETHISTORY_1 = "通貨コードは必須です";
exports.MESSAGE_GETHISTORY_2 = "limitが未指定です";
exports.MESSAGE_GETHISTORY_3 = "offsetが未指定です";
exports.MESSAGE_GETHISTORY_4 = "ウォレット情報が存在しません";
exports.MESSAGE_GETHISTORY_5 = "limitが数値ではありません";
exports.MESSAGE_GETHISTORY_6 = "offsetが数値ではありません";

//DBエラーメッセージ
exports.ERROR_DUPLICATION = "登録時レコード重複エラー";
exports.ERROR_NOTHING = "レコードが存在しません";
exports.ERROR_DB = "データベース不整合エラー";
exports.ERROR_SYSTEM = "システムエラー";

//エラーコード
exports.ERROR_CODE_0000 = "E0000";
exports.ERROR_CODE_0001 = "E0001";
exports.ERROR_CODE_0002 = "E0002";
exports.ERROR_CODE_0003 = "E0003";
exports.ERROR_CODE_9999 = "E9999";

// エラーパラムコード
exports.ERROR_PARAM_CODE_P001 = "P001";
exports.ERROR_PARAM_CODE_P002 = "P002";
exports.ERROR_PARAM_CODE_P003 = "P003";
exports.ERROR_PARAM_CODE_P004 = "P004";
exports.ERROR_PARAM_CODE_P005 = "P005";
exports.ERROR_PARAM_CODE_P006 = "P006";
exports.ERROR_PARAM_CODE_P007 = "P007";
exports.ERROR_PARAM_CODE_P008 = "P008";
exports.ERROR_PARAM_CODE_P009 = "P009";
exports.ERROR_PARAM_CODE_P010 = "P010";
exports.ERROR_PARAM_CODE_P011 = "P011";
exports.ERROR_PARAM_CODE_P012 = "P012";
exports.ERROR_PARAM_CODE_P013 = "P013";
exports.ERROR_PARAM_CODE_P014 = "P014";
exports.ERROR_PARAM_CODE_P015 = "P015";
exports.ERROR_PARAM_CODE_P016 = "P016";

exports.ERROR_PARAM_CODE_P017 = "P017";
exports.ERROR_PARAM_CODE_P018 = "P018";
exports.ERROR_PARAM_CODE_P019 = "P019";

exports.ERROR_PARAM_CODE_D001 = "D001";
exports.ERROR_PARAM_CODE_D002 = "D002";
exports.ERROR_PARAM_CODE_D003 = "D003";
exports.ERROR_PARAM_CODE_D004 = "D004";
exports.ERROR_PARAM_CODE_D005 = "D005";
exports.ERROR_PARAM_CODE_D006 = "D006";
exports.ERROR_PARAM_CODE_D007 = "D007";
exports.ERROR_PARAM_CODE_D008 = "D008";
exports.ERROR_PARAM_CODE_D009 = "D009";
exports.ERROR_PARAM_CODE_D010 = "D010";
exports.ERROR_PARAM_CODE_D011 = "D011";
exports.ERROR_PARAM_CODE_D012 = "D012";
exports.ERROR_PARAM_CODE_D013 = "D013";
exports.ERROR_PARAM_CODE_D014 = "D014";
exports.ERROR_PARAM_CODE_D015 = "D015";
exports.ERROR_PARAM_CODE_D016 = "D016";

exports.ERROR_PARAM_CODE_D017 = "D017";
exports.ERROR_PARAM_CODE_D018 = "D018";
exports.ERROR_PARAM_CODE_D019 = "D019";
