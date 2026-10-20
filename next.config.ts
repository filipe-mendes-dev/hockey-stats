import createNextIntlPlugin from "next-intl/plugin";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      "./src/messages/en.json",
      "./src/messages/pt-PT.json",
    ],
  },
});

export default withSerwist(
  withNextIntl({
    experimental: {
      optimizePackageImports: [
        "@mantine/core",
        "@mantine/hooks",
        "lucide-react",
      ],
    },
    async headers() {
      return [
        {
          source: "/favicon.ico",
          headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
        },
        {
          source: "/serwist/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
            { key: "Service-Worker-Allowed", value: "/" },
          ],
        },
      ];
    },
  }),
);
