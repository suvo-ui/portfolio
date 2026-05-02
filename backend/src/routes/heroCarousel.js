import express from "express";
import sql from "../config/db.js";
import { sendRouteError } from "../lib/http.js";

const router = express.Router();

/**
 * ADMIN: Get all hero carousel images
 * Shows active + inactive images
 */
router.get("/", async (req, res) => {
  try {
    const result = await sql`
      SELECT
        id,
        image_url,
        title,
        position,
        active,
        created_at
      FROM hero_carousel_images
      ORDER BY position ASC, created_at DESC;
    `;

    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch hero carousel images");
  }
});

/**
 * ADMIN: Create hero carousel image
 * Defaults to active = true
 */
router.post("/", async (req, res) => {
  try {
    const { image_url, title, position, active } = req.body;

    if (!image_url || !title) {
      return res.status(400).json({
        error: "image_url and title are required.",
      });
    }

    const result = await sql`
      INSERT INTO hero_carousel_images (
        image_url,
        title,
        position,
        active
      )
      VALUES (
        ${image_url},
        ${title},
        ${position ?? 0},
        ${active ?? true}
      )
      RETURNING
        id,
        image_url,
        title,
        position,
        active,
        created_at;
    `;

    return res.status(201).json(result[0]);
  } catch (err) {
    return sendRouteError(res, err, "Failed to create hero carousel image");
  }
});

/**
 * ADMIN: Update hero carousel image
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Invalid image id.",
      });
    }

    const { image_url, title, position, active } = req.body;

    const result = await sql`
      UPDATE hero_carousel_images
      SET
        image_url = COALESCE(${image_url}, image_url),
        title = COALESCE(${title}, title),
        position = COALESCE(${position}, position),
        active = COALESCE(${active}, active)
      WHERE id = ${id}
      RETURNING
        id,
        image_url,
        title,
        position,
        active,
        created_at;
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: "Hero carousel image not found.",
      });
    }

    return res.json(result[0]);
  } catch (err) {
    return sendRouteError(res, err, "Failed to update hero carousel image");
  }
});

/**
 * ADMIN: Delete hero carousel image
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Invalid image id.",
      });
    }

    const result = await sql`
      DELETE FROM hero_carousel_images
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: "Hero carousel image not found.",
      });
    }

    return res.json({
      success: true,
      message: "Hero carousel image deleted successfully.",
    });
  } catch (err) {
    return sendRouteError(res, err, "Failed to delete hero carousel image");
  }
});

export default router;
