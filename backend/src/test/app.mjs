import "./test-setup.mjs";
import request from "supertest";
import { server } from "../app.mjs";
import fs from "fs";
import path from "path";

// Set test environment before importing your app
process.env.NODE_ENV = 'test';

// Cleanup function that runs after ALL tests
after(function() {
  server.close();
  
  // Delete the entire test database folder
  const testDbPath = "./testDb";
  if (fs.existsSync(testDbPath)) {
    fs.rmSync(testDbPath, { recursive: true, force: true });
    console.log('Cleaned up test database');
  }
  
  // Also clean up any test uploads
  const uploadsDir = "./public/uploads";
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      if (file.includes("test") || file.includes("comment")) {
        fs.unlinkSync(path.join(uploadsDir, file));
        console.log('Deleted test file:', file);
      }
    });
  }
});

describe("Testing Static Files", () => {
  it("should serve index.html", function (done) {
    request(server)
      .get("/")
      .expect(200)
      .expect(/Web Gallery/)
      .end(done);
  });
});

describe("Testing Images API", () => {
  let testImageId;

  it("should get all images (empty initially)", function (done) {
    request(server)
      .get("/api/images/")
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        if (!Array.isArray(res.body)) throw new Error('Response is not an array');
      })
      .end(done);
  });

  it("should create a new image", function (done) {
    request(server)
      .post("/api/images/")
      .field("title", "Test Image")
      .field("author", "Test Author")
      .attach("image", Buffer.from("fake image data"), "test.jpg")
      .expect(201)
      .expect('Content-Type', /json/)
      .expect(res => {
        if (!res.body._id) throw new Error('Missing image ID');
        testImageId = res.body._id;
      })
      .end(done);
  });

  it("should get the created image by ID", function (done) {
    request(server)
      .get(`/api/images/${testImageId}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        if (res.body._id !== testImageId) throw new Error('Wrong image returned');
      })
      .end(done);
  });

  it("should delete an image", function (done) {
    request(server)
      .delete(`/api/images/${testImageId}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(done);
  });
});

describe("Testing Comments API", () => {
  let testImageId;
  let testCommentId;

  before(function (done) {
    request(server)
      .post("/api/images/")
      .field("title", "Comment Test Image")
      .field("author", "Comment Test Author")
      .attach("image", Buffer.from("fake image data"), "comment_test.jpg")
      .end(function (err, res) {
        testImageId = res.body._id;
        done();
      });
  });

  it("should add a comment to an image", function (done) {
    request(server)
      .post(`/api/images/${testImageId}/comments/`)
      .send({
        author: "Test Commenter",
        content: "This is a test comment"
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .expect(res => {
        testCommentId = res.body._id;
      })
      .end(done);
  });

  it("should delete a comment", function (done) {
    request(server)
      .delete(`/api/comments/${testCommentId}`)
      .expect(200)
      .end(done);
  });

  it("should delete the comment test image", function (done) {
    request(server)
      .delete(`/api/images/${testImageId}`)
      .expect(200)
      .end(done);
  });
});

describe("Testing Error Cases", () => {
  let errorTestImageId;

  before(function (done) {
    request(server)
      .post("/api/images/")
      .field("title", "Error Test Image")
      .field("author", "Error Test Author")
      .attach("image", Buffer.from("fake image data"), "error_test.jpg")
      .end(function (err, res) {
        errorTestImageId = res.body._id;
        done();
      });
  });

  it("should return 400 when creating image without file", function (done) {
    request(server)
      .post("/api/images/")
      .field("title", "No File")
      .field("author", "No File Author")
      .expect(400)
      .end(done);
  });

  it("should return 400 when creating comment with missing fields", function (done) {
    // Test missing author
    request(server)
      .post(`/api/images/${errorTestImageId}/comments/`)
      .send({ content: "No author" })
      .expect(400)
      .end(function() {
        // Test missing content  
        request(server)
          .post(`/api/images/${errorTestImageId}/comments/`)
          .send({ author: "No content" })
          .expect(400)
          .end(done);
      });
  });

  it("should delete the error test image", function (done) {
    request(server)
      .delete(`/api/images/${errorTestImageId}`)
      .expect(200)
      .end(done);
  });
});