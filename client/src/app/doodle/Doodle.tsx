"use client";

import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { CirclePicker } from "react-color";
import { io } from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "@/components/general/ErrorPage";
import { SnackbarText } from "@/components/general/SnackbarText";
import { IReqDoodle, IResDoodle } from "@/components/types/doodle";
import { COLOR_BURNING_MAN_BROWN, COLOR_CENSUS_PINK } from "@/constants";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

const socket = io();
export const Doodle = () => {
  // state
  // --------------------
  const [isFetched, setIsFetched] = useState(false);
  const [color, setColor] = useState(COLOR_BURNING_MAN_BROWN);
  const [isPointerDown, setIsPointerDown] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResDoodle;
    error: Error | undefined;
  } = useSWR(isFetched ? null : "/api/doodle", fetcherGet);
  const { trigger } = useSWRMutation("/api/doodle", fetcherTrigger);

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // side effects
  // --------------------
  const containerRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerValue = containerRef.current;
  const canvasValue = canvasRef.current;
  const canvasContext = canvasValue?.getContext("2d");

  const clearCanvas = () => {
    const canvasValue = canvasRef.current;
    const canvasContext = canvasValue?.getContext("2d");

    if (canvasValue && canvasContext) {
      canvasContext.clearRect(0, 0, canvasValue.width, canvasValue.height);
    }
  };

  useEffect(() => {
    if (canvasContext && data && !isFetched) {
      const imageNew = new Image();

      imageNew.src = data.imageUrl;
      imageNew.addEventListener("load", () => {
        canvasContext.drawImage(imageNew, 0, 0);
      });

      setIsFetched(true);
    }
  }, [canvasContext, data, isFetched]);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPointerPositionOnCanvas = (event: any) => {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      const { offsetLeft, offsetTop } = event.target;
      const canvasX = clientX - offsetLeft;
      const canvasY = clientY - offsetTop;

      return { x: canvasX, y: canvasY };
    };
    const handleDrawStart = (event: MouseEvent | TouchEvent) => {
      if (canvasContext) {
        event.preventDefault();

        canvasContext.lineCap = "round";
        canvasContext.lineJoin = "round";
        canvasContext.lineWidth = 10;
        canvasContext.strokeStyle = color;
        canvasContext.beginPath();

        setIsPointerDown(true);
      }
    };
    const handleDrawMove = (event: MouseEvent | TouchEvent) => {
      if (canvasContext) {
        event.preventDefault();

        if (isPointerDown) {
          const pointerPos = getPointerPositionOnCanvas(event);

          canvasContext.lineTo(pointerPos.x, pointerPos.y);
          canvasContext.stroke();
        }
      }
    };
    const handleDrawEnd = async (event: MouseEvent | TouchEvent) => {
      if (canvasValue) {
        event.preventDefault();

        setIsPointerDown(false);

        try {
          const body: IReqDoodle = { imageUrl: canvasValue.toDataURL() };

          // update database
          await trigger({ body, method: "PATCH" });
          // emit event
          socket.emit("req-draw-move", {
            imageUrl: canvasValue.toDataURL(),
          });
        } catch (error) {
          if (error instanceof Error) {
            enqueueSnackbar(
              <SnackbarText>
                <strong>{error.message}</strong>
              </SnackbarText>,
              {
                persist: true,
                variant: "error",
              }
            );
          }

          throw error;
        }
      }
    };

    // add event listeners
    if (canvasValue) {
      canvasValue.addEventListener("mousedown", handleDrawStart);
      canvasValue.addEventListener("mousemove", handleDrawMove);
      canvasValue.addEventListener("mouseup", handleDrawEnd);
      canvasValue.addEventListener("mouseout", handleDrawEnd);
      canvasValue.addEventListener("touchstart", handleDrawStart);
      canvasValue.addEventListener("touchmove", handleDrawMove);
      canvasValue.addEventListener("touchend", handleDrawEnd);
    }

    // clean up event listeners
    return () => {
      if (canvasValue) {
        canvasValue.removeEventListener("mousedown", handleDrawStart);
        canvasValue.removeEventListener("mousemove", handleDrawMove);
        canvasValue.removeEventListener("mouseup", handleDrawEnd);
        canvasValue.removeEventListener("mouseout", handleDrawEnd);
        canvasValue.removeEventListener("touchstart", handleDrawStart);
        canvasValue.removeEventListener("touchmove", handleDrawMove);
        canvasValue.removeEventListener("touchend", handleDrawEnd);
      }
    };
  }, [
    canvasContext,
    canvasValue,
    color,
    enqueueSnackbar,
    isPointerDown,
    trigger,
  ]);

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on("res-draw-move", ({ imageUrl: imageSocketUrl }) => {
          const canvas = canvasRef.current;
          const canvasContext = canvas?.getContext("2d");

          if (canvasContext) {
            const imageSocketNew = new Image();

            imageSocketNew.src = imageSocketUrl;
            imageSocketNew.onload = () => {
              canvasContext.drawImage(imageSocketNew, 0, 0);
            };
          }
        });
        socket.on("res-canvas-clear", clearCanvas);
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            {
              persist: true,
              variant: "error",
            }
          );
        }

        throw error;
      }
    })();
  }, [enqueueSnackbar]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;

  // render
  // --------------------
  const colorList = [
    COLOR_BURNING_MAN_BROWN,
    COLOR_CENSUS_PINK,
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  return (
    <>
      <Container
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          mt: 3,
        }}
      >
        <Box
          component="section"
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <Box ref={containerRef} sx={{ flex: 1, mb: 1 }}>
            <canvas
              height={containerValue ? containerValue.offsetHeight - 7 : 0} // remove vertical scrollbar
              ref={canvasRef}
              style={{
                background: theme.palette.common.white,
                borderRadius: "4px",
              }}
              width={containerValue ? containerValue.offsetWidth : 0}
            />
          </Box>
          <Card>
            <CardContent>
              <Stack
                alignItems="flex-end"
                direction="row"
                justifyContent="space-between"
              >
                <CirclePicker
                  color={color}
                  colors={colorList}
                  onChangeComplete={(event) => setColor(event.hex)}
                  width="420px"
                />
                <Button
                  onClick={async () => {
                    try {
                      const canvas = canvasRef.current;

                      if (canvas) {
                        const body: IReqDoodle = {
                          imageUrl: canvas.toDataURL(),
                        };

                        // update database
                        await trigger({ body, method: "PATCH" });
                        // emit event
                        socket.emit("req-canvas-clear");

                        clearCanvas();
                      }
                    } catch (error) {
                      if (error instanceof Error) {
                        enqueueSnackbar(
                          <SnackbarText>
                            <strong>{error.message}</strong>
                          </SnackbarText>,
                          {
                            persist: true,
                            variant: "error",
                          }
                        );
                      }

                      throw error;
                    }
                  }}
                  type="button"
                  startIcon={<DeleteIcon />}
                  variant="contained"
                >
                  Clear
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>

      <Backdrop sx={{ zIndex: theme.zIndex.drawer + 1 }} open={!isFetched}>
        <CircularProgress color="secondary" />
      </Backdrop>
    </>
  );
};
