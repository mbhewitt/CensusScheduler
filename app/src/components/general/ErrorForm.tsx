import { Alert, List, ListItem } from "@mui/material";
import { FieldErrors } from "react-hook-form";

import type { IVolunteerAccountFormValues } from "src/components/types";

interface IErrorFormProps {
  errors: FieldErrors<IVolunteerAccountFormValues>;
}

export const ErrorForm = ({ errors }: IErrorFormProps) => {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      Whoops! Looks like there are some input errors:
      <List sx={{ pl: 2, listStyleType: "disc" }}>
        {Object.keys(errors).map((errorItem) => {
          return (
            <ListItem
              disablePadding
              key={errorItem}
              sx={{ display: "list-item", pl: 0 }}
            >
              {errors[errorItem as keyof IVolunteerAccountFormValues]?.message}
            </ListItem>
          );
        })}
      </List>
    </Alert>
  );
};
