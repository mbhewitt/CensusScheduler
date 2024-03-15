import { NextRouter } from "next/router";
import { OptionsObject, SnackbarKey, SnackbarMessage } from "notistack";
import { Dispatch } from "react";

import { SnackbarText } from "src/components/general/SnackbarText";
import { DEVELOPER_MODE_RESET, SIGN_OUT } from "src/constants";
import { IDeveloperModeAction } from "src/state/developer-mode/reducer";
import { ISessionAction } from "src/state/session/reducer";

export const signOut = (
  developerModeDispatch: Dispatch<IDeveloperModeAction>,
  enqueueSnackbar: (
    message: SnackbarMessage,
    options?: OptionsObject | undefined
  ) => SnackbarKey,
  isAuthenticated: boolean,
  playaName: string,
  router: NextRouter,
  sessionDispatch: Dispatch<ISessionAction>,
  worldName: string
) => {
  if (isAuthenticated) {
    developerModeDispatch({
      type: DEVELOPER_MODE_RESET,
    });
    sessionDispatch({
      type: SIGN_OUT,
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
