import { Alert } from "@mui/material";

export const ErrorAlert = () => {
  return (
    <Alert severity="error">
      Well this is awkward...seems like something went wrong on our end :(
      <br />
      Please try refreshing the page
    </Alert>
  );
};
