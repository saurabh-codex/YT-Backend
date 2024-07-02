import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.,

    const allLikes = await Like.aggregate([
        {
            $match: {
                likedBy:  new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group:{
                _id:null,
                totalVideoLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$video,false"]},
                            1,
                            0
                        ]
                    }
                },
                totalTweetLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$tweet,false"]},
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$comment,false"]},
                            1,
                            0
                        ]
                    }
                }
                
            }
        }
    ]);

    const allSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel : new mongoose.Types.ObjectId(req.user._id)
            }
            
        },
        {
            $count: "subscribers"
        }
    ])

    const allVideo = await Video.aggregate([
        {
            $match:{
                videoOwner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $count: "Videos"
        }
    ])

    const allViews = await Video.aggregate([
        {
            $match:{
                videoOwner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group:{
                _id: null,
                allVideosViews:{
                    $sum: "$views"
                }
            }
        }
    ])

    const stats = {
        Subscribers: allSubscribers[0].subscribers,
        totalVideos: allVideo[0].Videos,
        totalVideoViews: allViews[0].allVideosViews,
        totalVideoLikes: allLikes[0].totalVideoLikes,
        totalTweetLikes: allLikes[0].totalTweetLikes,
        totalCommentLikes: allLikes[0].totalCommentLikes
         
    }

    return res.status(200)
    .json( new ApiResponse(200, stats, "fetched channel stats successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const allVideo = await Video.find({
        videoOwner:req.user._id
    })

    if(!allVideo){
        throw new ApiError(500, "SWW While fetching channel all videos")
    }

    return res.status(200)
    .json(new ApiResponse(200, allVideo, "all videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }