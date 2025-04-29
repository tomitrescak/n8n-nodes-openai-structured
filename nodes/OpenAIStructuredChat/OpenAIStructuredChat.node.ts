import {
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from "n8n-workflow";

import OpenAI from "openai";
import type {
  ResponseFunctionToolCall,
  Tool,
} from "openai/resources/responses/responses";

export class OpenAIStructuredChat implements INodeType {
  description: INodeTypeDescription = {
    displayName: "OpenAI Structured Chat",
    name: "openAIStructuredChat",
    group: ["transform"],
    version: 1,
    description:
      "Chat with OpenAI enforcing structured JSON outputs using function calling.",
    defaults: {
      name: "OpenAIStructuredChat",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "openAIApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        default: "",
        description: "The user prompt to send to OpenAI.",
      },
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        default: "1",
        description: "Randomness level (0 = fixed, > 0 = random).",
      },
      {
        displayName: "JSON Function Schema",
        name: "jsonSchema",
        type: "json",
        default: "{}",
        description: "Define the expected JSON structure for the output.",
      },
      {
        displayName: "Model",
        name: "model",
        type: "options",
        options: [
          { name: "o1", value: "o1" },
          { name: "o3-mini", value: "o3-mini" },
          { name: "o4-mini", value: "o-4-mini" },
          { name: "gpt-4", value: "gpt-4" },
          { name: "gpt-4o", value: "gpt-4o" },
          { name: "gpt-4o-mini", value: "gpt-4o-mini" },
          { name: "gpt-4.1", value: "gpt-4.1" },
          { name: "gpt-4.1-mini", value: "gpt-4.1-mini" },
        ],
        default: "gpt-4o-mini",
        description: "Model to use. Must support function calling.",
      },
      {
        displayName: "Reasoning Effort",
        name: "effort",
        type: "options",
        options: [
          { name: "low", value: "low" },
          { name: "medium", value: "medium" },
        ],
        default: "medium",
        description: "Reasoning Effort.",
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    const credentials = (await this.getCredentials("openAIApi")) as {
      apiKey: string;
    };

    const openai = new OpenAI({
      apiKey: credentials.apiKey,
    });

    for (let i = 0; i < items.length; i++) {
      const prompt = this.getNodeParameter("prompt", i) as string;
      const jsonSchema = this.getNodeParameter("jsonSchema", i) as string;
      const model = this.getNodeParameter("model", i) as string;
      const temperature = parseInt(
        this.getNodeParameter("temperature", i) as string
      );

      const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model,
        input: [{ role: "user", content: prompt }],
        tools: [JSON.parse(jsonSchema) as Tool],
        text: {
          format: {
            type: "text",
          },
        },

        temperature: temperature,
      };

      if (model.startsWith("o")) {
        body.reasoning = {
          effort: "medium",
        };
      }

      const response = await openai.responses.create(body);

      const output: ResponseFunctionToolCall | null = response.output.find(
        (o) => o.status === "completed"
      ) as ResponseFunctionToolCall;
      if (!output) {
        throw new Error("No valid response from OpenAI");
      }
      const argumentsString = output.arguments;
      const structuredData = JSON.parse(argumentsString);

      returnData.push({
        json: structuredData,
      });
    }

    return this.prepareOutputData(returnData);
  }
}
