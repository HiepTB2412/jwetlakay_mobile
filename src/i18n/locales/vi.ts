import type { en } from "./en";

// Copy follows web-client src/language/locales/vi.ts. Differences from the web:
// - keys the web VI file lacks (notGetOtp, createNewPasst, back, ok, …) are translated here;
// - passwordMinLength is corrected to the real rule (min 6 characters, spec Phần B §5.5).

export const vi: Record<keyof typeof en, string> = {
  // Common
  something_went_wrong: "Đã xảy ra lỗi. Vui lòng thử lại.",
  anErrorOccurred: "Có lỗi xảy ra",
  next: "Tiếp theo",
  back: "Quay lại",
  close: "Đóng",
  ok: "Đồng ý",
  retry: "Thử lại",
  complete: "Hoàn thành",
  home: "Trang chủ",
  hello: "Xin chào, {{name}}",
  showPassword: "Hiện mật khẩu",
  hidePassword: "Ẩn mật khẩu",
  noContent: "Chưa có nội dung",
  loading: "Đang tải",
  sportApiUnavailable: "Tạm thời không tải được tỷ lệ cược. Vui lòng thử lại sau.",

  // Auth: shared fields
  login: "Đăng nhập",
  register: "Đăng ký",
  password: "Mật khẩu",
  phoneNumber: "Số điện thoại",
  phoneNumberEmpty: "Số điện thoại không được để trống",
  invalidFormatPhoneNumber: "Số điện thoại không hợp lệ",
  invalidPhoneNumber: "Số điện thoại không hợp lệ",
  passwordEmpty: "Mật khẩu không được để trống",
  passwordMinLength: "Mật khẩu phải có ít nhất 6 ký tự.",
  enterVerificationCodeLabel: "Nhập mã xác thực",
  verificationCodeEmpty: "Mã xác thực không được để trống",
  otpMustBe6Digits: "Mã OTP phải là 6 chữ số",
  notGetOtp: "Bạn không nhận được mã xác thực?",
  resendAfter: "Gửi lại sau",
  resendVerificationCode: "Gửi lại mã xác thực",

  // Login
  newPassword: "Mật khẩu mới",
  confirmPassword: "Nhập lại mật khẩu",
  newPasswordMismatch: "Mật khẩu mới không trùng Nhập lại mật khẩu",
  reenterPasswordEmpty: "Nhập lại mật khẩu không được để trống",
  rememberLogin: "Lưu đăng nhập",
  forgotPassword: "Quên mật khẩu?",
  forgotPasswordLink: "Quên mật khẩu",
  account_locked_title: "Tài khoản tạm thời bị khóa",
  account_locked_msg_prefix: "Bạn đã nhập sai mật khẩu quá 5 lần. Hãy sử dụng tính năng",
  account_locked_msg_suffix: "để đặt lại và mở khóa ngay lập tức.",
  loginFailed: "Đăng nhập thất bại",
  NoAccount: "Bạn chưa có tài khoản?",
  registerNow: "Đăng ký ngay",

  // Register
  enterPassword: "Nhập mật khẩu",
  passwordMismatch: "Mật khẩu nhập lại không khớp",
  selectCurrency: "Chọn đơn vị tiền tệ",
  enterReferralCode: "Nhập mã giới thiệu (nếu có)",
  enterFullName: "Nhập họ tên",
  fullNameEmpty: "Họ tên không được để trống",
  email: "Email",
  agreewithOur: "Bằng việc Đăng ký, bạn đã đồng ý với",
  termsOfUse: "Điều khoản sử dụng",
  and: "và",
  privacyPolicy: "Chính sách bảo mật",
  ofOur: "của chúng tôi, và xác nhận rằng bạn đủ tuổi hợp pháp",
  iUnderstand: "Tôi đã hiểu",
  alreadyHaveAccount: "Bạn đã đăng kí tài khoản?",
  loginNow: "Đăng nhập ngay",
  registerSuccess: "Đăng ký thành công",

  // Forgot password
  enterRegisteredPhone: "Nhập số điện thoại bạn dùng để đăng kí tài khoản",
  enterVerificationCode: "Nhập mã xác thực gửi về số điện thoại/email của bạn",
  createNewPasst: "Tạo mật khẩu mới",
  enterNewPassword: "Nhập mật khẩu mới",
  reenterNewPassword: "Nhập lại mật khẩu mới",
  reenterPasswordMismatch: "Mật khẩu nhập lại không đúng",
  pleaseReenterPassword: "Vui lòng nhập lại mật khẩu",
  passwordChanged: "Đổi mật khẩu thành công",

  // Logout
  logOut: "Đăng xuất",
  logoutDescription: "Bạn có chắc chắn muốn đăng xuất không?",
};
