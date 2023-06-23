import { Configuration, OpenAIApi } from 'openai'


// Define conversation messages outside the function
let conversation = [
  { role: 'system', content: 'You are a helpful assistant.' },
];



async function chatWithAssistant(userInput) {
  const configuration = new Configuration({
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);

  // Add user input to the conversation
  conversation.push({ role: 'user', content: userInput });

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: conversation,
  });

  // Retrieve assistant's reply
  const reply = chatCompletion.data.choices[0].message;
  console.log(reply);

  // Add assistant's reply to the conversation
  conversation.push({ role: 'assistant', content: reply });

  // Remove the user's input from the conversation if desired
  // conversation.splice(conversation.length - 2, 1);
}

// Example usage
const userInput1 = "my name is faijan";
chatWithAssistant(userInput1);

const userInput2 = "What is my name?";
chatWithAssistant(userInput2);


const userInput3 = "my friend name is faraz";
chatWithAssistant(userInput3);

const userInput4 = "What is my and my friend name?";
chatWithAssistant(userInput4);