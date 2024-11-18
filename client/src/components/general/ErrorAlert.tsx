import { Alert } from "@mui/material";

export const ErrorAlert = () => {
  // render
  // --------------------
  return (
    <Alert severity="error">
      Well this is awkward...seems like something went wrong on our end :&#40;
      <br />
      Please try refreshing the page
    </Alert>
  );
};
