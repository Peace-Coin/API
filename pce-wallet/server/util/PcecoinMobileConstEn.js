//プロフィールバリデーションエラーメッセージ
exports.ERROR_MESSAGE_REQUIRED = ' is not allowed to be empty';

exports.ERROR_MESSAGE_HALF_ALPHABET = ' fails to match the required pattern: half-width alphabet';
exports.ERROR_MESSAGE_HALF_ALPHABET_MARK = ' fails to match the required pattern: half-width alphabet and number and [-=.,/]';

exports.ERROR_MESSAGE_HALF_ALPHANUMERIC = ' fails to match the required pattern: half-width alphabet';
exports.ERROR_MESSAGE_HALF_ALPHANUMERIC_MARK = ' fails to match the required pattern: half-width alphabet and number and [-=.,/]';

exports.ERROR_MESSAGE_HALF_NUMBER = ' fails to match the required pattern: half-width alphabet';
exports.ERROR_MESSAGE_HALF_NUMBER_MARK = ' fails to match the required pattern: half-width alphabet and number and [-+.,/]';

exports.ERROR_MESSAGE_MIN_LENGTH = ' more than ? char';
exports.ERROR_MESSAGE_MAX_LENGTH = ' less than ? char';
exports.ERROR_MESSAGE_MAX_BYTE_LENGTH = ' less than ?MB byte size';

exports.LABEL_USER_NAME = "User Name";
exports.LABEL_USER_INTRODUCTION = "User Introduction";
exports.LABEL_USER_IMAGE = "User Image";

//メッセージ サインアップ
exports.MESSAGE_SIGNUP_1 = "メールアドレスが未入力です";
exports.MESSAGE_SIGNUP_2 = "このメールアドレスはすでに登録されています";
exports.MESSAGE_SIGNUP_3 = "登録が完了しました";
exports.MESSAGE_SIGNUP_4 = "パスワードが未入力です";

//メッセージ リセットパスワード
exports.MESSAGE_RESETPASSWORD_1 = "メールアドレスが未入力です";
exports.MESSAGE_RESETPASSWORD_2 = "このメールアドレスは登録されていません";
exports.MESSAGE_RESETPASSWORD_3 = "パスワード変更用のキーを発行しました";

//メッセージ パスワード変更
exports.MESSAGE_UPDATEPASSWORD_1 = "パスワード変更用のキーが不正です";
exports.MESSAGE_UPDATEPASSWORD_2 = "パスワードハッシュ生成エラー";
exports.MESSAGE_UPDATEPASSWORD_3 = "パスワード変更が完了しました";

//DBエラーメッセージ
exports.ERROR_DUPLICATION = "登録時レコード重複エラー";
exports.ERROR_NOTHING = "レコードが存在しません";
exports.ERROR_SYSTEM = "システムエラー";
