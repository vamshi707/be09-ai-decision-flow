import "dotenv/config";
import express from "express";
import cors from "cors";
import { serve } from "inngest/express";

import { inngest } from "./inngest.js";
import { executeWorkflow } from "./workflow.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [executeWorkflow],
  })
);

app.post("/api/workflow/start", async (req, res) => {
  try {
    const { nodes, edges, startNodeId } = req.body;

    const result = await inngest.send({
      name: "workflow/execute",
      data: {
        nodes,
        edges,
        startNodeId,
      },
    });

    res.json({
      message: "Workflow started",
      eventId: result.ids[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to start workflow",
    });
  }
});

app.listen(3000, () => {
  console.log(
    "Backend running on http://localhost:3000"
  );
});