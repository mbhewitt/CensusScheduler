// contact page form
export const GENERAL_ROLE_LIST = [
  "Census Lab Coordinator",
  "Census Manager",
  "Construction Lead",
  "Data Analyst/Science",
  "Sampling Coordinator",
  "Scheduling Coordinator",
  "Technology",
  "Volunteer Coordinator",
].sort();

// account types
export const ACCOUNT_TYPE_ADMIN = "accountTypeAdmin";
export const ACCOUNT_TYPE_AUTHENTICATED = "accountTypeAuthenticated";
export const ACCOUNT_TYPE_UNAUTHENTICATED = "accountTypeUnauthenticated";
export const ACCOUNT_TYPE_RESET = "accountTypeReset";

export const ACCOUNT_TYPE_LIST = [
  { label: "Admin", value: ACCOUNT_TYPE_ADMIN },
  { label: "Authenticated", value: ACCOUNT_TYPE_AUTHENTICATED },
  { label: "Unauthenticated", value: ACCOUNT_TYPE_UNAUTHENTICATED },
];

// action types - developer mode
export const DEVELOPER_MODE_ACCOUNT_TYPE = "developerModeAccountType";
export const DEVELOPER_MODE_DATE_TIME = "developerModeDateTime";
export const DEVELOPER_MODE_DISABLE_IDLE = "developerModeDisableIdle";
export const DEVELOPER_MODE_RESET = "developerModeReset";
export const DEVELOPER_MODE_STATE_STORAGE = "developerModeStateStorage";

// action types - session
export const AUTHENTICATE = "authenticate";
export const BEHAVIORAL_STANDARDS_ADD = "behavioralStandardsAdd";
export const SIGN_IN = "signIn";
export const SIGN_OUT = "signOut";
export const SESSION_STATE_STORAGE = "sessionStateStorage";
export const UNAUTHENTICATE = "unauthenticate";

// check-in hours
export const CHECK_IN_BEFORE_HOURS = 1;
export const CHECK_OUT_AFTER_HOURS = 2;

// check-in types
export const SHIFT_FUTURE = "shiftFuture";
export const SHIFT_DURING = "shiftDuring";
export const SHIFT_PAST = "shiftPast";

// idle time
export const IDLE_MINUTES = 5;

// palette
export const BURNING_MAN_BROWN = "#2f2f2f";
export const CENSUS_PINK = "#ed008c";

// roles
export const BEHAVIORAL_STANDARDS_ID = 1000012;
export const CORE_CREW_ID = 13184;
export const SUPER_ADMIN_ID = 1;
