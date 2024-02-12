import { Close as CloseIcon } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import { ReactNode } from "react";

interface IDialogContainerProps {
  children: ReactNode;
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  text: string;
}

export const DialogContainer = ({
  children,
  handleDialogClose,
  isDialogOpen,
  text,
}: IDialogContainerProps) => {
  return (
    <Dialog fullWidth onClose={handleDialogClose} open={isDialogOpen}>
      <Stack
        alignItems="flex-start"
        justifyContent="space-between"
        direction="row"
      >
        <DialogTitle>{text}</DialogTitle>
        <IconButton onClick={handleDialogClose} sx={{ m: 1 }}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
