import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is not valid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const aggregateComments = await Comment.aggregate([
        {
            $match:{
               video: new mongoose.Types.ObjectId(videoId) 
            }
        }
    ])

    Comment.aggregatePaginate(aggregateComments, {
        page,
        limit
    })
    .then((result)=>{
        return res.status(201).json(
            new ApiResponse(200, result, "VideoComments fetched  successfully!!"))
    })
    .catch((error)=>{
        throw new ApiError(500, "something went wrong while fetching video Comments", error)
    })

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const{content} = req.body;
    const {videoId} = req.params

    if(!content ||content?.trim() === ""){
        throw new ApiError(400, "comment content is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video ID is not valid")
    }

    const comment = Comment.create({
        content,
        video:videoId,
        owner: req.user._id

    })

    if(!comment){
        throw new ApiError(500, "SWW while creating comment")
    }

    return res.status(201)
    .json(new ApiResponse(200,comment,"comment created successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {newContent} = req.body
    const {commentId} = req.params

    if(!newContent || newContent?.trim() === ""){
        throw new ApiError(400, "comment content is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "this comment is not valid")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "u cant edit this comment")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: newContent
            }
        },
        {
            new: true
        }
    )
    if(!updateComment){
        throw new ApiError(500, "SWW while updating comment")
    }

    return res.status(201)
    .json(new ApiResponse(200,updateComment,"comment updated successfully"))


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"this comment id is not valid")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "no comment found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"u dont have permission to dlt this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(500, "SWW while deleting comment")
    }

    return res.status(201)
    .json(new ApiResponse(200, deletedComment, "comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }