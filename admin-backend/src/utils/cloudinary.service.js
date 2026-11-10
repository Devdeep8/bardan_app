// src/utils/cloudinary.service.js
// Cloudinary image service — server-side signed uploads + deletions via the
// REST API (no SDK dependency). Used by the uploads controller and by the
// blog handler to delete images that were removed on update.
import crypto from 'crypto';
import axios from 'axios';
import config from '@configs/app.config.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { Logger } from '@src/utils/logger.js';

const UPLOAD_TIMEOUT_MS = 30000;

// Validation rules for image uploads
const IMAGE_RULES = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  DEFAULT_FOLDER: 'boat-booking/blogs'
};

class CloudinaryService {
  constructor (rules = IMAGE_RULES) {
    this.rules = rules;
  }

  get cloudName () { return config.get('cloudinary.cloudName'); }
  get apiKey () { return config.get('cloudinary.apiKey'); }
  get apiSecret () { return config.get('cloudinary.apiSecret'); }

  get isConfigured () {
    return !!(this.cloudName && this.apiKey && this.apiSecret);
  }

  /**
   * Cloudinary signature: sha1 of "k1=v1&k2=v2..." (keys sorted) + api_secret.
   */
  signParams (params = {}) {
    const toSign = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== '')
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return crypto.createHash('sha1').update(toSign + this.apiSecret).digest('hex');
  }

  /**
   * Validate an incoming image before it goes anywhere near Cloudinary.
   * @throws {AppError} INVALID_INPUT when the mime type or size is not allowed
   */
  validateImage ({ buffer, mimetype }) {
    if (!buffer || buffer.length === 0) {
      throw AppError.badRequest('Image file is empty');
    }
    if (!this.rules.ALLOWED_MIME_TYPES.includes(mimetype)) {
      throw AppError.badRequest('Only JPG, PNG and WebP images are allowed');
    }
    if (buffer.length > this.rules.MAX_SIZE_BYTES) {
      throw AppError.badRequest('Image must be 5MB or smaller');
    }
    return true;
  }

  /**
   * Upload an in-memory image buffer to Cloudinary (signed).
   * @returns {Promise<{url: string, publicId: string, width: number, height: number, format: string, bytes: number}>}
   */
  async uploadImage ({ buffer, mimetype, filename = 'image', folder = this.rules.DEFAULT_FOLDER }) {
    if (!this.isConfigured) {
      throw new AppError(Errors.INTERNAL_ERROR, { message: 'Cloudinary is not configured' });
    }
    this.validateImage({ buffer, mimetype });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signParams({ folder, timestamp });

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimetype }), filename);
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    let response;
    try {
      response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        form,
        { timeout: UPLOAD_TIMEOUT_MS }
      );
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      Logger.error('Cloudinary upload failed', { message });
      throw new AppError(Errors.INTERNAL_ERROR, { message: `Image upload failed: ${message}` });
    }

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      width: response.data.width,
      height: response.data.height,
      format: response.data.format,
      bytes: response.data.bytes
    };
  }

  /**
   * Derive a Cloudinary public id from a stored delivery URL, e.g.
   * https://res.cloudinary.com/x/image/upload/c_limit,w_100/v1/folder/img.jpg
   * -> "folder/img" (used when an image row has no stored publicId).
   */
  static publicIdFromUrl (url) {
    if (!url || typeof url !== 'string') return null;
    const match = /\/image\/upload\/(.+)$/.exec(url);
    if (!match) return null;

    // Drop version (v123/) and transformation segments (c_limit,w_100/, f_auto/ …)
    const segments = match[1].split('/').filter(Boolean);
    while (segments.length > 1) {
      const segment = segments[0];
      const isVersion = /^v\d+$/.test(segment);
      const isTransformation = /^[a-z]{1,3}_[^/]*$/.test(segment);
      if (isVersion || isTransformation) {
        segments.shift();
      } else {
        break;
      }
    }

    const publicId = segments.join('/').replace(/\.[a-zA-Z0-9]+$/, '');
    return publicId || null;
  }

  /**
   * Delete a single Cloudinary asset by public id (signed destroy).
   * @returns {Promise<boolean>} true when destroyed, false when not found
   */
  async deleteImage (publicId) {
    if (!publicId) return false;
    if (!this.isConfigured) {
      Logger.warn('Cloudinary delete skipped — not configured', { publicId });
      return false;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signParams({ public_id: publicId, timestamp });

    const form = new FormData();
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('public_id', publicId);
    form.append('signature', signature);

    try {
      const { data } = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        form,
        { timeout: UPLOAD_TIMEOUT_MS }
      );
      return data?.result === 'ok';
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      Logger.error('Cloudinary delete failed', { publicId, message });
      return false;
    }
  }

  /**
   * Find which old images are gone from the new list. Images are matched by
   * publicId when both sides have one, otherwise by exact URL.
   */
  findRemovedImages (oldImages = [], newImages = []) {
    return oldImages.filter((oldImage) => {
      const oldPublicId = oldImage?.publicId || CloudinaryService.publicIdFromUrl(oldImage?.url);
      return !newImages.some((newImage) => {
        if (oldPublicId && newImage?.publicId && newImage.publicId === oldPublicId) return true;
        return newImage?.url === oldImage?.url;
      });
    });
  }

  /**
   * Delete the images that were removed between two versions of an image list
   * (e.g. a blog update). Failures are logged, never thrown — a Cloudinary
   * hiccup must not fail the update itself.
   * @returns {Promise<number>} how many assets were actually destroyed
   */
  async deleteRemovedImages (oldImages = [], newImages = []) {
    const removed = this.findRemovedImages(oldImages, newImages);
    let destroyed = 0;

    for (const image of removed) {
      const publicId = image?.publicId || CloudinaryService.publicIdFromUrl(image?.url);
      if (!publicId) continue;
      try {
        const ok = await this.deleteImage(publicId);
        if (ok) destroyed += 1;
      } catch (error) {
        Logger.warn('Failed to delete removed Cloudinary image', { publicId, error: error.message });
      }
    }

    if (removed.length > 0) {
      Logger.info('Cloudinary cleanup after image update', { removed: removed.length, destroyed });
    }
    return destroyed;
  }
}

export const cloudinaryService = new CloudinaryService();
export { CloudinaryService, IMAGE_RULES };
export default cloudinaryService;
