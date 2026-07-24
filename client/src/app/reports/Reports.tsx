"use client";

import {
  DeleteSweep as DeleteSweepIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";

import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsPeersCoordinator,
} from "@/utils/checkIsRoleExist";

export const Reports = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList: roleListSession },
    },
  } = useContext(SessionContext);

  const isAdmin = checkIsAdmin(accountType, roleListSession);
  // PEERS #walkin: the New Volunteers mailing-list report is available to
  // Coordinators as well as admins (papabear 2026-07-24).
  const isCoordinator = checkIsPeersCoordinator(roleListSession);
  const canSeeAnyReport = isAdmin || isCoordinator;

  // state
  // ------------------------------------------------------------
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // handlers
  // ------------------------------------------------------------
  const handleClearMailingList = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/admin/new-volunteers-report", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to clear (HTTP ${res.status})`);
      }
      enqueueSnackbar(
        <SnackbarText>
          Mailing list <strong>cleared</strong>. New sign-ups will start
          accumulating again.
        </SnackbarText>,
        { variant: "success" }
      );
      setIsClearDialogOpen(false);
    } catch (error) {
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {error instanceof Error ? error.message : "Failed to clear"}
          </strong>
        </SnackbarText>,
        { persist: true, variant: "error" }
      );
    } finally {
      setIsClearing(false);
    }
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/dotted-seamless.avif)",
        }}
        text="Reports"
      />
      <Container component="main" sx={{ flex: 1 }}>
        <Card>
          <CardContent>
            {canSeeAnyReport ? (
              <>
                {/* PPP audit — admin/superadmin only */}
                {isAdmin && (
                  <>
                    <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                      PEERS Participation Points (PPP)
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Post-event audit export. One row per volunteer with their
                      contact info, shifts signed up for, shifts checked in for,
                      and total PPP earned for the shifts they completed
                      (checked in). Points are only credited for checked-in
                      shifts.
                    </Typography>
                    <Button
                      href="/api/admin/participation-report"
                      startIcon={<DownloadIcon />}
                      variant="contained"
                    >
                      Download PPP report (CSV)
                    </Button>
                    <Divider sx={{ my: 3 }} />
                  </>
                )}
                {/* New Volunteers mailing list — admins + coordinators */}
                <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                  New Volunteers for Mailing List
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Volunteers who signed up on the scheduler without coming
                  through a HIVE link. They stay on this list even after they
                  later complete training, so you don&rsquo;t lose anyone
                  between downloads — until someone clears it. Columns:
                  signed-up date, name, playa name, and email.
                </Typography>
                <Stack
                  alignItems={{ sm: "center" }}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={6}
                >
                  <Button
                    href="/api/admin/new-volunteers-report"
                    startIcon={<DownloadIcon />}
                    variant="contained"
                  >
                    New Volunteers for Mailing List (CSV)
                  </Button>
                  <Button
                    color="error"
                    onClick={() => setIsClearDialogOpen(true)}
                    startIcon={<DeleteSweepIcon />}
                    variant="outlined"
                  >
                    Clear Mailing List Report
                  </Button>
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary">
                There are no reports available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Clear-mailing-list confirmation */}
      <Dialog
        onClose={() => {
          if (!isClearing) setIsClearDialogOpen(false);
        }}
        open={isClearDialogOpen}
      >
        <DialogTitle>Clear Mailing List Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete all new volunteers from
            Mailing List?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isClearing}
            onClick={() => setIsClearDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            color="error"
            disabled={isClearing}
            onClick={handleClearMailingList}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
