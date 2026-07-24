"use client";

import { Download as DownloadIcon } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { useContext } from "react";

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
                  Volunteers who created an account on the scheduler but have
                  not completed HIVE training yet (they don&rsquo;t hold the
                  Squaddie or Shift Lead role). Use it to add new sign-ups to a
                  mailing list. Columns: signed-up date, name, playa name, and
                  email.
                </Typography>
                <Button
                  href="/api/admin/new-volunteers-report"
                  startIcon={<DownloadIcon />}
                  variant="contained"
                >
                  New Volunteers for Mailing List (CSV)
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">
                There are no reports available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
