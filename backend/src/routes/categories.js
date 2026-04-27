import express from "express";

import sql from "../config/db.js";
import { recordAuditEvent } from "../lib/audit.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import { parsePositiveId, requireString } from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const adminCategoryLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyPrefix: "admin-category",
});
const destructiveCategoryLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 8,
  keyPrefix: "admin-category-delete",
  message: "Too many destructive category actions. Please slow down.",
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await sql`
      SELECT id, name, created_at
      FROM categories
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `;

    return res.json(categories);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch categories");
  }
});

router.post(
  "/admin/categories",
  adminAuth,
  adminCategoryLimiter,
  async (req, res) => {
    try {
      const name = requireString(req.body?.name, {
        field: "category name",
        maxLength: 80,
      });

      const category = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM categories
          WHERE LOWER(name) = LOWER(${name})
          LIMIT 1
        `;
        const existing = existingRows[0] || null;

        if (existing && existing.deleted_at === null) {
          throw new HttpError(400, "Category already exists");
        }

        if (existing && existing.deleted_at !== null) {
          const restoredRows = await tx`
            UPDATE categories
            SET deleted_at = NULL
            WHERE id = ${existing.id}
            RETURNING *
          `;
          const restored = restoredRows[0];

          await recordAuditEvent(tx, {
            adminId: req.adminId,
            action: "category_restore",
            entityType: "category",
            entityId: restored.id,
            before: existing,
            after: restored,
            req,
          });

          return restored;
        }

        const createdRows = await tx`
          INSERT INTO categories (name)
          VALUES (${name})
          RETURNING *
        `;
        const created = createdRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "category_create",
          entityType: "category",
          entityId: created.id,
          after: created,
          req,
        });

        return created;
      });

      return res.status(201).json(category);
    } catch (err) {
      return sendRouteError(res, err, "Failed to create category");
    }
  },
);

router.delete(
  "/admin/categories/:id",
  adminAuth,
  destructiveCategoryLimiter,
  async (req, res) => {
    try {
      const categoryId = parsePositiveId(req.params.id, "category id");

      await sql.begin(async (tx) => {
        const categoryRows = await tx`
          SELECT *
          FROM categories
          WHERE id = ${categoryId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const category = categoryRows[0] || null;

        if (!category) {
          throw new HttpError(404, "Category not found");
        }

        const artworkRows = await tx`
          SELECT id
          FROM artworks
          WHERE category_id = ${categoryId}
            AND deleted_at IS NULL
          LIMIT 1
        `;

        if (artworkRows.length > 0) {
          throw new HttpError(
            409,
            "Category is still assigned to active artworks",
          );
        }

        const deletedRows = await tx`
          UPDATE categories
          SET deleted_at = NOW()
          WHERE id = ${categoryId}
          RETURNING *
        `;
        const deletedCategory = deletedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "category_delete",
          entityType: "category",
          entityId: deletedCategory.id,
          before: category,
          after: deletedCategory,
          req,
        });
      });

      return res.json({ success: true });
    } catch (err) {
      return sendRouteError(res, err, "Failed to delete category");
    }
  },
);

export default router;
