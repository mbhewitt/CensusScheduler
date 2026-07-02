import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { Box, Card, CardContent, Link, Stack, Typography } from "@mui/material";

// "Optional: Get more involved with PEERS" sidebar on the account/info page.
// Off-playa only (gated by the parent) — the links don't work on the offline
// on-playa tablets, and volunteers aren't signed in there anyway (#335).
// Plain link-cards, not checklist items: these are optional, open-ended ways
// to explore PEERS and camp resources, not tasks with a done state.

interface IGetInvolvedLink {
  label: string;
  href: string;
}

interface IGetInvolvedItem {
  title: string;
  description: string;
  links: IGetInvolvedLink[];
}

// TODO(peers): "Take Fun with Fulcrum" link is pending a URL from the PEERS
// team (papabear, 2026-07-01) — add it to the links array below once supplied.
const ITEMS: IGetInvolvedItem[] = [
  {
    title: "Explore PEERS & camp resources",
    description: "Browse training resources, guides, and more.",
    links: [
      {
        label: "Camp Resource Guide",
        href: "https://burningman.org/black-rock-city/camps/placement-process/camp-resource-guide/",
      },
      {
        label: "The Placement Process",
        href: "https://burningman.org/black-rock-city/camps/placement-process/",
      },
    ],
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
          Optional: Get more involved with PEERS
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Optional ways to stay connected with PEERS year-round.
        </Typography>

        <Stack spacing={2}>
          {ITEMS.map((item) => (
            <Box key={item.title}>
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
              <Stack spacing={0.5}>
                {item.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      alignItems: "center",
                      display: "inline-flex",
                      gap: 0.5,
                    }}
                  >
                    {link.label}
                    <OpenInNewIcon fontSize="inherit" />
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
