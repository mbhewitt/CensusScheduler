// account page form
export const HELPER_TEXT_EMERGENCY_CONTACT =
  "How to reach your emergency contact on or off playa";
export const HELPER_TEXT_LOCATION =
  "How to find you on playa and any other relevant info";

// contact page form — label → email recipients. The label is what
// the user sees in the To dropdown and what we store in op_messages.to;
// the email string (comma-separated, RFC-style) is what the email
// actually goes to. Keep this list short — every entry is an inbox
// that gets pinged for every routed message.
export const CONTACT_RECIPIENTS: Record<string, string> = {
  "Volunteer Coordinator": "censusvolunteercoordinators@burningman.org",
  "Census Manager": "ann.norton@burningman.org, random@burningman.org",
  Data: "aaronshev@gmail.com",
  Technology: "mu@burningman.org, chipper@burningman.org, rqreyes@gmail.com",
};
export const CONTACT_RECIPIENT_LABELS = Object.keys(CONTACT_RECIPIENTS).sort();

// review dialog - radio options
export const legendList = [
  "Consider for leadership",
  "Exceeds expections",
  "Meets expectations",
  "Needs coaching",
  "Not a good fit",
];

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

// shift type form - meal options
export const MEAL_LIST = [
  "None",
  "Breakfast before",
  "Breakfast after",
  "Lunch before",
  "Lunch after",
  "Dinner before",
  "Dinner after",
];

// auth gate - account type
export const ACCOUNT_TYPE_SUPER_ADMIN = "accountTypeSuperAdmin";

// action types - session
export const SESSION_BEHAVIORAL_STANDARDS = "sessionBehavioralStandards";
export const SESSION_ROLE_ITEM_ADD = "sessionRoleItemAdd";
export const SESSION_ROLE_ITEM_REMOVE = "sessionRoleItemRemove";
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

// shift volunteer update types
export const UPDATE_TYPE_CHECK_IN = "updateTypeCheckIn";
export const UPDATE_TYPE_REVIEW = "updateTypeReview";

// idle time
export const IDLE_MINUTES = 5;

// palette
export const COLOR_BURNING_MAN_BROWN = "#2f2f2f";
export const COLOR_CENSUS_PINK = "#ea008b";

// roles
export const ROLE_ADMIN_ID = 2;
export const ROLE_BEHAVIORAL_STANDARDS_ID = 1000012;
export const ROLE_CORE_CREW_ID = 13184;
export const ROLE_SUPER_ADMIN_ID = 1;

// sockets
export const ADD_SHIFT_VOLUNTEER_REQ = "addShiftVolunteerReq";
export const ADD_SHIFT_VOLUNTEER_RES = "addShiftVolunteerRes";
export const CLEAR_CANVAS_REQ = "clearCanvasReq";
export const CLEAR_CANVAS_RES = "clearCanvasRes";
export const DRAW_MOVE_REQ = "drawMoveReq";
export const DRAW_MOVE_RES = "drawMoveRes";
export const REMOVE_SHIFT_VOLUNTEER_REQ = "removeShiftVolunteerReq";
export const REMOVE_SHIFT_VOLUNTEER_RES = "removeShiftVolunteerRes";
export const TOGGLE_CHECK_IN_REQ = "toggleCheckInReq";
export const TOGGLE_CHECK_IN_RES = "toggleCheckInRes";
export const UPDATE_REVIEW_REQ = "updateReviewReq";
export const UPDATE_REVIEW_RES = "updateReviewRes";
