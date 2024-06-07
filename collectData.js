const axios = require("axios");
const { channel } = require("diagnostics_channel");
const fs = require("fs");

const apiKey = "AIzaSyCD_egt0HiE17gSsu3IRIMaQE1LKaxfwcU";
const channelId = "https://www.youtube.com/@ImanGadzhi";
const outputFile = `${channelId}_to_million.json`;

// Function for collecting overall channel scripts
const getChannelStats = async (channelId, apiKey) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const response = await axios.get(url);
    return response.data.items[0].statistics;
  } catch (error) {
    console.error("Error fetching channel stats:", error);
  }
};

// Function for collecting a channels videos
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

// Collect and push data into JSON which I'll pull intro a graph later...
const collectData = async (channelId, apiKey) => {
  let allData = [];
  let nextPageToken = "";

  while (true) {
    const channelStats = await getChannelStats(channelId, apiKey);
    const subCount = parseInt(channelStats.subCount, 10);

    if (subCount >= 1000000) {
      break;
    }

    const videosData = await getVideos(channelId, apiKey, nextPageToken);
    const videos = videosData ? videosData.items : [];

    for (const video of videos) {
      if (video.id.kind === "youtube#video") {
        const videoId = video.id.videoId;
        const statistics = await getVideoStatistics(videoId, apikey);
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

  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
  console.log("Data collection completed");
};

collectData(channelId, apiKey);
