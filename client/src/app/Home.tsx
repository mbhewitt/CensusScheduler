"use client";

import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import Link from "next/link";

import { Hero } from "@/components/layout/Hero";

export const Home = () => {
  // render
  // --------------------
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
                BRC Census is a collaborative research project started in 2002
                with the goal of learning more about the participants who make
                up Black Rock City. We conduct a random sample of Burners
                entering the event, then collect online survey responses after
                the Burn. We combine these two data sources to get more
                statistically accurate data about the people who attend Burning
                Man each year.
              </Typography>
              <Typography>
                Data from the BRC Census helps Burning Man Project represent the
                Burner community in conversations with local, state, and federal
                agencies and elected officials. It is also used to understand
                the impact we have on the environment. In alignment with Burning
                Man Project&apos;s Environmental Sustainability Roadmap, we want
                to reduce our carbon footprint and make the event more
                sustainable. In the last few years, Black Rock City Census has
                offered a way to track the year-to-year impact of concerns
                related to this issue by collecting data about transportation
                and the use of Burner Express bus service.
              </Typography>
              <Typography>
                Just as important is what BRC Census can learn from YOU and the
                gift of your data! This is your chance to have your presence in
                Black Rock City counted and to learn about our community. The
                Census is one of the primary ways Burning Man Project tracks
                changes in population, behavior, and attitudes of event
                participants, giving us all the ability to understand just a bit
                more about the city many of us call home. The more we understand
                the makeup of Black Rock City and the diverse Burning Man
                experiences it offers, the better equipped we are to meet the
                needs of the community and help Burning Man culture continue to
                flourish.
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
                To learn more, please visit our portal in the Burning Man
                Journal and the Census Results Archive for reports on past
                years&apos; Census data. The most recent report,{" "}
                <a href="/reports/2023/index.html" target="_blank">
                  Black Rock City Census 2023 Population Report
                </a>
                , is located under the{" "}
                <Link href={{ pathname: "/reports" }}>Reports</Link> tab in the
                menu of this tablet.
              </Typography>
              <Typography>
                If you have a question, comment, concern, or if you would like a
                reminder about filling out the Census online survey after the
                event, please fill out the{" "}
                <Link href={{ pathname: "/contact" }}>Contact</Link> form
                located in the tablet menu.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
