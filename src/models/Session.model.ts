import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISession extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — MongoDB auto-deletes
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>("Session", SessionSchema);

export default Session;
