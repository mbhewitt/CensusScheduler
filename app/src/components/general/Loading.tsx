import { CircularProgress, Container } from "@mui/material";

export const Loading = () => {
  // render
  // --------------------
  return (
    <Container
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <CircularProgress color="secondary" />
    </Container>
  );
};
