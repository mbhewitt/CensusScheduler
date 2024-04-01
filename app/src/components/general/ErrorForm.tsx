import { Alert, List, ListItem } from "@mui/material";

interface IErrorFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
}

export const ErrorForm = ({ errors }: IErrorFormProps) => {
  // display
  // --------------------
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      Whoops! Looks like there are some input errors:
      <List sx={{ pl: 2, listStyleType: "disc" }}>
        {Object.keys(errors).map((errorKey) => {
          return (
            <ListItem
              disablePadding
              key={errorKey}
              sx={{ display: "list-item", pl: 0 }}
            >
              {errors[errorKey]?.message}
            </ListItem>
          );
        })}
      </List>
    </Alert>
  );
};
