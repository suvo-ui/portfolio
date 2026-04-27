export async function recordAuditEvent(
  executor,
  { adminId = null, action, entityType, entityId = null, before = null, after = null, req = null },
) {
  await executor`
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      entity_type,
      entity_id,
      before_state,
      after_state,
      ip_address,
      user_agent
    )
    VALUES (
      ${adminId},
      ${action},
      ${entityType},
      ${entityId === null ? null : String(entityId)},
      ${before ? JSON.stringify(before) : null},
      ${after ? JSON.stringify(after) : null},
      ${req?.ip ?? null},
      ${req?.get?.("user-agent") ?? null}
    )
  `;
}
