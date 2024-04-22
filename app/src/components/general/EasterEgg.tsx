import { Box } from "@mui/material";
import { useCallback, useContext, useEffect } from "react";
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSeaAnemonePreset } from "tsparticles-preset-sea-anemone";

import { EasterEggContext } from "src/state/easter-egg/context";

export const EasterEgg = () => {
  // context
  // --------------------
  const { setIsEasterEggOpen } = useContext(EasterEggContext);

  // side effects
  // --------------------
  useEffect(() => {
    const audio = new Audio("/general/darude-sandstorm.mp3");

    audio.play();
    audio.loop = true;

    return () => {
      audio.pause();
    };
  }, []);

  // logic
  // --------------------
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSeaAnemonePreset(engine);
  }, []);
  const options = {
    preset: "seaAnemone",
  };

  // render
  // --------------------
  return (
    <Box
      onClick={() => setIsEasterEggOpen(false)}
      sx={{ height: "100vh", width: 1 }}
    >
      <Particles init={particlesInit} options={options} />
    </Box>
  );
};
