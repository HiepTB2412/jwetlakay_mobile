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
  loading: "Loading", // new (accessibility)
  sportApiUnavailable: "Odds are temporarily unavailable. Please try again later.",

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

  // App shell: header, wallet menu, drawer (spec Phần B §3.3–3.6)
  menu: "Menu",
  featureComingSoon: "This feature is coming soon.", // new: target screen not built yet
  hotTag: "HOT",
  mainWallet: "Main wallet",
  promotionWallet: "Promotion wallet",
  freeBetWallet: "Free Bet Wallet",
  commissionWallet: "Commission wallet",
  walletMainShort: "Main", // web hard-codes this label in English
  walletPromoShort: "Promo", // web hard-codes this label in English
  depositNow: "Deposit now",
  deposit: "Deposit",
  withdraw: "Withdraw",
  transactionHistory: "Transaction history",
  betHistory: "Betting history",
  notification: "Notification",
  inviteFriends: "Invite friends",
  profile: "Profile",
  promotion: "Promotion",
  contact: "Contact Us",
  theme: "Theme",
  language: "Language",
  endUser: "End User",
  agent: "Agent",

  // King of Odds ticker (spec Phần B §3.5). Countdown is hard-coded English on the web.
  king_of_odd: "King of Odds",
  leading_at: "is leading with",
  odd: "odds",
  prize: "Prize",
  countdownDays_one: "{{count}} day left",
  countdownDays_other: "{{count}} days left",
  countdownHours_one: "{{count}} hour left",
  countdownHours_other: "{{count}} hours left",
  countdownMinutes: "{{count}} min left",
  countdownSeconds: "{{count}} sec left",

  // Lucky Spin (spec Phần B §6.2–6.4)
  luckySpin: "Lucky Spin", // new (accessibility)
  spin: "Spin Now",
  out_of_spin: "Out Of Spin",
  you_have: "You have",
  spin_ticket: "Spin Ticket",
  today_ticket: "Today's Spin Ticket",
  tomorrow_ticket: "Tomorrow's Spin Ticket",
  ticket: "Ticket",
  text_title: "Congratulations!",
  text_des: "You have received the reward.",
  history: "History", // missing on the web (shows the raw key)
  day: "Day",
  reward: "Reward",
  amount: "Amount",
  wallet: "Wallet",
  status: "Status",
  turn: "Turn",
  failed: "Failed",
  success: "Success",
  pending: "Pending",
  doNotHaveHistory: "You don't have any history.",
  spinFailed: "Spin failed", // web fallback text
  historyFailed: "Get history failed", // web fallback text
  previousPage: "Previous page", // new (accessibility)
  nextPage: "Next page", // new (accessibility)
  try_your_lucky_now: "Try Your Lucky Now",
  congratulations: "Congratulations!",
  lucky_you_have_received_the_reward: "You have received the reward:",
  enter_your_phone: "Enter your phone number to receive:",
  selectCountryCode: "Select country code",
  reward_for_new: "Reward for new players only.",
};

export type TranslationKey = keyof typeof en;
