import { IResVolunteerRoleItem } from "src/components/types";
import { ROLE_SUPER_ADMIN_ID } from "src/constants";
import { checkIsRoleExist } from "src/utils/checkIsRoleExist";

export const checkIsSuperAdmin = (roleList: IResVolunteerRoleItem[]) => {
  return checkIsRoleExist(ROLE_SUPER_ADMIN_ID, roleList);
};
