import { redirect } from "next/navigation";

// My Shifts is no longer a separate page — /shifts IS the agenda now (the flip).
// Redirect any old bookmarks/links here to the single Shifts page, which reads
// the signed-in volunteer from the session and shows the same personal view.
const SchedulePage = () => {
  redirect("/shifts");
};

export default SchedulePage;
