import dotnet from 'dotenv'
dotnet.config()
import { Configuration, OpenAIApi } from 'openai'

// Define conversation messages outside the function
let conversation = [
  { role: 'system', content: 'You are a helpful assistant.' },
];
let key = process.env.OPENAI_API_KEY

const openai = new Configuration({
  apiKey: key,
});
console.log(openai)
async function main() {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What’s in this image?" },
          {
            type: "image_url",
            image_url:
              "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
          },
        ],
      },
    ],
  });
  console.log(response.choices[0]);
}
main();