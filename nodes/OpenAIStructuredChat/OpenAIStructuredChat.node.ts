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
          { name: "gpt-4", value: "gpt-4" },
          { name: "gpt-3.5-turbo-1106", value: "gpt-3.5-turbo-1106" },
        ],
        default: "gpt-4",
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
      const jsonSchema = this.getNodeParameter("jsonSchema", i) as object;
      const model = this.getNodeParameter("model", i) as string;

      const response = await openai.responses.create({
        model,
        input: [{ role: "user", content: prompt }],
        tools: [jsonSchema as Tool],
        text: {
          format: {
            type: "text",
          },
        },
        reasoning: {
          effort: "medium",
        },
        temperature: 0,
      });

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
