import { CssBaseline } from "@mui/material";
import {
  createTheme,
  darken,
  styled,
  ThemeProvider,
} from "@mui/material/styles";
import type { AppProps } from "next/app";
import localFont from "next/font/local";
import { SnackbarProvider } from "notistack";

import SnackbarButtonClose from "src/components/general/SnackbarButtonClose";
import { Layout } from "src/components/layout/Layout";
import { COLOR_BURNING_MAN_BROWN, COLOR_CENSUS_PINK } from "src/constants";
import { DeveloperModeProvider } from "src/state/developer-mode/context";
import { SessionProvider } from "src/state/session/context";

const rockwellFont = localFont({
  display: "swap",
  src: "../src/fonts/rockwell-regular.ttf",
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
        },
        "#__next": {
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          paddingTop: "64px",
        },
        a: {
          color: "inherit",
          textDecoration: "none",
          p: {
            textDecoration: "underline",
          },
        },
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
const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  // render
  // --------------------
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DeveloperModeProvider>
        <SessionProvider>
          <StyledSnackbarProvider action={SnackbarAction}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </StyledSnackbarProvider>
        </SessionProvider>
      </DeveloperModeProvider>
    </ThemeProvider>
  );
};

export default App;
