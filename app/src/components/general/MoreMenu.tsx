import { IconButton, Menu } from "@mui/material";
import { ReactElement, useState } from "react";

interface IMoreMenuProps {
  Icon: ReactElement;
  MenuList: ReactElement;
}

export const MoreMenu = ({ Icon, MenuList }: IMoreMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleMenuOpen}>{Icon}</IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        elevation={2}
        onClick={handleMenuClose}
        onClose={handleMenuClose}
        open={Boolean(anchorEl)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {MenuList}
      </Menu>
    </>
  );
};
