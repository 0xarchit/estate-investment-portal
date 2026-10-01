import mongoose, { ClientSession, Types } from "mongoose";
import { User, IUser } from "@/lib/server/models/User";
import {
  Transaction,
  ITransaction,
  TransactionType,
  TransactionDirection,
} from "@/lib/server/models/Transaction";
import { ApiError } from "@/lib/server/errors";

export interface LedgerPostOptions {
  userId: string | Types.ObjectId;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number; // positive integer paise
  refType?: string;
  refId?: string;
  gatewayPaymentId?: string;
  note?: string;
  session?: ClientSession;
}

export const ledger = {
  async post(opts: LedgerPostOptions): Promise<ITransaction> {
    const {
      userId,
      type,
      direction,
      amount,
      refType,
      refId,
      gatewayPaymentId,
      note,
      session,
    } = opts;

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "Amount must be a positive integer in paise");
    }

    const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    let updatedUser: IUser | null = null;

    if (direction === "CREDIT") {
      updatedUser = await User.findByIdAndUpdate(
        userObjectId,
        { $inc: { walletBalance: amount } },
        { new: true, session }
      );
      if (!updatedUser) {
        throw new ApiError(404, "NOT_FOUND", "User not found for ledger credit");
      }
    } else if (direction === "DEBIT") {
      updatedUser = await User.findOneAndUpdate(
        {
          _id: userObjectId,
          walletBalance: { $gte: amount },
        },
        { $inc: { walletBalance: -amount } },
        { new: true, session }
      );

      if (!updatedUser) {
        const userExists = await User.findById(userObjectId).session(session || null);
        if (!userExists) {
          throw new ApiError(404, "NOT_FOUND", "User not found for ledger debit");
        }
        throw new ApiError(
          400,
          "INSUFFICIENT_BALANCE",
          "Insufficient wallet balance to complete transaction"
        );
      }
    } else {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid transaction direction");
    }

    const [tx] = await Transaction.create(
      [
        {
          userId: userObjectId,
          type,
          direction,
          amount,
          balanceAfter: updatedUser.walletBalance,
          refType,
          refId,
          gatewayPaymentId,
          note,
        },
      ],
      { session }
    );

    return tx;
  },

  async getBalance(userId: string | Types.ObjectId, session?: ClientSession): Promise<number> {
    const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const user = await User.findById(userObjectId).session(session || null);
    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }
    return user.walletBalance;
  },
};
