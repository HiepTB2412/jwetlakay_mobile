// Keys and copy follow web-client src/language/locales/en.ts so both clients stay in sync.
// Keys marked "new" have no web equivalent (the web shows the raw key, spec Phần B §5.5).

export const en = {
  // Common
  something_went_wrong: "Something went wrong. Please try again.",
  anErrorOccurred: "An error occurred",
  next: "Next",
  back: "Back", // new
  close: "Close",
  ok: "OK", // new
  retry: "Retry", // new
  complete: "Complete",
  home: "Home", // new
  hello: "Hello, {{name}}", // new
  showPassword: "Show password", // new (accessibility)
  hidePassword: "Hide password", // new (accessibility)
  noContent: "No content available", // new

  // Auth: shared fields
  login: "Login",
  register: "Register",
  password: "Password",
  phoneNumber: "Phone number",
  phoneNumberEmpty: "Phone number cannot be empty",
  invalidFormatPhoneNumber: "Invalid phone number format",
  invalidPhoneNumber: "Invalid phone number",
  passwordEmpty: "Password cannot be empty",
  passwordMinLength: "Password must be at least 6 characters long.",
  enterVerificationCodeLabel: "Enter Verification Code",
  verificationCodeEmpty: "The verification code cannot be empty",
  otpMustBe6Digits: "OTP must be 6 digits",
  notGetOtp: "Didn't receive the verification code?",
  resendAfter: "Resend after",
  resendVerificationCode: "Resend verification code",

  // Login
  newPassword: "New password",
  confirmPassword: "Confirm password",
  newPasswordMismatch: "New password and Confirm password does not match",
  reenterPasswordEmpty: "Re-enter the password and cannot be empty",
  rememberLogin: "Remember me",
  forgotPassword: "Forgot password?",
  forgotPasswordLink: "Forgot Password",
  account_locked_title: "Account temporarily locked",
  account_locked_msg_prefix: "You have entered the wrong password more than 5 times. Please use the",
  account_locked_msg_suffix: "feature to reset and unlock immediately.",
  loginFailed: "Login failed",
  NoAccount: "Don't have an account?",
  registerNow: "Register now",

  // Register
  enterPassword: "Enter password",
  passwordMismatch: "Passwords do not match",
  selectCurrency: "Select currency",
  enterReferralCode: "Enter referral code (if applicable)",
  enterFullName: "Enter your full name",
  fullNameEmpty: "Full name cannot be empty",
  email: "E-mail",
  agreewithOur: "By registering, you agree to our",
  termsOfUse: "Terms of use",
  and: "and",
  privacyPolicy: "Privacy policy",
  ofOur: ", and confirm that you are of legal age",
  iUnderstand: "I understand",
  alreadyHaveAccount: "Already have an account?",
  loginNow: "Login now",
  registerSuccess: "Registration successful",

  // Forgot password
  enterRegisteredPhone: "Enter the phone number you used to register for an account",
  enterVerificationCode: "Enter the verification code sent to your phone number",
  createNewPasst: "Create a new password",
  enterNewPassword: "Enter new password",
  reenterNewPassword: "Re-enter the new password",
  reenterPasswordMismatch: "Re-entered password does not match",
  pleaseReenterPassword: "Please re-enter the password",
  passwordChanged: "Password changed successfully",

  // Logout
  logOut: "Log out",
  logoutDescription: "Are you sure you want to log out?",
};

export type TranslationKey = keyof typeof en;
