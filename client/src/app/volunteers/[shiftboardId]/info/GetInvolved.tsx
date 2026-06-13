import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { Box, Card, CardContent, Link, Stack, Typography } from "@mui/material";

// "Optional: Get more involved with Census" sidebar on the account/info page.
// Off-playa only (gated by the parent) — the links don't work on the offline
// on-playa tablets, and volunteers aren't signed into Discord/Google/Hive
// there anyway (#335). Plain link-cards, not checklist items: these are
// optional, open-ended ways to stay connected, not tasks with a done state.
// The Discord invite is a per-page invite that tracks joins on the Discord
// side, so no in-app tracking is needed.

interface IGetInvolvedItem {
  title: string;
  description: string;
  linkLabel: string;
  href: string;
}

const ITEMS: IGetInvolvedItem[] = [
  {
    title: "Join the Census Discord",
    description: "Connect with the Census community year-round.",
    linkLabel: "Join Discord",
    href: "https://discord.gg/FqDcF89Ktp",
  },
  {
    title: "Sign up as a DataNerd",
    description: "Help analyze and visualize Census data.",
    linkLabel: "Learn more",
    href: "https://groups.google.com/a/burningman.org/g/censusdatanerds",
  },
  {
    title: "Volunteer year-round",
    description: "Stay involved with Census beyond the event.",
    linkLabel: "Learn more",
    href: "https://groups.google.com/a/burningman.org/g/censusyearround",
  },
  {
    title: "Explore Census Hive",
    description: "Browse training resources, guides, and more.",
    linkLabel: "Visit Census Hive",
    href: "https://hive.burningman.org/spaces/14264554",
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
          Optional: Get more involved with Census
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Optional ways to stay connected with Census year-round.
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
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}
              >
                {item.linkLabel}
                <OpenInNewIcon fontSize="inherit" />
              </Link>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
