import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if((!name || name?.trim()==="")||(!description || description?.trim() ==="")){
        throw new ApiError(400,"name and description is required")
    }

    const playlist  = await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    if(!playlist){
        throw new ApiError(500, "SWW While creating playlist")
    }

    return res.status(201)
    .json(new ApiResponse(200, playlist,"playlist created successfully"))


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"userid not valid")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400,"user not found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                playlist:{
                    $first:"$videos"
                }
            }
        }
    ])

    if(!playlists){
        throw new ApiError(500, "SWW While fetching playlists")
    }

    return res.status(201)
    .json(new ApiResponse(200,playlists,"playlists fetched sucessfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlist is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    return res.status(201)
    .json(new ApiResponse(200,playlist,"playlist frtched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"this playlist id not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id not valid")
    }

    const playlist =await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"u dont have permission to add video in this playlist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"no video found")
    }

    if(playlist.video.includes(videoId)){
        throw new ApiError(400,"video already exists in this playlist")
    }

    const addedToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                video: videoId
            }
        },
        {
            new : true
        }
    )

    if(!addedToPlaylist){
        throw new ApiError(500,"SWW while adding video to playlist")
    }

    return res.status(201)
    .json(new ApiResponse(200,addedToPlaylist,"video added"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"this playlist id not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id not valid")
    }

    const playlist =await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"u dont have permission to remove video in this playlist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"no video found")
    }

    if(!playlist.video.includes(videoId)){
        throw new ApiError(400,"video not exists in this playlist")
    }

    const removedFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                video: videoId
            }
        },
        {
            new : true
        }
    )

    if(!removedFromPlaylist){
        throw new ApiError(500,"SWW while adding video to playlist")
    }

    return res.status(201)
    .json(new ApiResponse(200,removedFromPlaylist,"video removed"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"playlist is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"u cant dlt this playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500,"SWW while deleting playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200,deletedPlaylist,"playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {NewName, NewDescription} = req.body
    //TODO: update playlist

    if(isValidObjectId(playlistId)){
        throw new ApiError(400,"playlist id is not valid")
    }

    if(!NewName && !NewDescription){
        throw new ApiError(400, "Either name or description is required");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You do not have permission to update this playlist");

    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:NewName || playlist.name,
                description:NewDescription || playlist.description
            }
        },
        {
            new :true,
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500,"SWW while updating playlsit")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist,"playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}