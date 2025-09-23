import { errorWithData } from "../config/ApiResponse";
import { Request, Response } from "express";
import { CoinService } from "../services/coins.service";

const coinService = new CoinService()
export const getallCoins = async (req: Request, res: Response): Promise<any> => {
    try {

        const response = await coinService.getAllCoins(req.query.id as string, req.verifyUser)
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData('something went wrong', { error });
    }

}