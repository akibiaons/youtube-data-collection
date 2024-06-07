const axios = require("axios");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env file

const apiKey = process.env.API_KEY_YOUTUBE; // Load the YouTube Data API key from the environment variable
const username = "ImanGadzhi"; // Replace with the channel's username or custom name

const getChannelId = async (username, apiKey) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${username}&type=channel&key=${apiKey}`;
    const response = await axios.get(url);
    const channelId = response.data.items[0].id.channelId;
    console.log(`Channel ID: ${channelId}`);
    return channelId;
  } catch (error) {
    console.error("Error fetching channel ID:", error);
  }
};

// Function for collecting overall channel stats
const getChannelStats = async (channelId, apiKey) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const response = await axios.get(url);
    return response.data.items[0].statistics;
  } catch (error) {
    console.error("Error fetching channel stats:", error);
  }
};

// Function for collecting a channel's videos
const getVideos = async (channelId, apiKey, pageToken = "") => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&pageToken=${pageToken}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching video data:", error);
  }
};

const getVideoStatistics = async (videoId, apiKey) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=statistics`;
    const response = await axios.get(url);
    return response.data.items[0].statistics;
  } catch (error) {
    console.error("Error fetching video stats:", error);
  }
};

// Collect and push data into JSON
const collectData = async (channelId, apiKey) => {
  let allData = [];
  let nextPageToken = "";

  while (true) {
    const channelStats = await getChannelStats(channelId, apiKey);
    const subCount = parseInt(channelStats.subscriberCount, 10);

    if (subCount >= 1000000) {
      break;
    }

    const videosData = await getVideos(channelId, apiKey, nextPageToken);
    const videos = videosData ? videosData.items : [];

    for (const video of videos) {
      if (video.id.kind === "youtube#video") {
        const videoId = video.id.videoId;
        const statistics = await getVideoStatistics(videoId, apiKey);
        allData.push({
          videoId,
          title: video.snippet.title,
          publishedAt: video.snippet.publishedAt,
          statistics,
        });
      }
    }
    nextPageToken = videosData ? videosData.nextPageToken : null;
    if (!nextPageToken) {
      break;
    }
  }

  fs.writeFileSync(
    `${channelId}_to_million.json`,
    JSON.stringify(allData, null, 2)
  );
  console.log("Data collection completed");
};

const main = async () => {
  const channelId = await getChannelId(username, apiKey);
  if (channelId) {
    await collectData(channelId, apiKey);
  }
};

main();
