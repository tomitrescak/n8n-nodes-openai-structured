import { OpenAIApi } from "./nodes/OpenAIStructuredChat/OpenAIStructuredChat.credentials";
import { OpenAIStructuredChat } from "./nodes/OpenAIStructuredChat/OpenAIStructuredChat.node";

export const nodes = [OpenAIStructuredChat];

export const credentials = [OpenAIApi];
