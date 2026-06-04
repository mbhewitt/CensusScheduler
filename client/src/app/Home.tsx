"use client";

import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import Link from "next/link";

import { Hero } from "@/components/layout/Hero";

export const Home = () => {
  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/camp-at-day.jpg)",
          backgroundSize: "cover",
        }}
        text="Home"
      />
      <Container component="main">
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Welcome!
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                <strong>PEERS</strong> — Placement&apos;s Exploration &amp;
                Engagement Research Squad — is a Placement volunteer team that
                celebrates theme camps and gathers neighborhood-level
                observations across Black Rock City. The name is deliberate:
                &quot;peer&quot; means &quot;of equal standing.&quot; Squaddies
                aren&apos;t inspectors — they&apos;re fellow citizens spending a
                few shifts spreading joy and listening to camp leads.
              </Typography>
              <Typography>
                Volunteers (known as <em>Squaddies</em>) visit every theme camp
                in pairs during 3-hour shifts, Monday through Friday, between
                8am and 10pm. Each visit has three jobs:{" "}
                <strong>celebrate</strong> the camp and the people who built it,
                <strong> listen</strong> to how their placement experience went,
                and <strong>observe</strong> the neighborhood — including a few
                photos. Tablet surveys keep the questions consistent; training
                is provided.
              </Typography>
              <Typography>
                What PEERS hears feeds straight back into Placement&apos;s camp
                files, helping the team assemble better neighborhoods year after
                year. Anything urgent gets escalated on-playa to Rangers, Camp
                Support, or Placement leadership. Anyone can volunteer — new
                Burners, veterans, camp organizers. We&apos;re looking for
                friendly, respectful, curious people who are willing to
                collaborate, stay objective, and have a good time doing it.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Learn more
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                To read more about the PEERS program — what we do, who we are,
                and how to get involved — visit the{" "}
                <a
                  href="https://burningman.org/black-rock-city/camps/placement-process/camp-resource-guide/peers/"
                  target="_blank"
                >
                  PEERS page on burningman.org
                </a>
                . Past Census Population Reports are still linked under the{" "}
                <Link href={{ pathname: "/reports" }}>Reports</Link> tab for
                background reading.
              </Typography>
              <Typography>
                Questions, comments, or want to volunteer? Reach the team at{" "}
                <a href="mailto:peers@burningman.org">peers@burningman.org</a>{" "}
                or use the{" "}
                <Link href={{ pathname: "/contact" }}>Contact</Link> form in
                the tablet menu.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
