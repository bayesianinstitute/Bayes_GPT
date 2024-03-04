import chat from "../helpers/chat.js";

export const modelType = async (req, res) => {
  const userId = req.body.userId;
  try {
    const modelType = await chat.getModelType(userId);

    res.status(200).json({
      status: 200,
      data: {
        modelType,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 500,
      message: err,
    });
  }
};

export const UpdateModelType= async (req, res) => {
    const userId = req.body.userId;
    const modelType = req.body.modelType;
    try {
      await chat.saveModelType(userId, modelType);
  
      res.status(200).json({
        status: 200,
        message: "Model type updated successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: 500,
        message: err,
      });
    }
  }
