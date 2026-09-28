import OpenAI from "openai";
import { inngest } from "./inngest.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-ai-decision-workflow",
    triggers: {
      event: "workflow/execute",
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const { nodes, edges, startNodeId } = event.data;

    let currentNodeId = startNodeId;
    const executionOrder = [];

    while (currentNodeId) {
      const node = nodes.find(
        (item) => item.id === currentNodeId
      );

      if (!node) {
        throw new Error(
          `Node ${currentNodeId} was not found`
        );
      }

      const result = await step.run(
        `decision-${currentNodeId}`,
        async () => {
          const response = await openai.responses.create({
           model: "openrouter/free",
            input: [
              {
                role: "system",
                content:
                  "You are an AI workflow decision engine. Return ONLY YES or NO.",
              },
              {
                role: "user",
                content: node.data.prompt,
              },
            ],
          });

          const answer = response.output_text
            .trim()
            .toUpperCase();

          if (answer !== "YES" && answer !== "NO") {
            throw new Error(
              `Invalid AI response: ${answer}`
            );
          }

          return {
            answer,
            nodeId: currentNodeId,
            prompt: node.data.prompt,
          };
        }
      );

      executionOrder.push(result);

      const nextEdge = edges.find(
        (edge) =>
          edge.source === currentNodeId &&
          edge.label === result.answer
      );

      if (!nextEdge) {
        currentNodeId = null;
      } else {
        currentNodeId = nextEdge.target;
      }
    }

    return {
      status: "completed",
      executionOrder,
    };
  }
);