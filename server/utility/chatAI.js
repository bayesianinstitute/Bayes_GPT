import OpenAI from "openai";
import dotnet from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotnet.config();

// OpenAI configuration
export const openai = new OpenAI({
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
  });


// Gemini configuration

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const  genAIModel = genAI.getGenerativeModel({ model: "gemini-pro" });