import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

// ---- MongoDB Connection ----
mongoose
  .connect(
    "mongodb+srv://dhyanu:Goodboy%402216@cluster0.dwmer2w.mongodb.net/ClothingDB",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ---- Mongoose Schema & Model ----
const PredictionSchema = new mongoose.Schema({
  occasion: String,
  outfit: {
    top: String,
    bottom: String,
    shoes: String,
    weather: String,
    colors: String,
    accessories: String,
  },
  score: Number,
  category: String,
  feedback: [String],
  createdAt: { type: Date, default: Date.now },
});

const Prediction = mongoose.model("Prediction", PredictionSchema, "ClothingDB");

// ---- Clothing Prediction API ----
app.post("/api/predict", async (req, res) => {
  const { occasion, top, bottom, shoes, weather, colors, accessories } =
    req.body;

  if (!occasion || !top || !bottom || !shoes || !weather || !colors) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let score = 50;
  let feedback = [];

  // ---- Occasion-Based Feedback ----
  if (occasion === "business-meeting") {
    if (top === "dress-shirt")
      (score += 20),
        feedback.push("✓ Dress shirt is perfect for business meetings");
    else
      feedback.push("✗ Consider wearing a dress shirt for business meetings");

    if (shoes === "loafers" || shoes === "boots")
      (score += 10), feedback.push("✓ Suitable formal shoes for a meeting");
    else
      (score -= 5),
        feedback.push("✗ Casual shoes may not suit a business meeting");
  }

  if (occasion === "party") {
    if (top === "t-shirt" || top === "blouse")
      (score += 10), feedback.push("✓ Casual tops fit party vibe");
    if (shoes === "sneakers" || shoes === "heels")
      (score += 10), feedback.push("✓ Sneakers or heels work well for party");
  }

  if (occasion === "wedding") {
    if (shoes === "sandals" || shoes === "sneakers")
      (score -= 15),
        feedback.push("✗ Sandals or sneakers are too casual for a wedding");
    if (top === "dress-shirt" || top === "blouse")
      (score += 15), feedback.push("✓ Dressy tops are suitable for weddings");
  }

  if (occasion === "sports") {
    if (top === "t-shirt" && bottom === "shorts")
      (score += 20), feedback.push("✓ Great sports outfit");
    else feedback.push("✗ Consider T-Shirt + Shorts for sports");
    if (shoes !== "sneakers")
      (score -= 10), feedback.push("✗ Sneakers recommended for sports");
  }

  if (occasion === "casual") {
    score += 5;
    feedback.push("✓ Casual wear is fine for relaxed occasions");
  }

  // ---- Weather-Based Feedback ----
  if (weather === "sunny-hot") {
    if (top === "sweater" || top === "hoodie")
      (score -= 15), feedback.push("☀️ Sweater/hoodie may be too hot");
    if (bottom === "trousers")
      (score -= 5),
        feedback.push("☀️ Shorts may be more comfortable in hot weather");
  }
  if (weather === "cold") {
    if (top === "t-shirt" || top === "tank-top")
      (score -= 15),
        feedback.push("❄️ Consider a sweater or hoodie for cold weather");
    if (shoes === "sandals")
      (score -= 15), feedback.push("❄️ Sandals not suitable for cold weather");
  }
  if (weather === "rainy") {
    if (shoes === "sandals")
      (score -= 10), feedback.push("☔ Sandals may get wet in rainy weather");
  }
  if (weather === "snowy") {
    if (shoes !== "boots")
      (score -= 15), feedback.push("❄️ Boots recommended for snow");
  }

  // ---- Color Feedback ----
  const colorLower = colors.toLowerCase();
  if (colorLower.includes("black") && colorLower.includes("navy"))
    (score -= 10), feedback.push("⚠️ Black and navy can clash");
  if (colorLower.includes("red") && colorLower.includes("green"))
    (score -= 10),
      feedback.push(
        "⚠️ Red and green combination may look festive, not everyday"
      );

  // ---- Accessories Feedback ----
  if (accessories) {
    if (accessories === "watch")
      (score += 5), feedback.push("⌚ Watch adds professionalism");
    else
      feedback.push(
        `✓ ${
          accessories.charAt(0).toUpperCase() + accessories.slice(1)
        } can enhance the outfit`
      );
  }

  // ---- Final Score & Category ----
  score = Math.max(0, Math.min(100, score));
  let category = "Needs Improvement";
  if (score >= 85) category = "Excellent Choice!";
  else if (score >= 70) category = "Good Outfit!";
  else if (score >= 50) category = "Fair Selection";

  if (feedback.length === 0) {
    feedback.push(
      "No specific tips available. Try adding accessories or adjusting colors for better style."
    );
  }

  const predictionData = {
    occasion,
    outfit: { top, bottom, shoes, weather, colors, accessories },
    score,
    category,
    feedback,
  };

  // ---- Save to MongoDB ----
  try {
    const prediction = new Prediction(predictionData);
    await prediction.save();
    console.log("💾 Prediction saved:", prediction._id);
  } catch (err) {
    console.error("❌ Error saving to DB:", err);
  }

  res.json(predictionData);
});

// ---- Fetch Saved Predictions ----
app.get("/api/history", async (req, res) => {
  try {
    const predictions = await Prediction.find().sort({ createdAt: -1 });
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ---- Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
