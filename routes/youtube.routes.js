const express = require("express");
const router = express.Router();
const { getYoutubeVideos, updateYoutubeVideo } = require("../controllers/youtube.controller");

router.get("/", getYoutubeVideos);
router.patch("/", updateYoutubeVideo);

module.exports = router;
