// AdminUsersController: admin user management endpoints
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  GetAdminUsersHandler,
  GetAdminUserByIdHandler,
  CreateAdminUserHandler,
  UpdateAdminUserHandler,
  DeleteAdminUserHandler
} from '@src/services/adminUsers/adminUser.handler.js';

class AdminUsersController {
  /**
   * GET /api/v1/admin-users
   */
  static async getAdminUsers(req, res, next) {
    const result = await GetAdminUsersHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Admin users retrieved successfully');
  }

  /**
   * GET /api/v1/admin-users/:id
   */
  static async getAdminUserById(req, res, next) {
    const result = await GetAdminUserByIdHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Admin user retrieved successfully');
  }

  /**
   * POST /api/v1/admin-users (super admin only, enforced in the handler)
   */
  static async createAdminUser(req, res, next) {
    const result = await CreateAdminUserHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Admin user created successfully');
  }

  /**
   * PATCH /api/v1/admin-users/:id (super admin only, enforced in the handler)
   */
  static async updateAdminUser(req, res, next) {
    const result = await UpdateAdminUserHandler.execute({ ...req.params, ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Admin user updated successfully');
  }

  /**
   * DELETE /api/v1/admin-users/:id (super admin only, enforced in the handler)
   */
  static async deleteAdminUser(req, res, next) {
    const result = await DeleteAdminUserHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Admin user deleted successfully');
  }
}

export default AdminUsersController;
