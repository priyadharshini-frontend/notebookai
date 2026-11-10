export const getCurrentTime = {
  definition: {
    name: "get_current_time",
    description: "Get the current date and time. Use when the user asks about 'now', 'today', or deadlines.",
    input_schema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "IANA timezone, e.g. 'Asia/Kolkata'. Defaults to Asia/Kolkata.",
        },
      },
    },
  },
  async run({ timezone = "Asia/Kolkata" }) {
    return new Date().toLocaleString("en-IN", { timeZone: timezone, dateStyle: "full", timeStyle: "short" });
  },
};
