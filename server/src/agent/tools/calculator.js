import { evaluate } from "mathjs";

export const calculator = {
  definition: {
    name: "calculator",
    description:
      "Evaluate a math expression exactly, e.g. '(12.5 * 8) / 3'. Use this for ANY arithmetic instead of computing in your head.",
    input_schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "The math expression to evaluate" },
      },
      required: ["expression"],
    },
  },
  async run({ expression }) {
    return String(evaluate(expression));
  },
};
