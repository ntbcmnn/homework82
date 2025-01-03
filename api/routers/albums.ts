import express from "express";
import Album from "../models/Album";
import {imagesUpload} from "../multer";
import mongoose from "mongoose";
import {IAlbum} from "../types";

const albumsRouter = express.Router();

albumsRouter.get('/', async (req: express.Request, res: express.Response, next) => {
    const {artist} = req.query;

    try {
        if (artist) {
            if (!mongoose.Types.ObjectId.isValid(artist as string)) {
                res.status(400).send('Invalid album ID.');
                return;
            }

            const albums = await Album
                .find({artist})
                .select("-_id name release_year image")
                .populate("artist", "-_id name info");

            if (albums.length === 0) {
                res.status(404).send('No albums found for this artist');
                return;
            }

            res.send(albums);
            return;
        }

        const albums = await Album
            .find()
            .select("-_id name release_year image")
            .populate("artist", "-_id name info");

        res.send(albums);
    } catch (e) {
        next(e);
    }
});

albumsRouter.post('/', imagesUpload.single('image'), async (req: express.Request, res: express.Response, next) => {
    const {name, artist, release_year} = req.body;

    const newAlbum: IAlbum = {
        name,
        artist,
        release_year,
        image: req.file ? 'images' + req.file.filename : null
    };

    try {
        const album = new Album(newAlbum);
        await album.save();
        res.send(album);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const ValidationErrors = Object.keys(error.errors).map((key: string) => (
                    {
                        field: key,
                        message: error.errors[key].message,
                    }
                )
            );
            res.status(400).send({errors: ValidationErrors});
        }
        next(error);
    }
});

albumsRouter.get('/:id', async (req: express.Request, res: express.Response, next) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).send('Invalid album ID.');
        return;
    }

    try {
        const album = await Album
            .findById(id)
            .select("_id name release_year")
            .populate("artist", "-_id name info");

        if (!album) {
            res.status(404).send('Album not found.');
            return;
        }

        res.send(album);
    } catch (e) {
        next(e);
    }
});

export default albumsRouter;