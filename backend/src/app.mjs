import 'dotenv/config';
import { createServer } from "http";
import express from "express";
import session from "express-session";
import Datastore from "@seald-io/nedb";
import path from "path";
import fs from "fs";
import multer from "multer";
import { genSalt, hash, compare } from "bcrypt";
import { body, validationResult, matchedData } from 'express-validator';

const PORT = 3000;
const app = express();

// Session middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    sameSite: true,
    secure: process.env.NODE_ENV == "prod",
  }
}));

// Set up paths based on environment
const dbPath = process.env.NODE_ENV === 'test' ? './testDb' : './database';
const uploadDir = path.join(process.cwd(), "uploads");

// Create database directory if it doesn't exist
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

// Databases
const users = new Datastore({ 
  filename: path.join(dbPath, "users.db"),
  autoload: true 
});

const images = new Datastore({ 
  filename: path.join(dbPath, "images.db"),
  autoload: true, 
  timestampData: true 
});

const comments = new Datastore({ 
  filename: path.join(dbPath, "comments.db"),
  autoload: true, 
  timestampData: true 
});

app.use(express.urlencoded({ extended: false }));

// development: use express to serve frontend files
// production: use a dockerized nginx to serve frontend files
if (process.env.NODE_ENV=="dev") {
  app.use(express.static('../../frontend/src'));
} else {
  app.use(express.static("static"));
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// app.use("/api/uploads", express.static(uploadDir));

app.use((req, res, next) => {
  console.log("HTTP request", req.method, req.url, req.body || req.query);
  next();
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    const ext = path.extname(safe);
    cb(null, `image-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ==================== MIDDLEWARE ====================

// Authentication middleware
const isAuthenticated = function (req, res, next) {
  if (!req.session.username) return res.status(401).end("access denied");
  next();
};

// Gallery ownership middleware
const isGalleryOwner = function (req, res, next) {
  const targetUserId = req.params.userId;
  if (req.session.username !== targetUserId) {
    return res.status(403).end("forbidden - not gallery owner");
  }
  next();
};

// Comment ownership middleware
const isCommentOwner = function (req, res, next) {
  const commentId = req.params.commentId || req.params.id;
  comments.findOne({ _id: commentId }, (err, comment) => {
    if (err) return res.status(500).end("DB error finding comment");
    if (!comment) return res.status(404).end("comment not found");
    
    // Find the image this comment belongs to
    images.findOne({ _id: comment.imageId }, (imgErr, image) => {
      if (imgErr) return res.status(500).end("DB error finding image");
      
      // Allow if: comment owner OR gallery owner of the image
      if (req.session.username === comment.userId || 
          req.session.username === image.userId) {
        return next();
      }
      return res.status(403).end("forbidden");
    });
  });
};

// Validation middleware
const validateAuth = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1-50 characters')
    .escape(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

const validateImage = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters')
    .escape(),
  // Removed author validation - it will be auto-filled from session
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1-500 characters')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// ==================== AUTHENTICATION ROUTES ====================

// Sign up
app.put("/api/signup/", validateAuth, (req, res) => {
  const data = matchedData(req);
  const username = data.username;
  const password = data.password;
  
  users.findOne({ _id: username }, (err, user) => {
    if (err) return res.status(500).end("DB error");
    if (user) return res.status(409).end("username " + username + " already exists");
    
    genSalt(10, (err, salt) => {
      hash(password, salt, (err, hash) => {
        users.update(
          { _id: username },
          { _id: username, hash: hash },
          { upsert: true },
          (err) => {
            if (err) return res.status(500).end("DB error");
            return res.json(username);
          }
        );
      });
    });
  });
});

// Sign in
app.post("/api/signin/", validateAuth, (req, res) => {
  const data = matchedData(req);
  const username = data.username;
  const password = data.password;
  
  users.findOne({ _id: username }, (err, user) => {
    if (err) return res.status(500).end("DB error");
    if (!user) return res.status(401).end("access denied");
    
    compare(password, user.hash, (err, valid) => {
      if (err) return res.status(500).end("error");
      if (!valid) return res.status(401).end("access denied");
      
      req.session.username = username;
      return res.json(username);
    });
  });
});

// Sign out
app.get("/api/signout/", (req, res) => {
  req.session.destroy();
  return res.json("signed out");
});

// Get current user
app.get("/api/user/", (req, res) => {
  if (!req.session.username) return res.json(null);
  return res.json(req.session.username);
});

// ==================== GALLERY LIST ROUTES ====================

// GET /api/galleries/ - Get paginated list of users with gallery stats
app.get("/api/galleries/", isAuthenticated, (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const pageSize = 10;
    
    // Get distinct users who have images
    images.find({}, (err, allImages) => {
        if (err) return res.status(500).end("DB error getting images");
        
        // Get unique user IDs from images
        const userSet = new Set();
        allImages.forEach(image => {
            if (image.userId) {
                userSet.add(image.userId);
            }
        });
        
        const uniqueUsers = Array.from(userSet);
        
        // Count images for each user
        const galleryPromises = uniqueUsers.map(userId => {
            return new Promise((resolve) => {
                images.count({ userId: userId }, (countErr, imageCount) => {
                    if (countErr) {
                        resolve({ username: userId, imageCount: 0 });
                    } else {
                        resolve({ username: userId, imageCount: imageCount });
                    }
                });
            });
        });
        
        Promise.all(galleryPromises).then(galleries => {
            // Sort by username
            galleries.sort((a, b) => a.username.localeCompare(b.username));
            
            // Paginate
            const start = page * pageSize;
            const end = start + pageSize;
            const paginatedGalleries = galleries.slice(start, end);
            const totalPages = Math.ceil(galleries.length / pageSize);
            
            res.json({
                galleries: paginatedGalleries,
                page: page,
                totalPages: totalPages,
                totalGalleries: galleries.length
            });
        });
    });
});

// ==================== USER GALLERY ROUTES ====================

// Get image by position in user's gallery
app.get("/api/users/:userId/images/current/:position", isAuthenticated, (req, res) => {
  const userId = req.params.userId;
  const position = parseInt(req.params.position) || 0;
  
  images
    .find({ userId: userId })
    .sort({ createdAt: -1 })
    .skip(position)
    .limit(1)
    .exec((err, docs) => {
      if (err) return res.status(500).end("DB error finding image");
      
      images.count({ userId: userId }, (countErr, total) => {
        if (countErr) return res.status(500).end("DB error counting images");
        
        if (docs.length === 0) {
          return res.json({
            image: null,
            position: position,
            total: total,
            hasNext: false,
            hasPrev: false
          });
        }
        
        res.json({
          image: docs[0],
          position: position,
          total: total,
          hasNext: position < total - 1,
          hasPrev: position > 0
        });
      });
    });
});

// Get user's image count
app.get("/api/users/:userId/images/count", isAuthenticated, (req, res) => {
  const userId = req.params.userId;
  
  images.count({ userId: userId }, (err, total) => {
    if (err) return res.status(500).end("DB error counting images");
    res.json({ total });
  });
});

// Get user's gallery images
app.get("/api/users/:userId/images/", isAuthenticated, (req, res) => {
  const userId = req.params.userId;
  
  images
    .find({ userId: userId })
    .sort({ createdAt: -1 })
    .exec((err, docs) => {
      if (err) return res.status(500).end("DB error listing images");
      res.json(docs);
    });
});

// Upload image to user's gallery
app.post("/api/users/:userId/images/", isAuthenticated, isGalleryOwner, upload.single("image"), validateImage, (req, res) => {
  const userId = req.params.userId;
  const data = matchedData(req);
  const title = data.title;
  const author = req.session.username;

  if (!req.file) {
    return res.status(400).end("You must upload a file (field 'image').");
  }

  const filename = req.file.filename;
  
  const doc = { 
    title, 
    author,
    filename,
    userId: userId
  };

  images.insert(doc, (err, newDoc) => {
    if (err) return res.status(500).end("DB error inserting image");
    return res.status(201).json(newDoc);
  });
});

// Delete image from user's gallery
app.delete("/api/users/:userId/images/:imageId", isAuthenticated, isGalleryOwner, (req, res) => {
  const imageId = req.params.imageId;
  
  images.findOne({ _id: imageId, userId: req.params.userId }, (err, doc) => {
    if (err) return res.status(500).end("DB error finding image");
    if (!doc) return res.status(404).end("Image not found");

    // Delete the uploaded file
    if (doc.filename) {
      const filePath = path.join(uploadDir, doc.filename);
      fs.unlink(filePath, (fsErr) => {
        if (fsErr && fsErr.code !== "ENOENT") console.warn("Error deleting file:", fsErr);
      });
    }

    // Remove image doc
    images.remove({ _id: imageId }, { multi: false }, (removeErr) => {
      if (removeErr) return res.status(500).end("DB error deleting image");

      // Remove associated comments
      comments.remove({ imageId: imageId }, { multi: true }, (cErr) => {
        if (cErr) console.warn("Error deleting comments for image:", cErr);
        return res.json({ deleted: imageId });
      });
    });
  });
});

// ==================== COMMENT ROUTES ====================

// Add comment to any image
app.post("/api/images/:imageId/comments/", isAuthenticated, validateComment, (req, res) => {
  const imageId = req.params.imageId;
  const data = matchedData(req);
  const content = data.content;

  images.findOne({ _id: imageId }, (err, img) => {
    if (err) return res.status(500).end("DB error finding image");
    if (!img) return res.status(404).end("Image not found");

    const doc = { 
      imageId, 
      content,
      userId: req.session.username,
      author: req.session.username // For display purposes
    };
    
    comments.insert(doc, (cErr, newComment) => {
      if (cErr) return res.status(500).end("DB error inserting comment");
      return res.status(201).json(newComment);
    });
  });
});

// Get comments for image (paginated)
app.get("/api/images/:imageId/comments/", isAuthenticated, (req, res) => {
  const imageId = req.params.imageId;
  const page = parseInt(req.query.page) || 0;

  images.findOne({ _id: imageId }, (err, img) => {
    if (err) return res.status(500).end("DB error finding image");
    if (!img) return res.status(404).end("Image not found");

    comments
      .find({ imageId })
      .sort({ createdAt: -1 })
      .skip(page * 10)
      .limit(10)
      .exec((cErr, docs) => {
        if (cErr) return res.status(500).end("DB error listing comments");
        
        comments.count({ imageId }, (countErr, total) => {
          if (countErr) return res.status(500).end("DB error counting comments");
          res.json({
            comments: docs,
            page: page,
            totalPages: Math.max(1, Math.ceil(total / 10)),
            totalComments: total
          });
        });
      });
  });
});

// Delete comment (owner or gallery owner)
app.delete("/api/comments/:commentId/", isAuthenticated, isCommentOwner, (req, res) => {
  const commentId = req.params.commentId;
  
  comments.remove({ _id: commentId }, { multi: false }, (err) => {
    if (err) return res.status(500).end("DB error deleting comment");
    res.json({ deleted: commentId });
  });
});

app.post("/api/location", (req, res) => {
  const { latitude, longitude } = req.body;
  console.log("Received location:", latitude, longitude);
  res.json({ message: "Location received successfully!" });
});

// Welcome endpoint
app.get('/api/', (req, res) => {
  res.json('Welcome to HW3!');
});

// start server
export const server = createServer(app).listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`HTTP server on http://localhost:${PORT}`);
});