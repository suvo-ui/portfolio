import express from "express";

import sql from "../config/db.js";
import { recordAuditEvent } from "../lib/audit.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import {
  parseBoolean,
  parseOptionalNumber,
  parsePositiveId,
  requireString,
  optionalString,
  requireUrl,
} from "../lib/validation.js";
import { extractPublicObjectPath } from "../lib/storage.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const MAX_ARTWORK_PRICE_INR = 10_000_000;
const adminArtworkLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyPrefix: "admin-artwork",
});
const destructiveArtworkLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 8,
  keyPrefix: "admin-artwork-delete",
  message: "Too many destructive artwork actions. Please slow down.",
});

async function ensureActiveCategory(tx, categoryId) {
  const categoryRows = await tx`
    SELECT id
    FROM categories
    WHERE id = ${categoryId}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  if (!categoryRows[0]) {
    throw new HttpError(400, "Selected category does not exist");
  }
}

function validateStoredArtworkUrl(value) {
  const imageUrl = requireUrl(value, { field: "image URL" });

  if (!extractPublicObjectPath(imageUrl, "artworks")) {
    throw new HttpError(
      400,
      "Image URL must point to a stored artwork image",
    );
  }

  return imageUrl;
}

function normalizeCreatePayload(body) {
  const payload = {
    title: requireString(body?.title, {
      field: "title",
      maxLength: 160,
    }),
    description: optionalString(body?.description, {
      field: "description",
      maxLength: 3000,
    }),
    categoryId: parsePositiveId(body?.category_id, "category id"),
    imageUrl: validateStoredArtworkUrl(body?.image_url),
    priceInr: parseOptionalNumber(body?.price_inr, {
      field: "price",
      min: 0,
      max: MAX_ARTWORK_PRICE_INR,
    }),
    size: optionalString(body?.size, {
      field: "size",
      maxLength: 100,
    }),
    availableForPrint:
      parseBoolean(body?.available_for_print, {
        field: "available for print",
        defaultValue: false,
      }) ?? false,
    forSale:
      parseBoolean(body?.for_sale, {
        field: "for sale",
        defaultValue: false,
      }) ?? false,
  };

  if (payload.forSale && payload.priceInr === null) {
    throw new HttpError(400, "Price is required when artwork is for sale");
  }

  return payload;
}

function normalizeUpdatePayload(body) {
  return {
    title:
      body?.title === undefined
        ? undefined
        : requireString(body.title, {
            field: "title",
            maxLength: 160,
          }),
    description:
      body?.description === undefined
        ? undefined
        : optionalString(body.description, {
            field: "description",
            maxLength: 3000,
          }),
    categoryId:
      body?.category_id === undefined
        ? undefined
        : parsePositiveId(body.category_id, "category id"),
    imageUrl:
      body?.image_url === undefined
        ? undefined
        : validateStoredArtworkUrl(body.image_url),
    priceInr:
      body?.price_inr === undefined
        ? undefined
        : parseOptionalNumber(body.price_inr, {
            field: "price",
            min: 0,
            max: MAX_ARTWORK_PRICE_INR,
          }),
    size:
      body?.size === undefined
        ? undefined
        : optionalString(body.size, {
            field: "size",
            maxLength: 100,
          }),
    availableForPrint: parseBoolean(body?.available_for_print, {
      field: "available for print",
      defaultValue: undefined,
    }),
    forSale: parseBoolean(body?.for_sale, {
      field: "for sale",
      defaultValue: undefined,
    }),
  };
}

router.post(
  "/artworks",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const payload = normalizeCreatePayload(req.body);

      const createdArtwork = await sql.begin(async (tx) => {
        await ensureActiveCategory(tx, payload.categoryId);

        const createdRows = await tx`
          INSERT INTO artworks (
            title,
            description,
            category_id,
            image_url,
            price_inr,
            size,
            available_for_print,
            for_sale
          )
          VALUES (
            ${payload.title},
            ${payload.description},
            ${payload.categoryId},
            ${payload.imageUrl},
            ${payload.priceInr},
            ${payload.size},
            ${payload.availableForPrint},
            ${payload.forSale}
          )
          RETURNING *;
        `;
        const created = createdRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "artwork_create",
          entityType: "artwork",
          entityId: created.id,
          after: created,
          req,
        });

        return created;
      });

      return res.status(201).json(createdArtwork);
    } catch (err) {
      return sendRouteError(res, err, "Failed to save artwork");
    }
  },
);

router.put(
  "/artworks/:id",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const artworkId = parsePositiveId(req.params.id, "artwork id");
      const payload = normalizeUpdatePayload(req.body);

      const updatedArtwork = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM artworks
          WHERE id = ${artworkId}
            AND deleted_at IS NULL
          LIMIT 1;
        `;
        const existing = existingRows[0] || null;

        if (!existing) {
          throw new HttpError(404, "Artwork not found");
        }

        const nextArtwork = {
          title: payload.title ?? existing.title,
          description:
            payload.description !== undefined
              ? payload.description
              : existing.description,
          category_id: payload.categoryId ?? existing.category_id,
          image_url: payload.imageUrl ?? existing.image_url,
          price_inr:
            payload.priceInr !== undefined
              ? payload.priceInr
              : existing.price_inr,
          size: payload.size !== undefined ? payload.size : existing.size,
          available_for_print:
            payload.availableForPrint ?? existing.available_for_print,
          for_sale: payload.forSale ?? existing.for_sale,
        };

        await ensureActiveCategory(tx, nextArtwork.category_id);

        if (nextArtwork.for_sale && nextArtwork.price_inr === null) {
          throw new HttpError(
            400,
            "Price is required when artwork is for sale",
          );
        }

        const updatedRows = await tx`
          UPDATE artworks
          SET
            title = ${nextArtwork.title},
            description = ${nextArtwork.description},
            category_id = ${nextArtwork.category_id},
            image_url = ${nextArtwork.image_url},
            price_inr = ${nextArtwork.price_inr},
            size = ${nextArtwork.size},
            available_for_print = ${nextArtwork.available_for_print},
            for_sale = ${nextArtwork.for_sale}
          WHERE id = ${artworkId}
          RETURNING *;
        `;
        const updated = updatedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "artwork_update",
          entityType: "artwork",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updated;
      });

      return res.json(updatedArtwork);
    } catch (err) {
      return sendRouteError(res, err, "Failed to update artwork");
    }
  },
);

router.patch(
  "/artworks/:id/sold",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const artworkId = parsePositiveId(req.params.id, "artwork id");
      const isSold = parseBoolean(req.body?.is_sold, {
        field: "sold status",
        defaultValue: null,
      });

      if (isSold === null) {
        throw new HttpError(400, "Sold status is required");
      }

      const updatedArtwork = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM artworks
          WHERE id = ${artworkId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const existing = existingRows[0] || null;

        if (!existing) {
          throw new HttpError(404, "Artwork not found");
        }

        const updatedRows = await tx`
          UPDATE artworks
          SET is_sold = ${isSold}
          WHERE id = ${artworkId}
          RETURNING *
        `;
        const updated = updatedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "artwork_sold_toggle",
          entityType: "artwork",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updated;
      });

      return res.json(updatedArtwork);
    } catch (err) {
      return sendRouteError(res, err, "Failed to update sold status");
    }
  },
);

router.delete(
  "/artworks/:id",
  adminAuth,
  destructiveArtworkLimiter,
  async (req, res) => {
    try {
      const artworkId = parsePositiveId(req.params.id, "artwork id");

      await sql.begin(async (tx) => {
        const artworkRows = await tx`
          SELECT *
          FROM artworks
          WHERE id = ${artworkId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const artwork = artworkRows[0] || null;

        if (!artwork) {
          throw new HttpError(404, "Artwork not found");
        }

        const deletedRows = await tx`
          UPDATE artworks
          SET deleted_at = NOW()
          WHERE id = ${artworkId}
          RETURNING *
        `;
        const deletedArtwork = deletedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "artwork_soft_delete",
          entityType: "artwork",
          entityId: deletedArtwork.id,
          before: artwork,
          after: deletedArtwork,
          req,
        });
      });

      return res.json({ success: true });
    } catch (err) {
      return sendRouteError(res, err, "Failed to delete artwork");
    }
  },
);

export default router;
