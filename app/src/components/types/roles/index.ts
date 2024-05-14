// behavioral standards
// --------------------
export interface IReqRoleBehavioralStandardsItem {
  isBehavioralStandardsSigned: boolean;
  shiftboardId: number;
}

// display
// --------------------
export interface IReqRoleDisplayItem {
  checked: boolean;
}

// role list
// --------------------
export interface IReqRoleListItem {
  name: string;
}
export interface IResRoleListItem {
  display: boolean;
  id: number;
  name: string;
}

// volunteer
// --------------------
export interface IReqRoleVolunteerItem {
  shiftboardId: number;
}
export interface IResRoleVolunteerItem {
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
