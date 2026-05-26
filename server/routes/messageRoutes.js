import { Router } from "express";
import { createMessage, getMessages, updateMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const messageRouter = Router();

messageRouter.get("/", protect, getMessages);
messageRouter.post("/", protect, createMessage);
messageRouter.patch("/:id", protect, updateMessage);

export default messageRouter;
