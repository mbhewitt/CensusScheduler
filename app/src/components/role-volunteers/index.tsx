import { Card, CardContent, Container, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { Hero } from "src/components/layout/Hero";
import { fetcherGet } from "src/utils/fetcher";

export const RoleVolunteers = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { roleName } = router.query;
  const { data, error } = useSWR(
    isMounted ? `/api/roles/${encodeURI(roleName as string)}` : null,
    fetcherGet
  );

  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  return (
    <>
      <Hero
        Image={
          <Image
            alt="temple burning"
            fill
            priority
            src="/reports/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text={roleName as string}
      />
      <Container component="main" sx={{ flex: 1 }}>
        <Card>
          <CardContent>
            <Typography>Role volunteer page</Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
