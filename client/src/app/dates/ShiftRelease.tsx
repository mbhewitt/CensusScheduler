"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import { SnackbarText } from "@/components/general/SnackbarText";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

interface IRelease {
  announcedAt: string | null;
  embargoFrom: string;
  id: number;
  releaseAt: string;
}

// Shift release date (#869): shifts on or after "From" stay hidden from
// volunteers (admins still see them) until "Opens". Pacific time.
export const ShiftRelease = () => {
  const { data, mutate } = useSWR<IRelease[]>(
    "/api/shift-release",
    fetcherGet
  );
  const { enqueueSnackbar } = useSnackbar();
  const [embargoFrom, setEmbargoFrom] = useState("");
  const [releaseAt, setReleaseAt] = useState("");

  const send = async (method: string, body?: object, query = "") => {
    try {
      await fetcherTrigger(`/api/shift-release${query}`, {
        arg: { body, method },
      });
      mutate();
      return true;
    } catch (error) {
      enqueueSnackbar(
        <SnackbarText>
          <strong>{(error as Error).message}</strong>
        </SnackbarText>,
        { persist: true, variant: "error" }
      );
      return false;
    }
  };

  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography component="h2" variant="h6">
        Shift release
      </Typography>
      <Typography sx={{ mb: 2 }} variant="body2">
        Volunteers can&apos;t see or sign up for shifts on or after the first date
        until the release time (Pacific). Admins see them early. Meetings
        aren&apos;t affected. At release, an announcement goes to Discord and the
        mailing list.
      </Typography>
      {data?.map((r) => (
        <Stack alignItems="center" direction="row" gap={2} key={r.id}>
          <Typography>
            Shifts from <strong>{r.embargoFrom}</strong> open{" "}
            <strong>{r.releaseAt.slice(0, 16)}</strong>
            {r.announcedAt ? " (announced)" : ""}
          </Typography>
          <Button
            color="error"
            onClick={() => send("DELETE", undefined, `?id=${r.id}`)}
            size="small"
          >
            Remove
          </Button>
        </Stack>
      ))}
      <Stack direction="row" gap={2} sx={{ mt: 2 }}>
        <TextField
          label="Shifts from"
          onChange={(e) => setEmbargoFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          type="date"
          value={embargoFrom}
        />
        <TextField
          label="Open for sign-up at"
          onChange={(e) => setReleaseAt(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          type="datetime-local"
          value={releaseAt}
        />
        <Button
          disabled={!embargoFrom || !releaseAt}
          onClick={async () => {
            if (await send("POST", { embargoFrom, releaseAt })) {
              setEmbargoFrom("");
              setReleaseAt("");
            }
          }}
          variant="contained"
        >
          Add release
        </Button>
      </Stack>
    </Box>
  );
};
