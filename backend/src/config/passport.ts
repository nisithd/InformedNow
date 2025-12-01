import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/User";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback", // Relative URL - works with proxy
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user already exists with this GitHub ID
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // User exists, update their info
          user.githubUsername = profile.username;
          user.avatarUrl = profile.photos?.[0]?.value;
          await user.save();
          return done(null, user);
        }

        // Extract email from GitHub profile
        const email = profile.emails?.[0]?.value || `${profile.username}@github.oauth`;
        
        // Check if user exists with this email (linking accounts)
        user = await User.findOne({ email });

        if (user) {
          // Link GitHub to existing account
          user.githubId = profile.id;
          user.githubUsername = profile.username;
          user.avatarUrl = profile.photos?.[0]?.value;
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          username: profile.username,
          email: email,
          githubId: profile.id,
          githubUsername: profile.username,
          avatarUrl: profile.photos?.[0]?.value,
          newsletterOptIn: false,
        });

        return done(null, newUser);
      } catch (error) {
        console.error("GitHub OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;