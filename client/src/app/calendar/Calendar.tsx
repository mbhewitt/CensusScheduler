"use client";

import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Hero } from "@/components/layout/Hero";
import { Year } from "@/app/calendar/Year";

export const Calendar = () => {
  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Calendar"
      />
      <Container component="main">
        {/* year */}
        <Box component="section">
          <Year />
        </Box>

        {/* dates */}
        <Box component="section">{/* <Dates /> */}</Box>
      </Container>
    </>
  );
};
