import { Configuration, OpenAIApi } from 'openai'

// Define conversation messages outside the function
let conversation = [
  { role: 'system', content: 'You are a helpful assistant.' },
];

const configuration = new Configuration({
  apiKey: "syour-key",
});
const openai = new OpenAIApi(configuration);

function chatWithAssistant(userInput) {
  // Add user input to the conversation
  conversation.push({ role: 'user', content: userInput });

  const chatCompletion = openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: conversation,
  });

  chatCompletion.then((response) => {
    // Retrieve assistant's reply
    const reply = response.data.choices[0].message;
    console.log(reply);

    // Add assistant's reply to the conversation
    conversation.push({ role: 'assistant', content: reply });

    // Remove the user's input from the conversation if desired
    // conversation.splice(conversation.length - 2, 1);
  }).catch((error) => {
    console.error(error);
  });
}

// Example usage
const userInput1 = "my name is faijan";
chatWithAssistant(userInput1);

const userInput2 = "What is my name?";
chatWithAssistant(userInput2);

const userInput3 = "my friend's name is faraz";
chatWithAssistant(userInput3);

const userInput4 = "What are my name and my friend's name?";
chatWithAssistant(userInput4);
