// src/db/models/blog.model.js
export default (sequelize, DataTypes) => {
  const Blog = sequelize.define('Blog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      }
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Inline images: [{ url, altText, isCover, sortOrder }]
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'admin_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'blogs',
    underscored: true,
    timestamps: true,
    paranoid: true
  });

  Blog.associate = (models) => {
    Blog.belongsTo(models.AdminUser, { foreignKey: 'authorId', as: 'author' });
  };

  return Blog;
};
