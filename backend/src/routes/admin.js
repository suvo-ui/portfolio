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
import { extractPublicObjectPath, IMAGE_VARIANT_KEYS } from "../lib/storage.js";
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
    throw new HttpError(400, "Image URL must point to a stored artwork image");
  }

  return imageUrl;
}

function validateStoredHeroImageUrl(value) {
  const imageUrl = requireUrl(value, { field: "image URL" });

  if (!extractPublicObjectPath(imageUrl, "artworks")) {
    throw new HttpError(400, "Image URL must point to a stored image");
  }

  return imageUrl;
}

function validateStoredImageVariants(value, bucketName = "artworks") {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Image variants must be an object");
  }

  const variants = {};

  for (const key of IMAGE_VARIANT_KEYS) {
    const rawUrl = value[key];
    if (rawUrl === undefined || rawUrl === null || rawUrl === "") {
      continue;
    }

    const imageUrl = requireUrl(rawUrl, { field: `${key} image URL` });

    if (!extractPublicObjectPath(imageUrl, bucketName)) {
      throw new HttpError(400, `${key} image URL must point to stored media`);
    }

    variants[key] = imageUrl;
  }

  return Object.keys(variants).length > 0 ? variants : null;
}

function toJsonb(value) {
  return value ? JSON.stringify(value) : null;
}

function normalizeCreateHeroPayload(body) {
  return {
    title: requireString(body?.title, {
      field: "title",
      maxLength: 160,
    }),
    imageUrl: validateStoredHeroImageUrl(body?.image_url),
    imageVariants:
      validateStoredImageVariants(body?.image_variants, "artworks") ?? null,
    position:
      parseOptionalNumber(body?.position, {
        field: "position",
        min: 0,
        defaultValue: 0,
      }) ?? 0,
    active:
      parseBoolean(body?.active, {
        field: "active",
        defaultValue: true,
      }) ?? true,
  };
}

function normalizeUpdateHeroPayload(body) {
  return {
    title:
      body?.title === undefined
        ? undefined
        : requireString(body.title, {
            field: "title",
            maxLength: 160,
          }),
    imageUrl:
      body?.image_url === undefined
        ? undefined
        : validateStoredHeroImageUrl(body.image_url),
    imageVariants:
      body?.image_variants === undefined
        ? undefined
        : validateStoredImageVariants(body.image_variants, "artworks"),
    position:
      body?.position === undefined
        ? undefined
        : parseOptionalNumber(body.position, {
            field: "position",
            min: 0,
          }),
    active: parseBoolean(body?.active, {
      field: "active",
      defaultValue: undefined,
    }),
  };
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
    imageVariants:
      validateStoredImageVariants(body?.image_variants, "artworks") ?? null,

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

    // ✅ ADD THIS
    isSold:
      parseBoolean(body?.is_sold, {
        field: "sold",
        defaultValue: false,
      }) ?? false,
  };

  // 🔥 ENFORCE LOGIC (critical)
  if (payload.isSold) {
    payload.forSale = false;
  }

  if (payload.forSale) {
    payload.isSold = false;
  }

  // 🔴 VALIDATION
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
    imageVariants:
      body?.image_variants === undefined
        ? undefined
        : validateStoredImageVariants(body.image_variants, "artworks"),

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

    // ✅ ADD THIS
    isSold: parseBoolean(body?.is_sold, {
      field: "sold",
      defaultValue: undefined,
    }),
  };
}

function normalizeCreatePrintPayload(body) {
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
    imageVariants:
      validateStoredImageVariants(body?.image_variants, "artworks") ?? null,
    priceInr: parseOptionalNumber(body?.price_inr, {
      field: "price",
      min: 0,
      max: MAX_ARTWORK_PRICE_INR,
    }),
    size: optionalString(body?.size, {
      field: "size",
      maxLength: 100,
    }),
    forSale: parseBoolean(body?.for_sale, {
      field: "for sale",
      defaultValue: false,
    }),

    isSold:
      parseBoolean(body?.is_sold, {
        field: "sold",
        defaultValue: false,
      }) ?? false,
  };

  if (payload.isSold) {
    payload.forSale = false;
  }

  if (payload.forSale) {
    payload.isSold = false;
  }

  if (payload.forSale && payload.priceInr === null) {
    throw new HttpError(400, "Price is required when print is for sale");
  }

  return payload;
}

function normalizeUpdatePrintPayload(body) {
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
    imageVariants:
      body?.image_variants === undefined
        ? undefined
        : validateStoredImageVariants(body.image_variants, "artworks"),
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
    forSale: parseBoolean(body?.for_sale, {
      field: "for sale",
      defaultValue: undefined,
    }),

    isSold: parseBoolean(body?.is_sold, {
      field: "sold",
      defaultValue: undefined,
    }),
  };
}

async function syncArtworkPrintRecord(tx, artwork) {
  if (!artwork?.id) return;

  if (!artwork.available_for_print) {
    await tx`
      UPDATE prints
      SET deleted_at = NOW()
      WHERE source_artwork_id = ${artwork.id}
        AND deleted_at IS NULL
    `;
    return;
  }

  const existingPrintRows = await tx`
    SELECT id, is_sold
    FROM prints
    WHERE source_artwork_id = ${artwork.id}
    LIMIT 1
  `;
  const existingPrint = existingPrintRows[0] || null;

  if (existingPrint) {
    await tx`
      UPDATE prints
      SET
        title = ${artwork.title},
        description = ${artwork.description},
        category_id = ${artwork.category_id},
        image_url = ${artwork.image_url},
        image_variants = ${toJsonb(artwork.image_variants)}::jsonb,
        price_inr = ${artwork.price_inr},
        size = ${artwork.size},
        for_sale = ${artwork.for_sale},
        deleted_at = NULL
      WHERE id = ${existingPrint.id}
    `;
    return;
  }

  await tx`
    INSERT INTO prints (
      title,
      description,
      category_id,
      image_url,
      image_variants,
      source_artwork_id,
      price_inr,
      size,
      is_sold,
      for_sale
    )
    VALUES (
      ${artwork.title},
      ${artwork.description},
      ${artwork.category_id},
      ${artwork.image_url},
      ${toJsonb(artwork.image_variants)}::jsonb,
      ${artwork.id},
      ${artwork.price_inr},
      ${artwork.size},
      FALSE,
      ${artwork.for_sale}
    )
  `;
}

router.post("/artworks", adminAuth, adminArtworkLimiter, async (req, res) => {
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
            image_variants,
            price_inr,
            size,
            available_for_print,
            for_sale,
            is_sold
          )
          VALUES (
            ${payload.title},
            ${payload.description},
            ${payload.categoryId},
            ${payload.imageUrl},
            ${toJsonb(payload.imageVariants)}::jsonb,
            ${payload.priceInr},
            ${payload.size},
            ${payload.availableForPrint},
            ${payload.forSale},
            ${payload.isSold}
          )
          RETURNING *;
        `;
      const created = createdRows[0];

      await syncArtworkPrintRecord(tx, created);

      const createdWithCategoryRows = await tx`
        SELECT artworks.*, categories.name AS category
        FROM artworks
        LEFT JOIN categories ON artworks.category_id = categories.id
        WHERE artworks.id = ${created.id}
        LIMIT 1;
      `;
      const createdWithCategory = createdWithCategoryRows[0];

      await recordAuditEvent(tx, {
        adminId: req.adminId,
        action: "artwork_create",
        entityType: "artwork",
        entityId: created.id,
        after: created,
        req,
      });

      return createdWithCategory;
    });

    return res.status(201).json(createdArtwork);
  } catch (err) {
    return sendRouteError(res, err, "Failed to save artwork");
  }
});

router.put(
  "/artworks/:id",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const artworkId = parsePositiveId(req.params.id, "artwork id");
      const payload = normalizeUpdatePayload(req.body);

      console.log("Artwork update payload:", JSON.stringify(payload, null, 2));
      console.log("Artwork ID:", artworkId);

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
          image_variants:
            payload.imageVariants !== undefined
              ? payload.imageVariants
              : payload.imageUrl !== undefined &&
                  payload.imageUrl !== existing.image_url
                ? null
                : existing.image_variants,

          price_inr:
            payload.priceInr !== undefined
              ? payload.priceInr
              : existing.price_inr,

          size: payload.size !== undefined ? payload.size : existing.size,

          available_for_print:
            payload.availableForPrint ?? existing.available_for_print,

          for_sale: payload.forSale ?? existing.for_sale,

          // 🔥 ADD THIS LINE
          is_sold:
            payload.isSold !== undefined ? payload.isSold : existing.is_sold,
        };

        if (nextArtwork.is_sold) {
          nextArtwork.for_sale = false;
        }

        if (nextArtwork.for_sale) {
          nextArtwork.is_sold = false;
        }

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
            image_variants = ${toJsonb(nextArtwork.image_variants)}::jsonb,
            price_inr = ${nextArtwork.price_inr},
            size = ${nextArtwork.size},
            available_for_print = ${nextArtwork.available_for_print},
            for_sale = ${nextArtwork.for_sale},
            is_sold = ${nextArtwork.is_sold}
          WHERE id = ${artworkId}
          RETURNING *;
        `;
        const updated = updatedRows[0];

        await syncArtworkPrintRecord(tx, updated);

        const updatedWithCategoryRows = await tx`
          SELECT artworks.*, categories.name AS category
          FROM artworks
          LEFT JOIN categories ON artworks.category_id = categories.id
          WHERE artworks.id = ${updated.id}
          LIMIT 1;
        `;
        const updatedWithCategory = updatedWithCategoryRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "artwork_update",
          entityType: "artwork",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updatedWithCategory;
      });

      return res.json(updatedArtwork);
    } catch (err) {
      console.error("Artwork update error:", err);
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

        await tx`
          UPDATE prints
          SET deleted_at = NOW()
          WHERE source_artwork_id = ${artworkId}
            AND deleted_at IS NULL
        `;

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

router.post("/prints", adminAuth, adminArtworkLimiter, async (req, res) => {
  try {
    const payload = normalizeCreatePrintPayload(req.body);

    const createdPrint = await sql.begin(async (tx) => {
      await ensureActiveCategory(tx, payload.categoryId);

      const createdRows = await tx`
        INSERT INTO prints (
          title,
          description,
          category_id,
          image_url,
          image_variants,
          price_inr,
          size,
          is_sold,
          for_sale
        )
        VALUES (
          ${payload.title},
          ${payload.description},
          ${payload.categoryId},
          ${payload.imageUrl},
          ${toJsonb(payload.imageVariants)}::jsonb,
          ${payload.priceInr},
          ${payload.size},
          ${payload.isSold},
          ${payload.forSale}
        )
        RETURNING *;
      `;
      const created = createdRows[0];

      const createdWithCategoryRows = await tx`
        SELECT prints.*, categories.name AS category
        FROM prints
        LEFT JOIN categories ON prints.category_id = categories.id
        WHERE prints.id = ${created.id}
        LIMIT 1;
      `;
      const createdWithCategory = createdWithCategoryRows[0];

      await recordAuditEvent(tx, {
        adminId: req.adminId,
        action: "print_create",
        entityType: "print",
        entityId: created.id,
        before: null,
        after: created,
        req,
      });

      return createdWithCategory;
    });

    return res.status(201).json(createdPrint);
  } catch (err) {
    return sendRouteError(res, err, "Failed to create print");
  }
});

router.put("/prints/:id", adminAuth, adminArtworkLimiter, async (req, res) => {
  try {
    const printId = parsePositiveId(req.params.id, "print id");
    const payload = normalizeUpdatePrintPayload(req.body);

    const updatedPrint = await sql.begin(async (tx) => {
      const existingRows = await tx`
          SELECT *
          FROM prints
          WHERE id = ${printId}
            AND deleted_at IS NULL
          LIMIT 1;
        `;
      const existing = existingRows[0] || null;

      if (!existing) {
        throw new HttpError(404, "Print not found");
      }

      const nextPrint = {
        title: payload.title ?? existing.title,
        description:
          payload.description !== undefined
            ? payload.description
            : existing.description,
        category_id: payload.categoryId ?? existing.category_id,
        image_url: payload.imageUrl ?? existing.image_url,
        image_variants:
          payload.imageVariants !== undefined
            ? payload.imageVariants
            : payload.imageUrl !== undefined &&
                payload.imageUrl !== existing.image_url
              ? null
              : existing.image_variants,
        price_inr:
          payload.priceInr !== undefined
            ? payload.priceInr
            : existing.price_inr,
        size: payload.size !== undefined ? payload.size : existing.size,
        for_sale: payload.forSale ?? existing.for_sale,
        is_sold:
          payload.isSold !== undefined ? payload.isSold : existing.is_sold,
      };

      if (nextPrint.is_sold) {
        nextPrint.for_sale = false;
      }

      if (nextPrint.for_sale) {
        nextPrint.is_sold = false;
      }

      await ensureActiveCategory(tx, nextPrint.category_id);

      if (nextPrint.for_sale && nextPrint.price_inr === null) {
        throw new HttpError(400, "Price is required when print is for sale");
      }

      const updatedRows = await tx`
          UPDATE prints
          SET
            title = ${nextPrint.title},
            description = ${nextPrint.description},
            category_id = ${nextPrint.category_id},
            image_url = ${nextPrint.image_url},
            image_variants = ${toJsonb(nextPrint.image_variants)}::jsonb,
            price_inr = ${nextPrint.price_inr},
            size = ${nextPrint.size},
            is_sold = ${nextPrint.is_sold},
            for_sale = ${nextPrint.for_sale}
          WHERE id = ${printId}
          RETURNING *;
        `;
      const updated = updatedRows[0];

      const updatedWithCategoryRows = await tx`
        SELECT prints.*, categories.name AS category
        FROM prints
        LEFT JOIN categories ON prints.category_id = categories.id
        WHERE prints.id = ${updated.id}
        LIMIT 1;
      `;
      const updatedWithCategory = updatedWithCategoryRows[0];

      await recordAuditEvent(tx, {
        adminId: req.adminId,
        action: "print_update",
        entityType: "print",
        entityId: updated.id,
        before: existing,
        after: updated,
        req,
      });

      return updatedWithCategory;
    });

    return res.json(updatedPrint);
  } catch (err) {
    return sendRouteError(res, err, "Failed to update print");
  }
});

router.patch(
  "/prints/:id/sold",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const printId = parsePositiveId(req.params.id, "print id");
      const isSold = parseBoolean(req.body?.is_sold, {
        field: "sold status",
        defaultValue: null,
      });

      if (isSold === null) {
        throw new HttpError(400, "Sold status is required");
      }

      const updatedPrint = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM prints
          WHERE id = ${printId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const existing = existingRows[0] || null;

        if (!existing) {
          throw new HttpError(404, "Print not found");
        }

        const updatedRows = await tx`
          UPDATE prints
          SET
            is_sold = ${isSold},
            for_sale = CASE WHEN ${isSold} THEN FALSE ELSE for_sale END
          WHERE id = ${printId}
          RETURNING *
        `;
        const updated = updatedRows[0];

        const updatedWithCategoryRows = await tx`
          SELECT prints.*, categories.name AS category
          FROM prints
          LEFT JOIN categories ON prints.category_id = categories.id
          WHERE prints.id = ${updated.id}
          LIMIT 1;
        `;
        const updatedWithCategory = updatedWithCategoryRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "print_sold_toggle",
          entityType: "print",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updatedWithCategory;
      });

      return res.json(updatedPrint);
    } catch (err) {
      return sendRouteError(res, err, "Failed to update sold status");
    }
  },
);

router.delete(
  "/prints/:id",
  adminAuth,
  destructiveArtworkLimiter,
  async (req, res) => {
    try {
      const printId = parsePositiveId(req.params.id, "print id");

      await sql.begin(async (tx) => {
        const printRows = await tx`
          SELECT *
          FROM prints
          WHERE id = ${printId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const print = printRows[0] || null;

        if (!print) {
          throw new HttpError(404, "Print not found");
        }

        const deletedRows = await tx`
          UPDATE prints
          SET deleted_at = NOW()
          WHERE id = ${printId}
          RETURNING *
        `;
        const deletedPrint = deletedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "print_soft_delete",
          entityType: "print",
          entityId: deletedPrint.id,
          before: print,
          after: deletedPrint,
          req,
        });
      });

      return res.json({ success: true });
    } catch (err) {
      return sendRouteError(res, err, "Failed to delete print");
    }
  },
);

router.post(
  "/hero-carousel",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const payload = normalizeCreateHeroPayload(req.body);

      const createdImage = await sql.begin(async (tx) => {
        // If position is 0, auto-assign next position
        if (payload.position === 0) {
          const maxPosRows = await tx`
            SELECT COALESCE(MAX(position), 0) as max_pos
            FROM hero_carousel_images
          `;
          payload.position = maxPosRows[0].max_pos + 1;
        }

        const createdRows = await tx`
          INSERT INTO hero_carousel_images (
            image_url,
            image_variants,
            title,
            position,
            active
          )
          VALUES (
            ${payload.imageUrl},
            ${toJsonb(payload.imageVariants)}::jsonb,
            ${payload.title},
            ${payload.position},
            ${payload.active}
          )
          RETURNING *;
        `;
        const created = createdRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "hero_carousel_create",
          entityType: "hero_carousel_image",
          entityId: created.id,
          after: created,
          req,
        });

        return created;
      });

      return res.status(201).json(createdImage);
    } catch (err) {
      return sendRouteError(res, err, "Failed to save hero carousel image");
    }
  },
);

router.put(
  "/hero-carousel/:id",
  adminAuth,
  adminArtworkLimiter,
  async (req, res) => {
    try {
      const imageId = parsePositiveId(req.params.id, "image id");
      const payload = normalizeUpdateHeroPayload(req.body);

      const updatedImage = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM hero_carousel_images
          WHERE id = ${imageId}
          LIMIT 1;
        `;
        const existing = existingRows[0] || null;

        if (!existing) {
          throw new HttpError(404, "Hero carousel image not found");
        }

        const nextImage = {
          image_url: payload.imageUrl ?? existing.image_url,
          image_variants:
            payload.imageVariants !== undefined
              ? payload.imageVariants
              : payload.imageUrl !== undefined &&
                  payload.imageUrl !== existing.image_url
                ? null
                : existing.image_variants,
          title: payload.title ?? existing.title,
          position: payload.position ?? existing.position,
          active: payload.active ?? existing.active,
        };

        const updatedRows = await tx`
          UPDATE hero_carousel_images
          SET
            image_url = ${nextImage.image_url},
            image_variants = ${toJsonb(nextImage.image_variants)}::jsonb,
            title = ${nextImage.title},
            position = ${nextImage.position},
            active = ${nextImage.active}
          WHERE id = ${imageId}
          RETURNING *;
        `;
        const updated = updatedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "hero_carousel_update",
          entityType: "hero_carousel_image",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updated;
      });

      return res.json(updatedImage);
    } catch (err) {
      return sendRouteError(res, err, "Failed to update hero carousel image");
    }
  },
);

router.delete(
  "/hero-carousel/:id",
  adminAuth,
  destructiveArtworkLimiter,
  async (req, res) => {
    try {
      const imageId = parsePositiveId(req.params.id, "image id");

      await sql.begin(async (tx) => {
        const imageRows = await tx`
          SELECT *
          FROM hero_carousel_images
          WHERE id = ${imageId}
          LIMIT 1
        `;
        const image = imageRows[0] || null;

        if (!image) {
          throw new HttpError(404, "Hero carousel image not found");
        }

        await tx`
          DELETE FROM hero_carousel_images
          WHERE id = ${imageId}
        `;

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "hero_carousel_delete",
          entityType: "hero_carousel_image",
          entityId: imageId,
          before: image,
          req,
        });
      });

      return res.json({ success: true });
    } catch (err) {
      return sendRouteError(res, err, "Failed to delete hero carousel image");
    }
  },
);

router.get("/hero-carousel", adminAuth, async (req, res) => {
  try {
    const result = await sql`
        SELECT *
        FROM hero_carousel_images
        ORDER BY position ASC, created_at ASC;
      `;

    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch hero carousel images");
  }
});

export default router;
