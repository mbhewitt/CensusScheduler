import { Box, Container, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface IHeroProps {
  imageStyles: { [key: string]: string };
  text: string;
}

export const Hero = ({ imageStyles, text }: IHeroProps) => {
  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();

  // render
  // ------------------------------------------------------------
  return (
    <Box
      sx={{
        ...imageStyles,
        backgroundPosition: "center",
        height: theme.spacing(30),
        mb: 3,
        position: "relative",
        width: 1,
      }}
    >
      <Box
        sx={{
          backgroundColor: "rgba(47,47,47,0.6)",
          bottom: 0,
          position: "absolute",
          width: 1,
          zIndex: 1,
        }}
      >
        <Container>
          <Typography
            component="h1"
            sx={{ color: theme.palette.common.white, py: 1 }}
            variant="h2"
          >
            {text}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
