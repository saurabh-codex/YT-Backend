import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const{content} = req.body;

    if(!content || content?.trim() === ""){
        throw new ApiError(400, "content is required")
    }
    const tweet = Tweet.create({
        content,
        owner: req.user._id
    })
    if(!tweet){
        throw new ApiError(500, "SWW while creating tweet")
    }

    return res.status(201)
    .json(new ApiResponse(200,tweet,"tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const{userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "thi user is not valid")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError (404, " user not found")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id
            }
        }
    ])

    if(!tweets){
        throw new ApiError(500, "SWW while fetching tweets")
    }

    return res.status(201)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const{newContent} = req.body
    const{tweetId} = req.params

    if(!newContent || newContent?.trim() === ""){
        throw new ApiError(400, "content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "this tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, " tweet not found")
    }
    
    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "u cant update this post")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: newContent
            }
        },
        {
            new : true
        }
    )

    if(!updateTweet){
        throw new ApiError(500, "SWW while updatingtweet")
    }

    return res.status(201)
    .json(new ApiResponse(200,updateTweet,"tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"this tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "no tweet found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"u dont have permission to dlt this post")
    }

    const deleteTweet = await Tweet.deleteOne(req.user._id)

    if(!deleteTweet){
        throw new ApiError(500, "SWW while deleting tweet")
    }

    return res.status(201)
    .json(new ApiResponse(200, deleteTweet, "tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}