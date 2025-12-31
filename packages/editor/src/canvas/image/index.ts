import DustBin from '../../assets/dustbin.svg'

export class ImageManager {
    private images = new Map();
    public callback?: () => void;

    constructor(callback?: () => void) {
        this.callback = callback;
        this.loadImage('DustBin', DustBin);
    }

    private loadImage(key: string, url: string) {
        const image = new Image();
        image.src = url;
        image.onload = () => {
            if (this.callback) {
                this.callback();
            }
        };
        this.images.set(key, image);
    }

    get(key: string) {
        return this.images.get(key);
    }
}