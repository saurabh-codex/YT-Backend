import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channel is not valid")
    }

    const channel  = await User.findById(channelId);

    if(!channel){
        throw new ApiError(404, "channel not found")
    }

    let subscribe;
    let unsubscribe;

    const itHasSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(itHasSubscription){
        unsubscribe = await Subscription.findOneAndDelete({
            subscriber: req.user._id,
            channel: channelId
        })
        if(!unsubscribe){
            throw new ApiError(500, "SWW while unsubscribing")
        }
        return res.status(200)
        .json(new ApiResponse(200,unsubscribe,"channel unsubscribed successfully"))
    }
    else{
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        if(!subscribe){
            throw new ApiError(500, "SWW while subscribing")
        }
        return res.status(200)
        .json(new ApiResponse(200,subscribe,"channel subscribed successfully"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel is not valid")
    }

    const subscription = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(channelId?.trim())
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            }
        },
        {
            $project:{
                subscribers:{
                    username:1,
                    fullnme:1,
                    avatar:1
                }
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,subscription[0], "all users channel subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "subscriber id not valid")
    }

    const subscription = await Subscription.aggregate([
        {
            $match:{
            channel: new mongoose.Types.ObjectId(subscriberId)
           }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as: "subscribedChannel"
            }
        },
        {
            $project:{
                subscribedChannel:{
                    username:1,
                    avatar:1
                }
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,subscription[0], "all subscribed channel fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}