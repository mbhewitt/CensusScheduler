"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { SnackbarText } from "@/components/general/SnackbarText";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

interface IVolunteerCampInfoProps {
  shiftboardId: number;
}
interface ICampInfo {
  campName: string;
  campAddress: string;
  openCamping: boolean;
  location: string;
}

// PEERS Camp Info card (papabear 2026-07-26). Editable Camp Name / Camp
// Address / Open Camping / Landmark on the /info (account) page — the only
// in-app self-edit section, because these PEERS-only fields aren't in Burner
// Profile. Shares columns with the Create Account and Tablet Agreement forms.
export const VolunteerCampInfo = ({
  shiftboardId,
}: IVolunteerCampInfoProps) => {
  const { data, mutate } = useSWR<ICampInfo>(
    `/api/volunteers/${shiftboardId}/camp-info`,
    fetcherGet
  );
  const { trigger, isMutating } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/camp-info`,
    fetcherTrigger
  );
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<ICampInfo>({
    campName: "",
    campAddress: "",
    openCamping: false,
    location: "",
  });
  // Seed the form once the saved values load.
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    try {
      const result = await trigger({ body: form, method: "PATCH" });
      if (result?.statusCode && result.statusCode >= 400) {
        throw new Error(result.message ?? "Save failed.");
      }
      enqueueSnackbar(
        <SnackbarText>
          Camp info <strong>saved</strong>
        </SnackbarText>,
        { variant: "success" }
      );
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          { persist: true, variant: "error" }
        );
      }
    }
  };

  return (
    <>
      <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
        Camp Info
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your camp details, used for on-playa tablet accountability. These
            are PEERS-only fields (they aren&rsquo;t part of your Burner
            Profile), so update them here.
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Your Camp Name"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, campName: event.target.value }))
              }
              value={form.campName}
              variant="standard"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.openCamping}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      openCamping: event.target.checked,
                    }))
                  }
                />
              }
              label="I'm in Open Camping"
            />
            {form.openCamping && (
              <Typography variant="body1">
                We will collect your address when you check-in for your first
                shift!
              </Typography>
            )}
            <TextField
              fullWidth
              label="Your Camp Address"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  campAddress: event.target.value,
                }))
              }
              value={form.campAddress}
              variant="standard"
            />
            <TextField
              fullWidth
              label="Landmark or other relevant information to help find you (optional)"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
              value={form.location}
              variant="standard"
            />
            <Box>
              <Button
                disabled={isMutating}
                onClick={handleSave}
                variant="contained"
              >
                Save Camp Info
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};
