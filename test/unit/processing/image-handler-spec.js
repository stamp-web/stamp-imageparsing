import {ImageHandler} from 'processing/image/image-handler';
import _ from 'lodash';

describe('image-handle', () => {

    ImageHandler.configureProcessor = false;

    let imageHandler;

    describe('_imagetoMimeType', () => {

        imageHandler = new ImageHandler();

        it('jpg image type', () => {
            let mimeType = imageHandler._imageToMimeType('jpg');
            expect(mimeType).toBe('image/jpeg');
        });

        it('png image type', () => {
            let mimeType = imageHandler._imageToMimeType('png');
            expect(mimeType).toBe('image/png');
        });

        it('png image type', () => {
            let mimeType = imageHandler._imageToMimeType('tiff');
            expect(mimeType).toBe('image/tiff');
        });

        it('undefined image type', () => {
            let mimeType = imageHandler._imageToMimeType(undefined);
            expect(mimeType).toBe('image/jpeg');
        })
    });
});
