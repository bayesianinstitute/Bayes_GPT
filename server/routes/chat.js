import { Router } from "express";
import dotnet from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import user from '../helpers/user.js';
import jwt from 'jsonwebtoken';
import chat from "../helpers/chat.js";
import { getChatId } from "../helpers/chat.js";

dotnet.config();

let router = Router();
let conversationMemory = {};
let chatId;
let conversation = {};

const CheckUser = async (req, res, next) => {
  jwt.verify(req.cookies?.userToken, process.env.JWT_PRIVATE_KEY, async (err, decoded) => {
    if (decoded) {
      let userData = null;

      try {
        userData = await user.checkUserFound(decoded);
      } catch (err) {
        if (err?.notExists) {
          res.clearCookie('userToken')
            .status(405).json({
              status: 405,
              message: err?.text
            });
        } else {
          res.status(500).json({
            status: 500,
            message: err
          });
        }
      } finally {
        if (userData) {
          req.body.userId = userData._id;
          next();
        }
      }
    } else {
      res.status(405).json({
        status: 405,
        message: 'Not Logged'
      });
    }
  });
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

router.get('/', (req, res) => {
  res.send("Welcome to chatGPT api v1");
});

router.post('/', CheckUser, async (req, res) => {
  const { prompt, userId } = req.body;
  chatId = getChatId();

  let response = {};
  console.log("chatId in router:", chatId);

  let conversation = conversationMemory[userId] || [
    { role: 'system', content: 'You are a helpful assistant.' },
  ];

  try {
    conversation.push({ role: 'user', content: prompt });

    response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversation,
    });

    if (response.data?.choices?.[0]?.message?.content) {
      let assistantReply = response.data.choices[0].message.content;
      let index = 0;
      for (let c of assistantReply) {
        if (index <= 1) {
          if (c === '\n') {
            assistantReply = assistantReply.slice(1);
          }
        } else {
          break;
        }
        index++;
      }
      response.openai = assistantReply;
      response.db = await chat.newResponse(prompt, response, userId);
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err,
    });
    return;
  }

  if (response.db && response.openai) {
    conversationMemory[userId] = conversation;

    res.status(200).json({
      status: 200,
      message: 'Success',
      data: {
        _id: response.db['chatId'],
        content: response.openai,
      },
    });
  } else {
    res.status(500).json({
      status: 500,
      message: 'Incomplete response',
    });
  }
});

router.put('/', CheckUser, async (req, res) => {
  const { prompt, userId, chatId } = req.body;
  console.log("chatId in router:", chatId);

  let response = {};

  let conversation = conversationMemory[userId] || [
    { role: 'system', content: 'You are a helpful assistant.' },
  ];

  try {
    conversation.push({ role: 'user', content: prompt });
    response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversation,
    });

    if (response.data?.choices?.[0]?.message?.content) {
      let assistantReply = response.data.choices[0].message.content;
      let index = 0;
      for (let c of assistantReply) {
        if (index <= 1) {
          if (c === '\n') {
            assistantReply = assistantReply.slice(1);
          }
        } else {
          break;
        }
        index++;
      }
      response.openai = assistantReply;
      response.db = await chat.updateChat(chatId, prompt, response, userId);
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err,
    });
    return;
  }

  if (response.db && response.openai) {
    conversationMemory[userId] = conversation;

    res.status(200).json({
      status: 200,
      message: 'Success',
      data: {
        content: response.openai,
      },
    });
  } else {
    res.status(500).json({
      status: 500,
      message: 'Incomplete response',
    });
  }
});

router.get('/saved', CheckUser, async (req, res) => {
  const { userId } = req.body;
  const { chatId = null } = req.query;

  let response = null;

  try {
    response = await chat.getChat(userId, chatId);
  } catch (err) {
    if (err?.status === 404) {
      res.status(404).json({
        status: 404,
        message: 'Not found',
      });
    } else {
      res.status(500).json({
        status: 500,
        message: err,
      });
    }
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: 'Success',
        data: response,
      });
    }
  }
});

router.get('/history', CheckUser, async (req, res) => {
  const { userId } = req.body;

  let response = null;

  try {
    response = await chat.getHistory(userId);
  } catch (err) {
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
});

router.delete('/all', CheckUser, async (req, res) => {
  const { userId } = req.body;

  let response = null;

  try {
    response = await chat.deleteAllChat(userId);
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err,
    });
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: 'Success',
      });
    }
  }
});

export default router;
