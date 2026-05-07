import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OptionsObject, SnackbarKey, SnackbarMessage } from "notistack";
import { Dispatch } from "react";

import { SnackbarText } from "@/components/general/SnackbarText";
import { DEVELOPER_MODE_RESET, SESSION_SIGN_OUT } from "@/constants";
import { IDeveloperModeAction } from "@/state/developer-mode/reducer";
import { ISessionAction } from "@/state/session/reducer";
import { resetFilterList } from "@/utils/resetFilterList";

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
    // Clear the server-side session cookie. Fire-and-forget — even if the
    // request fails (offline, etc.) we still proceed with the client-side
    // teardown so the user feels signed out.
    fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});

    developerModeDispatch({
      type: DEVELOPER_MODE_RESET,
    });
    sessionDispatch({
      type: SESSION_SIGN_OUT,
    });

    resetFilterList();

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
