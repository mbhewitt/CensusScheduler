import { IResVolunteerRoleItem } from "src/components/types";
import { ACCOUNT_TYPE_ADMIN, CORE_CREW_ID } from "src/constants";
import { IAccountTypePayload } from "src/state/developer-mode/reducer";
import { checkRole } from "src/utils/checkRole";

export const coreCrewCheck = (
  { isEnabled, value }: IAccountTypePayload,
  roleList: IResVolunteerRoleItem[]
) => {
  return (
    (isEnabled && value === ACCOUNT_TYPE_ADMIN) ||
    (!isEnabled && checkRole(CORE_CREW_ID, roleList))
  );
};
