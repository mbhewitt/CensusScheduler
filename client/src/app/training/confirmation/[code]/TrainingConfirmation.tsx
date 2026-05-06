"use client";

import { Check as CheckIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Hero } from "@/components/layout/Hero";

interface ITrainingConfirmationProps {
  code: number;
}

export const TrainingConfirmation = ({ code }: ITrainingConfirmationProps) => {
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
        text="Training confirmation"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Typography>
                Congratulations on completing the training course. Click on the
                confirm button to be taken to the shifts page.
              </Typography>
            </CardContent>
            <CardActions
              sx={{
                justifyContent: "flex-end",
                pb: 2,
                pt: 0,
                pr: 2,
              }}
            >
              <Button
                onClick={() => {
                  console.log("clicked");
                }}
                startIcon={<CheckIcon />}
                type="button"
                variant="contained"
              >
                Confirm
              </Button>
            </CardActions>
          </Card>
        </Box>
        <Box component={"section"}>
          <Typography component="h2" variant="h4">
            Dev only: your code is {code}
          </Typography>
        </Box>
      </Container>
    </>
  );
};
