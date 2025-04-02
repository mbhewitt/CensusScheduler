import { Container } from "@mui/material";

import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Hero } from "@/components/layout/Hero";

export const ErrorPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/temple-burn.jpg)",
          backgroundSize: "cover",
        }}
        text="Error"
      />
      <Container component="main">
        <ErrorAlert />
      </Container>
    </>
  );
};
