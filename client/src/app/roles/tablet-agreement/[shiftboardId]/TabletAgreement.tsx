"use client";

import { Check as CheckIcon } from "@mui/icons-material";
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
import { useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import {
  GATE_OPEN_ISO,
  ROLE_TABLET_AGREEMENT_ID,
  SESSION_ROLE_ITEM_ADD,
} from "@/constants";
import { SessionContext } from "@/state/session/context";
import { ensure } from "@/utils/ensure";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

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
  const [isOpenCamping, setIsOpenCamping] = useState(false);
  const [landmark, setLandmark] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  // Pre-fill camp name / address / phone / open-camping / landmark from the
  // volunteer's saved account (captured at create-account) so nothing is typed
  // twice (papabear 2026-07-26). Fill once, only if still untouched.
  const { data: prefillData } = useSWR<{
    campName: string;
    campAddress: string;
    phone: string;
    isOpenCamping: boolean;
    location: string;
  }>(`/api/roles/tablet-agreement?shiftboardId=${shiftboardId}`, fetcherGet);
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !prefillData) return;
    prefilledRef.current = true;
    if (prefillData.campName) setCampName(prefillData.campName);
    if (prefillData.campAddress) setCampAddress(prefillData.campAddress);
    if (prefillData.phone) setPhone(prefillData.phone);
    if (prefillData.isOpenCamping) setIsOpenCamping(true);
    if (prefillData.location) setLandmark(prefillData.location);
  }, [prefillData]);

  // Gate-open logic (papabear 2026-07-26): before Gate open, an "I'm in Open
  // Camping" volunteer has no camp address yet, so we hide + waive the Camp
  // Address field. At/after Gate open the checkbox no longer hides it and the
  // address is required for everyone.
  const isAfterGate = new Date() >= new Date(GATE_OPEN_ISO);
  const showAddress = isAfterGate || !isOpenCamping;
  const addressRequired = showAddress;
  const canSign =
    isAgreed &&
    campName.trim() !== "" &&
    phone.trim() !== "" &&
    (!addressRequired || campAddress.trim() !== "");

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
          // when the address field is hidden (open camper before Gate) there is
          // no address yet — persist empty so it re-surfaces as "pending".
          campAddress: showAddress ? campAddress : "",
          phone,
          isOpenCamping,
          location: landmark,
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
              <Typography>
                In signing this document, I agree to return the PEERS recording
                tablet to my PEERS shift lead at the conclusion of my shift.
                Normal wear and tear is expected, and accidents happen, but I
                may be held financially responsible if the tablet is not
                returned at all.
              </Typography>
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
                  required
                  value={campName}
                  variant="standard"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isOpenCamping}
                      color="secondary"
                      onChange={() => setIsOpenCamping((prev) => !prev)}
                    />
                  }
                  label="I'm in Open Camping"
                />
                {showAddress && (
                  <TextField
                    fullWidth
                    helperText={
                      isOpenCamping
                        ? "Gate is open — open campers must now provide their camp address."
                        : undefined
                    }
                    label="Your Camp Address"
                    onChange={(e) => setCampAddress(e.target.value)}
                    required={addressRequired}
                    value={campAddress}
                    variant="standard"
                  />
                )}
                {!showAddress && (
                  <Typography color="text.secondary" variant="body2">
                    You&rsquo;ll add your camp address once Gate opens and you
                    arrive on playa.
                  </Typography>
                )}
                <TextField
                  fullWidth
                  label="Landmark or other relevant information to help find you (optional)"
                  onChange={(e) => setLandmark(e.target.value)}
                  value={landmark}
                  variant="standard"
                />
                <TextField
                  fullWidth
                  label="Your Phone Number"
                  onChange={(e) => setPhone(e.target.value)}
                  required
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
                disabled={isMutating || !canSign}
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
