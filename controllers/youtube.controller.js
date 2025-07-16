const client = require("../config/db");

const youtubeCollection = client.db("sishuSheba").collection("youtube");

exports.getYoutubeVideos = async (req, res) => {
  try {
    const youtubeData = await youtubeCollection.findOne({});
    const videos = youtubeData?.videos || ["", "", "", ""];
    const paddedVideos = [...videos];
    while (paddedVideos.length < 4) {
      paddedVideos.push("");
    }
    res.send(paddedVideos.slice(0, 4));
  } catch (error) {
    console.error("Failed to get YouTube links:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.updateYoutubeVideo = async (req, res) => {
  const { index, url } = req.body;

  if (typeof index !== "number" || index < 0 || index > 3) {
    return res.status(400).send({ error: "Invalid index (must be 0-3)" });
  }

  if (typeof url !== "string") {
    return res.status(400).send({ error: "URL must be a string" });
  }

  try {
    const currentData = (await youtubeCollection.findOne({})) || {
      videos: ["", "", "", ""],
    };
    const currentVideos = [...currentData.videos];
    while (currentVideos.length < 4) {
      currentVideos.push("");
    }
    currentVideos[index] = url.trim();

    const result = await youtubeCollection.updateOne(
      {},
      { $set: { videos: currentVideos, lastUpdated: new Date() } },
      { upsert: true }
    );

    res.send({
      success: true,
      modifiedCount: result.modifiedCount,
      updatedIndex: index,
      videos: currentVideos,
    });
  } catch (error) {
    console.error("Failed to update YouTube link:", error);
    res.status(500).send({ error: "Failed to update YouTube link" });
  }
};
