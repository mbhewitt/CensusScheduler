import { Container, Typography } from "@mui/material";
import { useEffect } from "react";

// The super-admin nav's "Planning" item. Nav links are client-side <Link>s,
// which can't point at an API route, so this page hands over to it.
const Planning = () => {
  useEffect(() => {
    window.location.replace("/api/planning-handoff");
  }, []);
  return (
    <Container sx={{ py: 4 }}>
      <Typography>Opening planning…</Typography>
    </Container>
  );
};

export default Planning;
