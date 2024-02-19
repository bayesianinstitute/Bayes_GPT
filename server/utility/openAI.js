import OpenAI from "openai";
import dotnet from "dotenv";

dotnet.config();

export const openai = new OpenAI({
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
  });