export default {
  rules: {
    "no-dead-store": {
      meta: {
        type: "problem",
        docs: {
          description: "Stubbed sonarjs rule placeholder",
          recommended: false,
        },
        schema: [],
        messages: {
          default: "sonarjs/no-dead-store stub does not report issues in this environment.",
        },
      },
      create() {
        return {};
      },
    },
  },
};
