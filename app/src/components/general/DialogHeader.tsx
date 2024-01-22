import { Close as CloseIcon } from "@mui/icons-material";
import { DialogTitle, IconButton, Stack } from "@mui/material";

interface IDialogHeaderProps {
  handleDialogClose: () => void;
  text: string;
}

export const DialogHeader = ({
  handleDialogClose,
  text,
}: IDialogHeaderProps) => {
  return (
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
  );
};
