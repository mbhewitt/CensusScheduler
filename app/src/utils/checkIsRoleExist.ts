import { IResVolunteerRoleItem } from "src/components/types";

export const checkIsRoleExist = (
  roleId: number,
  roleList: IResVolunteerRoleItem[]
) => roleList && roleList.some((roleItem) => roleItem.roleId === roleId);
