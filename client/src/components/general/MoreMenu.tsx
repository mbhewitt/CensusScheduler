import { IconButton, Menu } from "@mui/material";
import { ReactElement, useState } from "react";

interface IMoreMenuProps {
  Icon: ReactElement;
  MenuList: ReactElement;
}

export const MoreMenu = ({ Icon, MenuList }: IMoreMenuProps) => {
  // state
  // ------------------------------------------------------------
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // logic
  // ------------------------------------------------------------
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <IconButton onClick={handleMenuOpen}>{Icon}</IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        // Don't lock body scroll on open — MUI's scrollbar-compensation
        // reflows the page to a tiny width on mobile (#493).
        disableScrollLock
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
