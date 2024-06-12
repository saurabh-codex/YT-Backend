import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video is not valid")
    }
    const videoLike = await Like.findOne({
        video:videoId
    })

    let like;
    let unlike;

    if(videoLike){
        unlike = await Like.deleteOne({
            video: videoId
        })

        if(!unlike){
        throw new ApiError(500, "SWW while unlike video")
        }
    }
    else{
        like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if(!like){
            throw new ApiError(500, "SWW liking video")
        }
    }
    return res.status(201)
    .json(new ApiResponse(200, {}, `user ${like? "like": "unlike"} video successfully`))
    
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "comment is not valid")
    }
    const commentLike = await Like.findOne({
        comment:commentId
    })

    let like;
    let unlike;

    if(commentLike){
        unlike = await Like.deleteOne({
            comment: commentId
        })

        if(!unlike){
        throw new ApiError(500, "SWW while unlike comment")
        }
    }
    else{
        like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        if(!like){
            throw new ApiError(500, "SWW liking comment")
        }
    }
    return res.status(201)
    .json(new ApiResponse(200, {}, `user ${like? "like": "unlike"} comment successfully`))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "tweet is not valid")
    }
    const tweetLike = await Like.findOne({
        tweet:tweetId
    })

    let like;
    let unlike;

    if(tweetLike){
        unlike = await Like.deleteOne({
            tweet: tweetId
        })

        if(!unlike){
        throw new ApiError(500, "SWW while unlike tweet")
        }
    }
    else{
        like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if(!like){
            throw new ApiError(500, "SWW liking tweet")
        }
    }
    return res.status(201)
    .json(new ApiResponse(200, {}, `user ${like? "like": "unlike"} tweet successfully`))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "user is not valid")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const likes = await Like.aggregate([
        {
            $lookup:{
                from: "videos",
                localField:"video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField:"videoOwner",
                            foreignField:"_id",
                            as: "videoOwner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            videoOwner:{
                                $arrayElemAt:["$videoOwner", 0]
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,likes[2].likedVideos,"fetched liked videos successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}