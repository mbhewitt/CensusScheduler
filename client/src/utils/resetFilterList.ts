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
};
