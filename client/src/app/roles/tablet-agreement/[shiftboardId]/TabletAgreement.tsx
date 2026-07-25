"use client";

import { Check as CheckIcon, Tablet as TabletIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import useSWRMutation from "swr/mutation";

import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import { ROLE_TABLET_AGREEMENT_ID, SESSION_ROLE_ITEM_ADD } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { ensure } from "@/utils/ensure";
import { fetcherTrigger } from "@/utils/fetcher";

interface ITabletAgreementProps {
  shiftboardId: string;
}

export const TabletAgreement = ({ shiftboardId }: ITabletAgreementProps) => {
  const {
    sessionDispatch,
    sessionState: {
      user: { playaName, worldName },
    },
  } = useContext(SessionContext);

  const [campName, setCampName] = useState("");
  const [campAddress, setCampAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  const { isMutating, trigger } = useSWRMutation(
    "/api/roles/tablet-agreement",
    fetcherTrigger
  );
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const handleSign = async () => {
    try {
      await trigger({
        body: {
          isSigned: true,
          shiftboardId: ensure(shiftboardId),
          campName,
          campAddress,
          phone,
        },
        method: "POST",
      });
      sessionDispatch({
        payload: { id: ROLE_TABLET_AGREEMENT_ID, name: "TabletAgreement" },
        type: SESSION_ROLE_ITEM_ADD,
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          has signed the <strong>Tablet Responsibility Agreement</strong>
        </SnackbarText>,
        { variant: "success" }
      );
      router.push(`/volunteers/${shiftboardId}/info`);
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
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/placement-hq.jpg)",
          backgroundPosition: "center 15%",
          backgroundSize: "cover",
        }}
        text="Tablet Responsibility Agreement"
      />
      <Container component="main">
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            PEERS Tablet Responsibility Agreement
          </Typography>
          <Card>
            <CardContent>
              <Stack alignItems="flex-start" direction="row">
                <TabletIcon color="secondary" fontSize="large" sx={{ mr: 1 }} />
                <Typography>
                  In signing this document, I agree to return the PEERS
                  recording tablet to my PEERS shift lead at the conclusion of
                  my shift. Normal wear and tear is expected, and accidents
                  happen, but I may be held financially responsible if the
                  tablet is not returned at all.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Your Camp Name"
                  onChange={(e) => setCampName(e.target.value)}
                  value={campName}
                  variant="standard"
                />
                <TextField
                  fullWidth
                  label="Your Camp Address"
                  onChange={(e) => setCampAddress(e.target.value)}
                  value={campAddress}
                  variant="standard"
                />
                <TextField
                  fullWidth
                  label="Your Phone Number"
                  onChange={(e) => setPhone(e.target.value)}
                  value={phone}
                  variant="standard"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAgreed}
                      color="secondary"
                      onChange={() => setIsAgreed((prev) => !prev)}
                    />
                  }
                  label="I have read the above and agree to be responsible for the PEERS tablet."
                />
              </Stack>
            </CardContent>
            <CardActions
              sx={{ justifyContent: "flex-end", pb: 2, pt: 0, pr: 2 }}
            >
              <Button
                disabled={isMutating || !isAgreed}
                onClick={handleSign}
                startIcon={
                  isMutating ? <CircularProgress size="1rem" /> : <CheckIcon />
                }
                type="button"
                variant="contained"
              >
                Sign agreement
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Container>
    </>
  );
};
