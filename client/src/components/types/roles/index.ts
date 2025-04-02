// behavioral standards
// ------------------------------------------------------------
export interface IReqRoleBehavioralStandardsItem {
  isBehavioralStandardsSigned: boolean;
  shiftboardId: number;
}

// details
// ------------------------------------------------------------
export interface IReqRoleItem {
  name: string;
}

// display
// ------------------------------------------------------------
export interface IReqRoleDisplayItem {
  checked: boolean;
}

// row table
// ------------------------------------------------------------
export interface IResRoleRowItem {
  display: boolean;
  id: number;
  name: string;
}

// volunteers
// ------------------------------------------------------------
export interface IReqRoleVolunteerItem {
  shiftboardId: number;
}
export interface IResRoleVolunteerItem {
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
