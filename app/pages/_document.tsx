import { Head, Html, Main, NextScript } from "next/document";

const Document = () => {
  return (
    <Html lang="en">
      <Head>
        <link rel="apple-touch-icon" href="general/icon-192x192.png" />
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <meta name="theme-color" content="#ed008c" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
