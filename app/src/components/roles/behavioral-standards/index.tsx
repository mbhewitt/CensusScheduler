import {
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
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
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IReqRoleBehavioralStandardsItem,
  IResRoleListItem,
} from "src/components/types/roles";
import {
  ROLE_BEHAVIORAL_STANDARDS_ID,
  SESSION_BEHAVIORAL_STANDARDS,
} from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { ensure } from "src/utils/ensure";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { signOut } from "src/utils/signOut";

export const BehavioralStandards = () => {
  // context
  // --------------------
  const {
    sessionDispatch,
    sessionState: {
      settings: { isAuthenticated },
      user: { playaName, worldName },
    },
  } = useContext(SessionContext);

  const { developerModeDispatch } = useContext(DeveloperModeContext);

  // state
  // --------------------
  const [isSigned, setIsSigned] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResRoleListItem;
    error: Error | undefined;
  } = useSWR(`/api/roles/${ROLE_BEHAVIORAL_STANDARDS_ID}`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/roles/behavioral-standards",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const router = useRouter();
  const { shiftboardId } = router.query;
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const handleDecline = async () => {
    try {
      const body: IReqRoleBehavioralStandardsItem = {
        isBehavioralStandardsSigned: false,
        shiftboardId: ensure(shiftboardId),
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}
            &quot;
          </strong>{" "}
          has declined the <strong>Behavioral Standards Agreement</strong>
        </SnackbarText>,
        {
          variant: "warning",
        }
      );
      signOut(
        developerModeDispatch,
        enqueueSnackbar,
        isAuthenticated,
        playaName,
        router,
        sessionDispatch,
        worldName
      );
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
  };
  const handleSign = async () => {
    try {
      const body: IReqRoleBehavioralStandardsItem = {
        isBehavioralStandardsSigned: true,
        shiftboardId: ensure(shiftboardId),
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      // update state
      sessionDispatch({
        payload: {
          id: ROLE_BEHAVIORAL_STANDARDS_ID,
          name: data.name,
        },
        type: SESSION_BEHAVIORAL_STANDARDS,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}
            &quot;
          </strong>{" "}
          has signed the <strong>Behavioral Standards Agreement</strong>
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      // route to volunteer account page
      router.push(`/volunteers/account/${shiftboardId}`);
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
  };

  // render
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="census camp at burning man"
            fill
            priority
            src="/home/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Behavioral Standards Agreement"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Stack alignItems="center" direction="row">
                <WarningIcon
                  color="secondary"
                  fontSize="large"
                  sx={{ mr: 1 }}
                />
                <Typography>
                  All members of the BRC Census volunteer team are asked to
                  review and digitally sign this document.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Purpose Statement
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Burning Man&apos;s culture honors and promotes freedom of
                expression, unless and until that expression harms others. Black
                Rock City is also a place where people test boundaries and
                explore their limits. All members of the BRC Census team are
                expected to navigate these inherent contradictions while doing
                their best to be respectful and thoughtful of the people who may
                be impacted by their actions.
              </Typography>
              <Typography>
                This document describes several different settings and
                situations, and provides general guidelines for expectations of
                behavior of all members of the BRC Census team. The first
                section outlines general guidelines that are applicable to any
                setting and any time. The second addresses specific situations
                which might arise in Black Rock City, and the third addresses
                expectations specific to volunteers when they are actively
                representing the BRC Census team. The fourth section discusses
                situations that may occur between members of the BRC Census
                team.
              </Typography>
              <Typography>
                Additional information is provided about potential outcomes if a
                report of concerning behavior is received, and about available
                resources for communicating with members of BRC Census
                leadership. It is expected that all members of the BRC Census
                team will review and sign this document prior to their first
                volunteer shift.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Methods and Expectations of Communication
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Members of BRC Census leadership are committed to being
                available to any member of the BRC Census team who wish to share
                feedback, thoughts, concerns, requests for assistance, or any
                other communication. As Black Rock City staff, these individuals
                have access to a wide range of resources available to them to
                help them to do their jobs and navigate difficult situations.
                They rely on their fellow team members to notify them of issues
                which could require these resources.
              </Typography>
              <Typography>
                Volunteer Coordinators, members of BRC Census management, and
                other key volunteers maintain (and regularly check) their
                Burning Man email addresses to enable communication in the
                off-season. The Census Management group alias
                census@burningman.org can always be used to bring issues to the
                attention of BRC Census leadership. (As of Feb 2023, the members
                of this group alias are Sonder-Census Manager and Captain
                Mew-Scheduling Coordinator. They are also reachable at
                sonder@burningman.org, mu@burningman.org) If direct
                communication with another member of BRC Census leadership is
                preferred, the group alias can be used to request contact
                information for someone else.
              </Typography>
              <Typography>
                On-playa, members of BRC Census leadership can be found at the
                Census Lab or reached via radio during daytime hours. Additional
                on-playa resources are made available by other teams, including
                peer mediators, private locations for conversations outside of
                Census Lab, etc.
              </Typography>
              <Typography>
                If a situation ever arises in which a member of the BRC Census
                team feels uncomfortable bringing an issue to the members of BRC
                Census leadership at large, they may ask to discuss the
                situation privately with the member of leadership with whom they
                feel most comfortable. That individual will be able to provide
                resources outside of BRC Census, such as the People and Ops team
                within Burning Man Project, so that an appropriate resolution
                can be found.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            General Expectations in any Setting
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                All people everywhere have a right to live. They have a right to
                feel safe, and a right to be treated as equals by the people
                around them. They have a right to communicate their needs and
                desires, and a right to be heard. It is the fervent hope of the
                members of BRC Census leadership that no member of our team
                disagrees with these sentiments.
              </Typography>
              <Typography>
                Acts or threats of violence or harassment at any time, toward
                any person, are inappropriate. So, too, are misuses of power or
                authority, such as any attempt at intimidation or exploitation.
                Sexual assault or unsolicited sexual contact of any kind,
                destruction or theft of property, or attempts thereof, are
                similarly inappropriate. Discrimination against any person based
                on any demographic factor is also inappropriate at any time and
                in any setting.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Expectations within Black Rock City
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Black Rock City is a setting that invites experimentation.
                Participants are encouraged to push their own boundaries and
                explore possibilities that would be impossible anywhere else.
                This is part of why people (including members of the BRC Census
                team!) expend so much effort to go to Black Rock City. However,
                it is important to remember that when we explore limits and
                boundaries, we often infringe on others in ways both foreseeable
                and unforeseeable.
              </Typography>
              <Typography>
                Pranks or jokes can cause more harm than expected or intended.
                Art can inspire strong and sudden emotions or feelings of
                offense or discomfort, sometimes intended by the artists and
                sometimes not. In these situations, members of the BRC Census
                team are expected to do their best to speak up for their own
                needs while also keeping the needs of others in mind.
              </Typography>
              <Typography>
                While exploring Black Rock City, it is our hope that all members
                of the BRC Census team will endeavor to behave with honesty,
                integrity, and empathy. It is hoped that our team members will
                create art, invent pranks, and speak out when something feels
                especially right or especially wrong. It is also our hope that
                they will listen when others speak out in kind. When necessary,
                it is expected that team members will engage in conversations,
                seek other perspectives, offer apologies, and consider modifying
                their behavior in the future.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Expectations When in a Census Lab Coat
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                In addition to the general expectations and the expectations in
                Black Rock City, there is an additional level of responsibility
                taken on by all BRC Census volunteers any time they are actively
                representing their team (e.g., wearing a BRC Census lab coat,
                BRC Census hoodie, etc.) When a person has a negative
                interaction with someone wearing Census regalia, there is a risk
                of long-lasting impacts for the entire team.
              </Typography>
              <Typography>
                Members of the BRC Census team regularly ask Black Rock City
                residents (including members of other Burning Man staff and
                volunteer departments) to participate in or enable our research,
                or to conduct outreach on our behalf. That data is critical to
                our team&apos;s overall reason for existing, and one of the best
                ways to encourage participation is by generating positive
                associations with the BRC Census team and its members. Whenever
                possible, BRC Census team members should keep this in mind and
                behave in a way that will make the people around them want to
                help us with our core project.
              </Typography>
              <Typography>
                It is important to note that there may be situations where some
                degree of conflict is unavoidable. Participants who are eager to
                get to their camps may be frustrated at the delay on Gate Road,
                and members of other staff departments may not understand the
                need for them to modify their processes to allow BRC Census to
                operate smoothly. Well-meaning individuals may have thoughts on
                how BRC Census could improve processes, and may express
                displeasure if those suggestions are not immediately adopted.
              </Typography>
              <Typography>
                In these situations, members of the BRC Census team are expected
                to remain polite and respectful at all times. They are also
                encouraged (when applicable) to remain firm about their
                intention to follow existing procedures according to the
                training and instruction they have received. In most cases, a
                Shift Lead or some other member of BRC Census leadership should
                be notified immediately so that they can take part in the
                conversation and take any appropriate action. Even if it is
                unnecessary or impossible to bring members of BRC Census
                leadership into the situation as it occurs, notification after
                the fact is critical so that any needed follow-up can occur.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Situations with Fellow Team Members
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Members of the BRC Census team are asked to help with a task
                that is nearly impossible: conducting careful, methodical,
                reliable science in the middle of a harsh environment during an
                unpredictable event. This can be inherently stressful. The work
                also attracts people from a wide variety of backgrounds,
                interests, personalities, cultures, etc. It is important that
                all members of the BRC Census team approach each other with
                respect, keeping in mind all of the expectations listed in
                earlier sections of this document.
              </Typography>
              <Typography>
                If a conflict between members of the BRC Census team occurs, it
                is expected that all team members will remain polite and
                respectful while interacting with one another. If the conflict
                could lead to an interruption in responsibilities, it is vitally
                important that team members request assistance from a Shift Lead
                or some other member of BRC Census leadership. (Even if no
                interruption of responsibilities is likely, this step is highly
                encouraged!)
              </Typography>
              <Typography>
                In some cases, the environment or situation may preclude
                immediate resolution to an issue between team members. In some
                cases BRC Census team members may be asked to hold off on
                further discussion or action until a safer and more appropriate
                setting can be arranged and all participants have had time for
                any necessary self-care. In these cases, team members may be
                asked to accept an alternate role, lane assignment, etc. so as
                to prevent recurrence or exacerbation of an issue during a
                shift.
              </Typography>
              <Typography>
                Even if it is unnecessary or impossible to bring members of BRC
                Census leadership into the situation as it occurs, notification
                after the fact is critical. The members of BRC Census leadership
                cannot address issues if they are not aware of them, and
                patterns of behavior cannot be identified unless each individual
                behavior is reported to the appropriate members of the team.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Potential Outcomes
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                If members of BRC Census leadership receive reports of behavior
                that violates any of the standards listed above, they may reach
                out to the parties involved in an attempt to learn more about
                the situation. Members of BRC Census leadership will, at all
                times, do their best to be fair and to let all parties be heard.
                This process may include requests for mediated conversations
                between individuals and/or assistance from other departments
                within Burning Man. If a situation involved members of another
                Burning Man department, reports may be provided to other
                department managers so that the situation can be addressed
                appropriately.
              </Typography>
              <Typography>
                At the conclusion of these discussions and inquiries, verbal or
                written warnings may be administered to one or more BRC Census
                volunteers. In some situations, failure to abide by these
                standards will result in a volunteer&apos;s removal from the BRC
                Census team, with or without prior warning. It is also possible
                that no additional action will be taken.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Acknowledgement
          </Typography>
          <Card>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSigned}
                    color="secondary"
                    onChange={() => setIsSigned((prev) => !prev)}
                  />
                }
                label="I understand that by clicking the checkbox and Sign button, I acknowledge that I have read this document, and will abide by these standards to the best of my abilities."
              />
            </CardContent>
            <CardActions
              sx={{
                justifyContent: "flex-end",
                pb: 2,
                pt: 0,
                pr: 2,
              }}
            >
              <Button
                disabled={isMutating}
                onClick={handleDecline}
                startIcon={
                  isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
                }
                type="button"
                variant="outlined"
              >
                Decline agreement
              </Button>
              <Button
                disabled={isMutating || !isSigned}
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
