import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OptionsObject, SnackbarKey, SnackbarMessage } from "notistack";
import { Dispatch } from "react";

import { SnackbarText } from "@/components/general/SnackbarText";
import { DEVELOPER_MODE_RESET, SESSION_SIGN_OUT } from "@/constants";
import { IDeveloperModeAction } from "@/state/developer-mode/reducer";
import { ISessionAction } from "@/state/session/reducer";

export const signOut = (
  developerModeDispatch: Dispatch<IDeveloperModeAction>,
  enqueueSnackbar: (
    message: SnackbarMessage,
    options?: OptionsObject | undefined
  ) => SnackbarKey,
  isAuthenticated: boolean,
  playaName: string,
  router: AppRouterInstance,
  sessionDispatch: Dispatch<ISessionAction>,
  worldName: string
) => {
  if (isAuthenticated) {
    developerModeDispatch({
      type: DEVELOPER_MODE_RESET,
    });
    sessionDispatch({
      type: SESSION_SIGN_OUT,
    });
    const filterListStateStorage = JSON.parse(
      sessionStorage.getItem("filterListState") ?? "[]"
    );

    if (filterListStateStorage.length > 0) {
      sessionStorage.setItem(
        "filterListState",
        JSON.stringify(filterListStateStorage.map(() => []))
      );
    }

    enqueueSnackbar(
      <SnackbarText>
        <strong>
          {playaName} &quot;{worldName}&quot;
        </strong>{" "}
        has signed out
      </SnackbarText>,
      {
        variant: "success",
      }
    );
    router.push("/sign-in");
  }
};
