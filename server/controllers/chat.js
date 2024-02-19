import chat from "../helpers/chat.js";
import { sendErrorEmail } from "../mail/send.js";
import { ObjectId } from "mongodb";

import { openai } from "../utility/openAI.js";
import { createSendingErrorMessage,extractErrorDetails } from "../utility/errors.js";


import https from "https";
import fs from "fs";

let chatId;
let sendingError;

export const newChat = async (req, res) => {
  const { prompt, userId } = req.body;

  chatId = new ObjectId().toHexString();

  let response = {};

  let conversation = [
    {
      role: "assistant",
      content:
        " Your name is Bayes CHAT-AI.  Strictly follow the users instructions. Please Understand Query try to reply to it in Efficient Way.  You were created by Bayes Solution  .You Should able to translate in different Language if user ask.Give content in Mardown Format Only",
    },
  ];

  await chat.saveConversation(chatId, conversation);
  try {
    const modelType = await chat.getModelType(userId);

    if (modelType === "dall-e-3") {
      const response = await openai.images.generate({
        model: modelType,
        prompt: prompt,
      });
      if (response?.data) {
        let revisedPrompt = response.data[0].revised_prompt;
        let url = response.data[0].url;

        const timestamp = Date.now();
        const imagePath = `image-generation/${timestamp}.jpg`;

        const file = fs.createWriteStream(imagePath);
        const request = https.get(url, function (response) {
          response.pipe(file);
          file.on("finish", function () {
            file.close();
          });
        });

        response.openai = revisedPrompt;
        response.url = `${process.env.SITE_URL}:${process.env.PORT}/${imagePath}`;

        response.db = await chat.newResponse(prompt, response, userId, chatId);

        if (response.db && response.openai && response.url) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              _id: response.db["chatId"],
              content: response.openai,
              imageUrl: response.url,
            },
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Incomplete response",
          });
        }
      }
    } else {
      conversation.push({ role: "user", content: prompt });

      response = await openai.chat.completions.create({
        model: modelType,
        messages: conversation,
        temperature: 0.6,
      });

      if (response.choices[0]?.message?.content) {
        let assistantReply = response.choices[0]?.message?.content;

        response.openai = assistantReply;
        response.db = await chat.newResponse(prompt, response, userId, chatId);

        conversation.push({ role: "assistant", content: assistantReply });

        await chat.saveConversation(chatId, conversation);

        if (response.db && response.openai) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              _id: response.db["chatId"],
              content: response.openai,
            },
          });
        } else {
          sendingError = "Error in response chat" + err;

          // sendErrorEmail(sendingError);
          if (response.errorCode === 400) {
            res.status(400).json({
              status: 400,
              message:
                "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.",
            });
          } else {
            res.status(500).json({
              status: 500,
              message: "Incomplete response",
            });
          }
        }
      }
    }
  } catch (err) {
    const sendingError = createSendingErrorMessage(err);
    console.log(sendingError);

    const { number, errorText } = extractErrorDetails(err);

    if (number === 400) {
      return res.status(400).json({
        status: 400,
        message:
          errorText ||
          "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.",
      });
    }

    return res.status(500).json({
      status: 500,
      message: errorText || "Internal server error",
    });
  }
};

export const addChat = async (req, res) => {
  const { prompt, userId, chatId } = req.body;
  let response = {};

  try {
    const modelType = await chat.getModelType(userId);
    // const modelType = "dall-e-3";

    if (modelType === "dall-e-3") {
      const responseFromOpenAI = await openai.images.generate({
        model: modelType,
        prompt: prompt,
      });

      if (responseFromOpenAI?.data) {
        let revisedPrompt = responseFromOpenAI.data[0].revised_prompt;
        let url = responseFromOpenAI.data[0].url;

        const timestamp = Date.now();
        const imagePath = `image-generation/${timestamp}.jpg`;

        const file = fs.createWriteStream(imagePath);
        const request = https.get(url, function (response) {
          response.pipe(file);
          file.on("finish", function () {
            file.close();
          });
        });

        response.openai = revisedPrompt;
        response.url = `${process.env.SITE_URL}:${process.env.PORT}/${imagePath}`;

        response.db = await chat.updateChat(chatId, prompt, response, userId);

        if (response.db && response.openai && response.url) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              content: response.openai,
              imageUrl: response.url,
            },
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Incomplete response",
          });
        }
      } else {
        res.status(500).json({
          status: 500,
          message: "Incomplete response from OpenAI",
        });
      }
    } else {
      let conversation = await chat.getConversation(chatId);
      conversation.push({ role: "user", content: prompt });

      response = await openai.chat.completions.create({
        model: modelType,
        messages: conversation,
        temperature: 0.6,
      });

      if (response.choices[0]?.message?.content) {
        let assistantReply = response.choices[0]?.message?.content;
        response.openai = assistantReply;
        response.db = await chat.updateChat(chatId, prompt, response, userId);

        conversation.push({ role: "assistant", content: assistantReply });

        await chat.saveConversation(chatId, conversation);
      }

      if (response.db && response.openai) {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: {
            content: response.openai,
          },
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Incomplete response",
        });
      }
    }
  } catch (err) {
    const sendingError = createSendingErrorMessage(err);
    console.log(sendingError);

    const { number, errorText } = extractErrorDetails(err);

    if (number === 400) {
      return res.status(400).json({
        status: 400,
        message:
          errorText ||
          "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.",
      });
    }

    return res.status(500).json({
      status: 500,
      message: errorText || "Internal server error",
    });
  }
};

export const getChat= async (req, res) => {
    const { userId } = req.body;
    const { chatId = null } = req.query;
  
    let response = null;
  
    try {
      response = await chat.getChat(userId, chatId);
    } catch (err) {
      if (err?.status === 404) {
        res.status(404).json({
          status: 404,
          message: "Not found",
        });
      } else {
        sendingError = "Error in getChat : ${err}";
        sendErrorEmail(sendingError);
        res.status(500).json({
          status: 500,
          message: err,
        });
      }
    } finally {
      if (response) {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: response,
        });
      }
    }
  }

export const getHistory= async (req, res) => {
    const { userId } = req.body;
  
    let response = null;
  
    try {
      response = await chat.getHistory(userId);
    } catch (err) {
      sendingError = "Error in getting history " + err;
      sendErrorEmail(sendingError);
      res.status(500).json({
        status: 500,
        message: err,
      });
    } finally {
      if (response) {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: response,
        });
      }
    }
  }

export const deleteAllChat=async (req, res) => {
  const { userId } = req.body;

  let response = null;

  try {
    response = await chat.deleteAllChat(userId);
  } catch (err) {
    sendingError = "Error in deleting chat" + err;
    sendErrorEmail(sendingError);

    res.status(500).json({
      status: 500,
      message: err,
    });
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: "Success",
      });
    }
  }
}

export const deleteChat= async (req, res) => {
    const { chatId } = req.params;
    const userId = req.body.userId;
  
    try {
      if (!chatId) {
        return res.status(400).json({ error: "Invalid or missing chat ID." });
      }
      const result = await chat.deleteChat(userId, chatId);
  
      if (!result) {
        return res.status(404).json({ error: "Chat not found." });
      }
  
      res.status(200).json({ message: "Chat deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }