// UsersController: user-backend app user management endpoints
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  GetUsersHandler,
  GetUserByIdHandler,
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler
} from '@src/services/users/user.handler.js';

class UsersController {
  /**
   * GET /api/v1/users
   */
  static async getUsers(req, res, next) {
    const result = await GetUsersHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Users retrieved successfully');
  }

  /**
   * GET /api/v1/users/:id
   */
  static async getUserById(req, res, next) {
    const result = await GetUserByIdHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'User retrieved successfully');
  }

  /**
   * POST /api/v1/users (super admin only, enforced in the handler)
   */
  static async createUser(req, res, next) {
    const result = await CreateUserHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'User created successfully');
  }

  /**
   * PATCH /api/v1/users/:id (super admin only, enforced in the handler)
   */
  static async updateUser(req, res, next) {
    const result = await UpdateUserHandler.execute({ ...req.params, ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'User updated successfully');
  }

  /**
   * DELETE /api/v1/users/:id (super admin only, enforced in the handler)
   */
  static async deleteUser(req, res, next) {
    const result = await DeleteUserHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'User deleted successfully');
  }
}

export default UsersController;
