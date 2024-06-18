import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteOnCloudinary } from "../utils/cloudnary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = `/^video/`,
    sortBy = "createdAt",
    sortType = 1,
    userId = req.user._id,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const getAllVideosAggregate = await Video.aggregate([
    {
      $match: {
        videoOwner: new mongoose.Types.ObjectId(userId),
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    },

    {
      $sort: {
        [sortBy]: sortType,
      },
    },

    {
      $skip: (page - 1) * limit,
    },

    {
      $limit: parseInt(limit),
    },

  ]);


  Video.aggregatePaginate(getAllVideosAggregate,{page,limit})
  .then((result) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, result, "fetched all videos success")
    )
  })
  .catch((error) =>{
    console.log("getting error while fetching all videos", error);
    throw error
  })

});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || title?.trim() === "") {
    throw new ApiError(400, "Title is required");
  }
  if (!description || description?.trim() === "") {
    throw new ApiError(400, "description is required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "video file is missing");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "SWW while uploading file on cloudnary");
  }

  const video = Video.create({
    videoFile: {
      public_id: videoFile?.public_id,
      url: videoFile?.url,
    },
    thumbnail: {
      public_id: thumbnail?.public_id,
      url: thumbnail?.url,
    },
    title,
    description,
    isPublished,
    owner: req.user._id,
    duration: videoFile?.duration,
  });

  if (!video) {
    throw new ApiError(500, "SWW while storing video in db");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "this video is not valid");
  }

  const video = await Video.findById({
    _id: videoId,
  });

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailFile = req.file?.path;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video is not valid");
  }

  if (
    !(
      thumbnailFile ||
      !(!title || title?.trim() === "") ||
      !(!description || description?.trim() === "")
    )
  ) {
    throw new ApiError(400, "update fields are required");
  }

  const previousvideo = await Video.findOne({
    _id: videoId,
  });

  if (!previousvideo) {
    throw new ApiError(404, "video not found");
  }

  let updateFields = {
    $set: {
      title,
      description,
    },
  };

  let thumbnailUploadOnCloudinary;
  if (thumbnailFile) {
    await deleteOnCloudinary(previousvideo.thumbnail?.public_id);

    thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnailFile);

    if (!thumbnailUploadOnCloudinary) {
      throw new ApiError(500, "SWW while updating thumbnail");
    }

    updateFields.$set = {
      public_id: thumbnailUploadOnCloudinary.public_id,
      url: thumbnailUploadOnCloudinary.url,
    };
  }

  const updateVideoDetails = await Video.findByIdAndUpdate(
    videoId,
    updateFields,
    {
      new: true,
    }
  );
  if (!updateVideoDetails) {
    throw new ApiError(500, "SWWW updating video details");
  }

  return res
    .status(200)
    .json(200, updateVideoDetails, "video details updated successfully");
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video is not valid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "no video found");
  }

  if (video.owner.toString() !== req.updateFields._id.toString()) {
    throw new ApiError(403, "u dont have permission to dlt this video");
  }

  if (video.videoFile) {
    await deleteOnCloudinary(video.videoFile.public_id, "video");
  }

  if (video.thumbnail) {
    await deleteOnCloudinary(video.thumbnail.public_id);
  }

  const deleteResponse = await Video.findByIdAndDelete(videoId);

  if (!deleteResponse) {
    throw new ApiError(500, "SWW while deleting video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, deleteResponse, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video is not valid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "u dont have permission to toggle this video");
  }

  video.isPublished = !video.isPublished;

  await Video.Save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video toggle successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
