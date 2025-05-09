"use client";

import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Hero } from "@/components/layout/Hero";
import { Year } from "@/app/dates/Year";

export const Dates = () => {
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
        text="Dates"
      />
      <Container component="main">
        {/* year */}
        <Box component="section">
          <Year />
        </Box>

        {/* date names */}
        <Box component="section">{/* <DateNames /> */}</Box>
      </Container>
    </>
  );
};
