import { Configuration, OpenAIApi } from 'openai';

async function main() {
  // const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({ apiKey: "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" });
  const openai = new OpenAIApi(configuration);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "My name is Faizan ?",
  });
  console.log(response.data.choices[0].text);
}

main();