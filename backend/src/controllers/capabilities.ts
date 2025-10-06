import { RequestHandler } from "express";
import { prisma } from "../util/db";

export const getAllCapabilities: RequestHandler = async (req, res, next) => {
  try {
    const capabilities = await prisma.capability.findMany({
      orderBy: { name: "asc" }
    });

    res.status(200).json(capabilities);
  } catch (error) {
    next(error);
  }
};
