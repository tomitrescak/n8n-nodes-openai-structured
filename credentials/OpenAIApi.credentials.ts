import { ICredentialType, INodeProperties } from "n8n-workflow";

export class OpenAIApi implements ICredentialType {
  name = "openAIApi";
  displayName = "OpenAI API";
  documentationUrl = "https://platform.openai.com/docs/api-reference";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      default: "",
    },
  ];
}
