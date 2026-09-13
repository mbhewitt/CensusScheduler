import { Home } from "@/app/Home";

export const metadata = {
  // Absolute base so the share-card image (opengraph-image.png) resolves to the
  // live domain; without it Next emits a localhost URL that scrapers can't fetch.
  metadataBase: new URL("https://volunteers.census.burningman.org"),
  title: "Census | Home",
};
const HomePage = () => {
  // render
  // ------------------------------------------------------------
  return <Home />;
};

export default HomePage;
