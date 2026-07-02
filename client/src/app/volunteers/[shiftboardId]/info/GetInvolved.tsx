import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { Box, Card, CardContent, Link, Stack, Typography } from "@mui/material";

// "Optional: Get more involved with PEERS" sidebar on the account/info page.
// Off-playa only (gated by the parent) — the links don't work on the offline
// on-playa tablets, and volunteers aren't signed in there anyway (#335).
// Plain link-cards, not checklist items: these are optional, open-ended ways
// to explore PEERS and camp resources, not tasks with a done state.

interface IGetInvolvedLink {
  label: string;
  // Optional: when absent, the label renders as plain (non-clickable) text —
  // used for entries whose URL isn't available yet (see Fun with Fulcrum).
  href?: string;
}

interface IGetInvolvedItem {
  title: string;
  description: string;
  links: IGetInvolvedLink[];
}

// TODO(peers): "Take Fun with Fulcrum" is shown as a placeholder (no href →
// renders as plain text) pending a URL from the PEERS team (papabear,
// 2026-07-01). Add the href below once supplied to make it a live link.
const ITEMS: IGetInvolvedItem[] = [
  {
    title: "Explore PEERS & camp resources",
    description: "Browse training resources, guides, and more.",
    links: [
      {
        label: "Take Fun with Fulcrum",
      },
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
                {item.links.map((link) =>
                  link.href ? (
                    <Link
                      key={link.label}
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
                  ) : (
                    // Placeholder entry: URL not available yet, show as plain
                    // text so nothing links to a dead "#".
                    <Typography
                      key={link.label}
                      color="text.secondary"
                      variant="body2"
                    >
                      {link.label}
                    </Typography>
                  )
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
