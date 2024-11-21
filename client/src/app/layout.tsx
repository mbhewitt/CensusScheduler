"use client";

import { CssBaseline } from "@mui/material";
import {
  createTheme,
  darken,
  styled,
  ThemeProvider,
} from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import localFont from "next/font/local";
import { SnackbarProvider } from "notistack";

import SnackbarButtonClose from "@/components/general/SnackbarButtonClose";
import { Layout } from "@/components/layout/Layout";
import { COLOR_BURNING_MAN_BROWN, COLOR_CENSUS_PINK } from "@/constants";
import { DeveloperModeProvider } from "@/state/developer-mode/context";
import { SessionProvider } from "@/state/session/context";

const rockwellFont = localFont({
  display: "swap",
  src: "./fonts/rockwell-regular.ttf",
});
const theme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
        },
        contained: ({ theme }) => ({
          background: theme.palette.secondary.main,
          "&:hover": {
            background: darken(theme.palette.secondary.main, 0.3),
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&:last-child": { paddingBottom: theme.spacing(2) },
          "> *:not(:last-child)": {
            marginBottom: theme.spacing(2),
          },
          // reports start
          a: {
            span: { color: COLOR_CENSUS_PINK, textDecoration: "underline" },
          },
          // reports end
        }),
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          flex: 1,
          "> *:not(:last-child)": {
            marginBottom: theme.spacing(3),
          },
        }),
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: {
          backgroundImage: "linear-gradient(#f7f2eb 0%, #bc9958 100%)",
        },
        body: {
          background: "url('/general/bg-the-man.png') no-repeat center 318px",
          backgroundSize: "110%",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          paddingTop: "64px",
        },
        // breadcrumbs start
        a: {
          color: "inherit",
          textDecoration: "none",
          p: {
            textDecoration: "underline",
          },
        },
        // breadcrumbs end
        p: {
          a: {
            color: COLOR_CENSUS_PINK,
            textDecoration: "underline",
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          justifyContent: "flex-end",
          padding: `${theme.spacing(2)} 0 0`,
        }),
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          ul: {
            display: "inline-block",
            li: {
              a: {
                color: COLOR_CENSUS_PINK,
                textDecoration: "underline",
                span: {
                  color: COLOR_CENSUS_PINK,
                },
              },
            },
          },
          padding: `0 ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(
            2
          )}`,
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({ padding: theme.spacing(2) }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          a: {
            width: "100%",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            ".MuiListItemIcon-root": {
              color: COLOR_CENSUS_PINK,
            },
            ".MuiTypography-root": {
              color: COLOR_CENSUS_PINK,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          minWidth: "auto",
          paddingRight: theme.spacing(2),
        }),
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.primary.main,
        }),
      },
    },
  },
  palette: {
    primary: {
      main: COLOR_BURNING_MAN_BROWN,
    },
    secondary: {
      main: COLOR_CENSUS_PINK,
    },
  },
  typography: {
    h1: { fontFamily: rockwellFont.style.fontFamily },
    h2: { fontFamily: rockwellFont.style.fontFamily },
    h3: { fontFamily: rockwellFont.style.fontFamily },
    h4: { fontFamily: rockwellFont.style.fontFamily },
    h5: { fontFamily: rockwellFont.style.fontFamily },
    h6: { fontFamily: rockwellFont.style.fontFamily },
  },
});
const StyledSnackbarProvider = styled(SnackbarProvider)`
  &.SnackbarContent-root {
    flex-wrap: nowrap;
  }
`;
const SnackbarAction = (snackbarKey: number | string) => (
  <SnackbarButtonClose snackbarKey={snackbarKey} />
);
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  // render
  // --------------------
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <DeveloperModeProvider>
              <SessionProvider>
                <StyledSnackbarProvider action={SnackbarAction}>
                  <Layout>{children}</Layout>
                </StyledSnackbarProvider>
              </SessionProvider>
            </DeveloperModeProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
};

export default RootLayout;
