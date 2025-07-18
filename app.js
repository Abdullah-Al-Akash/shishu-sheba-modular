const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// === Middlewares ===
app.use(
  cors({
    origin: ["http://localhost:5173", "https://shishu-sheba.netlify.app"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const dashboardRoutes = require('./routes/dashboard.routes');

// === Routes ===
app.use("/v1/products", require("./routes/product.routes"));
app.use("/v1", require("./routes/order.routes"));
app.use("/v1", require("./routes/auth.routes"));
app.use("/v1/banner", require("./routes/banner.routes"));
app.use("/v1/youtube", require("./routes/youtube.routes"));
app.use("/v1/categories", require("./routes/category.routes"));
app.use('/v1/dashboard', dashboardRoutes);
// app.use("/v1/steadfast", require("./routes/steadfast.routes"));

// === Error Handling Middleware ===
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
