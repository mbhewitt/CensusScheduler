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

// action types - developer mode
export const DEVELOPER_MODE_ACCOUNT_TYPE = "developerModeAccountType";
export const DEVELOPER_MODE_DATE_TIME = "developerModeDateTime";
export const DEVELOPER_MODE_DISABLE_IDLE = "developerModeDisableIdle";
export const DEVELOPER_MODE_RESET = "developerModeReset";
export const DEVELOPER_MODE_STATE_STORAGE = "developerModeStateStorage";

// developer mode - account types
export const ACCOUNT_TYPE_ADMIN = "accountTypeAdmin";
export const ACCOUNT_TYPE_AUTHENTICATED = "accountTypeAuthenticated";
export const ACCOUNT_TYPE_UNAUTHENTICATED = "accountTypeUnauthenticated";
export const ACCOUNT_TYPE_RESET = "accountTypeReset";

export const ACCOUNT_TYPE_LIST = [
  { label: "Admin", value: ACCOUNT_TYPE_ADMIN },
  { label: "Authenticated", value: ACCOUNT_TYPE_AUTHENTICATED },
  { label: "Unauthenticated", value: ACCOUNT_TYPE_UNAUTHENTICATED },
];

// action types - session
export const SESSION_BEHAVIORAL_STANDARDS = "sessionBehavioralStandards";
export const SESSION_SIGN_IN = "sessionSignIn";
export const SESSION_SIGN_OUT = "sessionSignOut";
export const SESSION_STATE_STORAGE = "sessionStateStorage";

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
export const COLOR_BURNING_MAN_BROWN = "#2f2f2f";
export const COLOR_CENSUS_PINK = "#ed008c";

// roles
export const ROLE_BEHAVIORAL_STANDARDS_ID = 1000012;
export const ROLE_CORE_CREW_ID = 13184;
export const ROLE_SUPER_ADMIN_ID = 1;
