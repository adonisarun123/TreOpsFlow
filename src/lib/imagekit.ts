/**
 * ImageKit configuration for file uploads
 * Using @imagekit/nodejs SDK v7 - Resource-based API
 */

import ImageKit from '@imagekit/nodejs';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
    console.warn('⚠️  IMAGEKIT_PUBLIC_KEY not set');
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    console.warn('⚠️  IMAGEKIT_PRIVATE_KEY not set');
}

if (!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
    console.warn('⚠️  IMAGEKIT_URL_ENDPOINT not set');
}

// ImageKit client configuration
// SDK v7 has incorrect TypeScript definitions - using type assertion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const imagekit = new (ImageKit as any)({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''
});

/**
 * Upload file to ImageKit cloud storage
 * Uses the correct v7 API: client.files.upload()
 */
export const uploadToImageKit = async (
    file: Buffer,
    fileName: string,
    folder: string = 'trebound-workflow'
): Promise<{ url: string; fileId: string }> => {

    // Strict validation - MUST have credentials
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
        throw new Error(
            'ImageKit credentials missing! Please add to .env:\n' +
            'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="..."\n' +
            'IMAGEKIT_PRIVATE_KEY="..."\n' +
            'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"'
        );
    }

    try {
        console.log(`📤 Uploading to ImageKit: ${fileName} to folder: ${folder}`);

        // CORRECT API v7: imagekit.files.upload() 
        // Documented at: https://github.com/imagekit-developer/imagekit-nodejs
        const uploadResponse = await imagekit.files.upload({
            file: file.toString('base64'), // Convert buffer to base64 string
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true, // Prevent overwrites
        });

        console.log(`✅ Upload successful:`, {
            url: uploadResponse.url,
            fileId: uploadResponse.fileId,
            name: uploadResponse.name
        });

        return {
            url: uploadResponse.url,
            fileId: uploadResponse.fileId
        };

    } catch (error: unknown) {
        console.error('❌ ImageKit upload failed:', error);

        // Provide helpful error messages
        const errMsg = (error as Error)?.message;
        if (errMsg?.includes('signature')) {
            throw new Error('ImageKit authentication failed. Check your IMAGEKIT_PRIVATE_KEY is correct.');
        }

        if (errMsg?.includes('publicKey')) {
            throw new Error('ImageKit public key invalid. Check your NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.');
        }

        throw new Error(`ImageKit upload error: ${errMsg || String(error)}`);
    }
};

/**
 * Delete file from ImageKit
 */
export const deleteFromImageKit = async (fileId: string): Promise<void> => {
    if (!fileId || fileId.startsWith('mock_')) {
        console.log('⏭️  Skipping delete for mock file ID');
        return;
    }

    try {
        await imagekit.files.delete(fileId);
        console.log(`🗑️  Deleted file: ${fileId}`);
    } catch (error: unknown) {
        console.error('❌ ImageKit delete failed:', error);
        throw new Error(`Failed to delete file: ${(error as Error)?.message || String(error)}`);
    }
};

/**
 * Get ImageKit URL with transformations
 */
export const getImageKitURL = (
    path: string,
    transformation?: {
        width?: number;
        height?: number;
        quality?: number;
    }
): string => {
    const transformationParams = [];

    if (transformation?.width) {
        transformationParams.push(`w-${transformation.width}`);
    }

    if (transformation?.height) {
        transformationParams.push(`h-${transformation.height}`);
    }

    if (transformation?.quality) {
        transformationParams.push(`q-${transformation.quality}`);
    }

    const transformationString = transformationParams.length > 0
        ? `tr:${transformationParams.join(',')}`
        : '';

    return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${transformationString}/${path}`;
};
