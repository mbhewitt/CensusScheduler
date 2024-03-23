import { Container } from "@mui/material";
import Image from "next/image";

import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Hero } from "src/components/layout/Hero";

export const ErrorPage = () => {
  // display
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers taming traffic"
            fill
            priority
            src="/error/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Error"
      />
      <Container component="main">
        <ErrorAlert />
      </Container>
    </>
  );
};
