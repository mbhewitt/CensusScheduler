export const resetFilterList = () => {
  const filterListStateStorage = JSON.parse(
    sessionStorage.getItem("filterListState") ?? "[]"
  );

  if (filterListStateStorage.length > 0) {
    sessionStorage.setItem(
      "filterListState",
      JSON.stringify(
        filterListStateStorage.map((_: string[], index: number) =>
          index === 1 ? ["Present / Future"] : []
        )
      )
    );
  }

  // #723 agenda filters (Schedule.tsx). Cleared on sign-in AND sign-out — both
  // call this — so a new user on a shared tablet never inherits the previous
  // user's Shifts filters (incl. "my shifts only").
  sessionStorage.removeItem("shiftsAgendaFilter");
};
