import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import { OfflineLink } from "@/components/general/OfflineLink";

// "Optional: Get more involved with Census" sidebar on the account/info page.
// Plain link-cards, not checklist items: these are optional, open-ended ways
// to stay connected, not tasks with a done state. The Discord invite is a
// per-page invite that tracks joins on the Discord side, so no in-app
// tracking is needed.
//
// #643: these links are dead on the offline on-playa tablets. Rather than
// hide the section there (its previous behavior), OfflineLink turns each into
// an "email this to me" action so volunteers can follow up from home.

interface IGetInvolvedItem {
  title: string;
  description: string;
  linkLabel: string;
  href: string;
}

// Order per Chipper 2026-07-05: Hive first, Discord last.
const ITEMS: IGetInvolvedItem[] = [
  {
    title: "Explore the Census Community on Hive",
    description:
      "The Census community on Burning Man Hive is a great place to dive into the BRC Census pool. Volunteer training is conducted on Hive, and there’s tonnes to learn about our various volunteer opportunities while you’re there. Log in using your Burner Profile ID and password.",
    linkLabel: "Visit the Census Community on Hive",
    href: "https://hive.burningman.org/spaces/14264554",
  },
  {
    title: "Sign up as a DataNerd",
    description:
      "Want to get nerdy with us to crunch some data? Sign up for our Data Nerds Google Group to be a part of our data analysis efforts. No experience necessary to join.",
    linkLabel: "Learn more",
    href: "https://groups.google.com/a/burningman.org/g/censusdatanerds",
  },
  {
    title: "Volunteer year-round",
    description:
      "If you’d like to learn more about what we do and take part in the discussions that guide Census and propel us forward on our mission, you’re very welcome to join our year-round Google Groups mailing list.",
    linkLabel: "Learn more",
    href: "https://groups.google.com/a/burningman.org/g/censusyearround",
  },
  {
    title: "Join the Census Discord",
    description:
      "Connect with the Census community to see what we’re up to all year long.",
    linkLabel: "Join Discord",
    href: "https://discord.gg/BAzSsh4P9g",
  },
];

export const GetInvolved = () => {
  return (
    <Card sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
      <CardContent>
        <Typography
          component="h2"
          variant="overline"
          sx={{ color: "text.secondary", fontWeight: 700, lineHeight: 1.4 }}
        >
          Get more involved with Census
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Ways to stay connected with Census year-round.
        </Typography>

        <Stack spacing={2}>
          {ITEMS.map((item) => (
            <Box key={item.href}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {item.title}
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ mb: 0.5 }}
              >
                {item.description}
              </Typography>
              <OfflineLink
                asMuiLink
                href={item.href}
                label={item.linkLabel}
                sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
