import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Optional now for OAuth users
  newsletterOptIn: boolean;
  lastNewsletterSent?: Date;
  
  // GitHub OAuth fields
  githubId?: string;
  githubUsername?: string;
  avatarUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: false, // Not required for OAuth users
      minlength: 6,
    },
    newsletterOptIn: {
      type: Boolean,
      default: false,
    },
    lastNewsletterSent: {
      type: Date,
    },
    // GitHub OAuth fields
    githubId: {
      type: String,
      sparse: true,
      unique: true,
    },
    githubUsername: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if password exists)
UserSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);