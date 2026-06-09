const mongoose = require("mongoose");

const mongo_url = process.env.MONGO_CONN;

console.log("Attempting MongoDB connection...");

mongoose
  .connect(mongo_url)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error");
    console.error(err);
  });

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});