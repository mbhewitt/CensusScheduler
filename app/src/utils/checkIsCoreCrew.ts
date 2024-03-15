import { IResVolunteerRoleItem } from "src/components/types";
import { ACCOUNT_TYPE_ADMIN, ROLE_CORE_CREW_ID } from "src/constants";
import { IAccountTypePayload } from "src/state/developer-mode/reducer";
import { checkIsRoleExist } from "src/utils/checkIsRoleExist";

export const checkIsCoreCrew = (
  { isEnabled, value }: IAccountTypePayload,
  roleList: IResVolunteerRoleItem[]
) => {
  return (
    (isEnabled && value === ACCOUNT_TYPE_ADMIN) ||
    (!isEnabled && checkIsRoleExist(ROLE_CORE_CREW_ID, roleList))
  );
};
