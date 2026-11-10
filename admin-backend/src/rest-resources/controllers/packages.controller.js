// PackagesController: handles package endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  GetPackagesHandler,
  GetPackageByIdHandler,
  CreatePackageHandler,
  UpdatePackageHandler,
  DeletePackageHandler
} from '@src/services/packages/package.handler.js';

class PackagesController {
  /**
   * GET /api/v1/packages
   * List packages with pagination and optional isActive filter.
   */
  static async getPackages(req, res, next) {
    const result = await GetPackagesHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Packages retrieved successfully');
  }

  /**
   * GET /api/v1/packages/:id
   */
  static async getPackageById(req, res, next) {
    const result = await GetPackageByIdHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Package retrieved successfully');
  }

  /**
   * POST /api/v1/packages
   */
  static async createPackage(req, res, next) {
    const result = await CreatePackageHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Package created successfully');
  }

  /**
   * PUT /api/v1/packages/:id
   */
  static async updatePackage(req, res, next) {
    const result = await UpdatePackageHandler.execute({ ...req.params, ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Package updated successfully');
  }

  /**
   * DELETE /api/v1/packages/:id
   */
  static async deletePackage(req, res, next) {
    const result = await DeletePackageHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Package deleted successfully');
  }
}

export default PackagesController;
