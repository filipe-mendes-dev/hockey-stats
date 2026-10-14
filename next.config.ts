import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      "./src/messages/en.json",
      "./src/messages/pt-PT.json",
    ],
  },
});

export default withNextIntl({});
