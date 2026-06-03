import { Shield, Users, Star, ForkKnife, TrendUp, MagnifyingGlass, Trash, ArrowLeft, X, UserGear, Warning } from "phosphor-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";

function AdminConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    function handleKeyDown(e) {
      if (e.key === "Escape") { onCancel(); return; }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" onClick={onCancel}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div className="modal-dialog" ref={dialogRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal-header">
              <Warning size={20} className="modal-icon" weight="thin" />
              <h2 id="admin-modal-title">{title}</h2>
            </div>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
              <motion.button className="danger-button" onClick={onConfirm} disabled={loading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {loading ? "Eliminando…" : <><Trash size={15} weight="thin" /> Eliminar</>}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AdminPanel({ token, user, tab, onTabChange, onBack }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const [message, setMessage] = useState(null);
  const [changingRole, setChangingRole] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userPageInput, setUserPageInput] = useState("");
  const [reviewPageInput, setReviewPageInput] = useState("");

  const showMessage = useCallback((text, type = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  useEffect(() => {
    if (tab === "dashboard") {
      setLoadingCount(c => c + 1);
      api.admin.getStats(token).then(setStats).catch((e) => showMessage(e.message)).finally(() => setLoadingCount(c => c - 1));
    }
  }, [tab, token, showMessage]);

  useEffect(() => {
    if (tab === "users") {
      setLoadingCount(c => c + 1);
      const params = { page: usersPagination.page, limit: 15 };
      if (userSearch.trim()) params.search = userSearch.trim();
      api.admin.listUsers(token, params).then((data) => {
        setUsers(data.items);
        setUsersPagination({ page: data.page, pages: data.pages, total: data.total });
      }).catch((e) => showMessage(e.message)).finally(() => setLoadingCount(c => c - 1));
    }
  }, [tab, usersPagination.page, userSearch, token, showMessage]);

  useEffect(() => {
    if (tab === "reviews") {
      setLoadingCount(c => c + 1);
      const params = { page: reviewsPagination.page, limit: 15 };
      if (reviewSearch.trim()) params.search = reviewSearch.trim();
      api.admin.listReviews(token, params).then((data) => {
        setReviews(data.items);
        setReviewsPagination({ page: data.page, pages: data.pages, total: data.total });
      }).catch((e) => showMessage(e.message)).finally(() => setLoadingCount(c => c - 1));
    }
  }, [tab, reviewsPagination.page, reviewSearch, token, showMessage]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    setChangingRole(userId);
    try {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      await api.admin.updateUserRole(token, userId, newRole);
      showMessage(`Rol actualizado a "${newRole}"`, "success");
    } catch (e) {
      showMessage(e.message);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u));
    } finally {
      setChangingRole(null);
    }
  }, [token, showMessage]);

  const handleCancelDelete = useCallback(() => setConfirmDelete(null), []);

  const handleConfirmDeleteReview = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await api.admin.deleteReview(token, confirmDelete.id);
      setReviews((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      showMessage("Reseña eliminada", "success");
      setConfirmDelete(null);
    } catch (e) {
      showMessage(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }, [token, confirmDelete, showMessage]);

  function handleUserPageJump(event) {
    event.preventDefault();
    const page = parseInt(userPageInput, 10);
    if (page >= 1 && page <= usersPagination.pages) {
      setUsersPagination(p => ({ ...p, page }));
      setUserPageInput("");
    }
  }

  function handleReviewPageJump(event) {
    event.preventDefault();
    const page = parseInt(reviewPageInput, 10);
    if (page >= 1 && page <= reviewsPagination.pages) {
      setReviewsPagination(p => ({ ...p, page }));
      setReviewPageInput("");
    }
  }

  if (user?.role !== "admin") {
    return (
      <main className="auth-shell">
        <section className="auth-panel" style={{ textAlign: "center" }}>
          <Shield size={40} weight="thin" style={{ color: "var(--brand)", marginBottom: 12 }} />
          <h1>Acceso restringido</h1>
          <p className="intro">No tienes permisos de administrador para acceder a esta sección.</p>
          <button className="primary-button" onClick={onBack} style={{ width: "auto", padding: "0 32px" }}>
            Volver al inicio
          </button>
        </section>
      </main>
    );
  }

  const activeClass = (name) => tab === name ? "admin-tab active" : "admin-tab";

  return (
    <motion.main className="admin-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <motion.header className="admin-topbar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <div className="admin-topbar-left">
          <motion.button className="icon-button" onClick={onBack} title="Volver" aria-label="Volver" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={20} weight="thin" />
          </motion.button>
          <Shield size={20} weight="thin" style={{ color: "var(--brand)" }} />
          <h1>Panel de administración</h1>
        </div>
        <div className="user-menu">
          <div className="user-avatar">{(user.name || "A").charAt(0).toUpperCase()}</div>
          <span className="user-name">{user.name}</span>
        </div>
      </motion.header>

      <motion.div className="admin-tabs" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
        <motion.button className={activeClass("dashboard")} onClick={() => onTabChange("dashboard")} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            <TrendUp size={16} weight="thin" /> Dashboard
        </motion.button>
        <motion.button className={activeClass("users")} onClick={() => onTabChange("users")} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            <Users size={16} weight="thin" /> Usuarios
        </motion.button>
        <motion.button className={activeClass("reviews")} onClick={() => onTabChange("reviews")} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            <ForkKnife size={16} weight="thin" /> Reseñas
        </motion.button>
      </motion.div>

      {message && (
        <motion.div className={`message-toast ${message.type}`} role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>{message.text}</motion.div>
      )}

      <motion.div className="admin-content" key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        {tab === "dashboard" && (
          <div className="admin-dashboard">
            {loading ? (
              <div className="admin-loading">Cargando estadísticas…</div>
            ) : stats ? (
              <>
                <motion.div className="stat-cards" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                  <motion.div className="stat-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                    <Users size={24} weight="thin" />
                    <div>
                      <span className="stat-value">{stats.totalUsers}</span>
                      <span className="stat-label">Usuarios</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                    <ForkKnife size={24} weight="thin" />
                    <div>
                      <span className="stat-value">{stats.totalReviews}</span>
                      <span className="stat-label">Reseñas</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                    <Star size={24} weight="thin" />
                    <div>
                      <span className="stat-value">{stats.avgRating}</span>
                      <span className="stat-label">Calificación promedio</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                    <TrendUp size={24} weight="thin" />
                    <div>
                      <span className="stat-value">{stats.reviewsThisWeek}</span>
                      <span className="stat-label">Reseñas esta semana</span>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div className="admin-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <h2>Distribución de calificaciones</h2>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const count = stats.ratingDistribution[n] || 0;
                      const maxCount = Math.max(...Object.values(stats.ratingDistribution), 1);
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={n} className="rating-bar-row">
                          <span className="rating-bar-label">{n} ★</span>
                          <div className="rating-bar-track">
                            <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="rating-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            ) : (
              <p className="intro">No se pudieron cargar las estadísticas.</p>
            )}
          </div>
        )}

        {tab === "users" && (
          <motion.div className="admin-table-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <div className="admin-table-toolbar">
              <div className="search-box" style={{ maxWidth: 320 }}>
                <MagnifyingGlass size={16} className="search-icon" weight="thin" />
                <input
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUsersPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Buscar usuarios…"
                />
                {userSearch && (
                  <button className="search-clear" onClick={() => { setUserSearch(""); setUsersPagination((p) => ({ ...p, page: 1 })); }} aria-label="Limpiar búsqueda"><X size={14} weight="thin" /></button>
                )}
              </div>
              <span className="admin-count">{usersPagination.total} usuario{usersPagination.total !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="admin-loading">Cargando usuarios…</div>
            ) : users.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 160 }}><p>No se encontraron usuarios.</p></div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Registro</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.035 } } }}>
                      {users.map((u) => (
                        <motion.tr key={u.id} variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } }}>
                          <td className="td-name">{u.name}</td>
                          <td className="td-email">{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role}`}>{u.role}</span>
                          </td>
                          <td className="td-date">{new Date(u.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</td>
                          <td>
                            <button
                              className="secondary-button"
                              style={{ fontSize: "0.8rem", minHeight: 32, padding: "0 12px" }}
                              disabled={changingRole === u.id || u.id === user.id}
                              onClick={() => handleRoleChange(u.id, u.role === "admin" ? "user" : "admin")}
                            >
                              <UserGear size={14} weight="thin" />
                              {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
                {usersPagination.pages > 1 && (
                  <div className="admin-pagination">
                    <button className="secondary-button" disabled={usersPagination.page <= 1} onClick={() => setUsersPagination((p) => ({ ...p, page: p.page - 1 }))}>Anterior</button>
                    <span>Página {usersPagination.page} de {usersPagination.pages}</span>
                    <form className="page-jump" onSubmit={handleUserPageJump}>
                      <input type="number" min="1" max={usersPagination.pages} value={userPageInput} onChange={(e) => setUserPageInput(e.target.value)} className="page-input" placeholder="nº" />
                      <button type="submit" className="secondary-button" disabled={!userPageInput}>Ir</button>
                    </form>
                    <button className="secondary-button" disabled={usersPagination.page >= usersPagination.pages} onClick={() => setUsersPagination((p) => ({ ...p, page: p.page + 1 }))}>Siguiente</button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {tab === "reviews" && (
          <motion.div className="admin-table-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <div className="admin-table-toolbar">
              <div className="search-box" style={{ maxWidth: 320 }}>
                <MagnifyingGlass size={16} className="search-icon" weight="thin" />
                <input
                  value={reviewSearch}
                  onChange={(e) => { setReviewSearch(e.target.value); setReviewsPagination((p) => ({ ...p, page: 1 })); }}
                  placeholder="Buscar reseñas…"
                />
                {reviewSearch && (
                  <button className="search-clear" onClick={() => { setReviewSearch(""); setReviewsPagination((p) => ({ ...p, page: 1 })); }} aria-label="Limpiar búsqueda"><X size={14} weight="thin" /></button>
                )}
              </div>
              <span className="admin-count">{reviewsPagination.total} reseña{reviewsPagination.total !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="admin-loading">Cargando reseñas…</div>
            ) : reviews.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 160 }}>
                <ForkKnife size={28} weight="thin" style={{ color: "var(--border)", marginBottom: 4 }} />
                <p>No se encontraron reseñas.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Restaurante</th>
                        <th>Ciudad</th>
                        <th>Rating</th>
                        <th>Usuario</th>
                        <th>Fecha</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.035 } } }}>
                      {reviews.map((r) => (
                        <motion.tr key={r.id} variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } }}>
                          <td className="td-name">{r.restaurantName}</td>
                          <td>{r.city}</td>
                          <td>
                            <span className="stars-inline">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} size={13} weight={i < r.rating ? "fill" : "thin"} color={i < r.rating ? "var(--gold)" : "var(--border)"} />
                              ))}
                            </span>
                          </td>
                          <td className="td-email">{r.owner?.name || "—"}</td>
                          <td className="td-date">{new Date(r.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</td>
                          <td>
                            <button className="danger-button" style={{ fontSize: "0.8rem", minHeight: 32, padding: "0 12px" }} onClick={() => setConfirmDelete(r)}>
                              <Trash size={14} weight="thin" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
                {reviewsPagination.pages > 1 && (
                  <div className="admin-pagination">
                    <button className="secondary-button" disabled={reviewsPagination.page <= 1} onClick={() => setReviewsPagination((p) => ({ ...p, page: p.page - 1 }))}>Anterior</button>
                    <span>Página {reviewsPagination.page} de {reviewsPagination.pages}</span>
                    <form className="page-jump" onSubmit={handleReviewPageJump}>
                      <input type="number" min="1" max={reviewsPagination.pages} value={reviewPageInput} onChange={(e) => setReviewPageInput(e.target.value)} className="page-input" placeholder="nº" />
                      <button type="submit" className="secondary-button" disabled={!reviewPageInput}>Ir</button>
                    </form>
                    <button className="secondary-button" disabled={reviewsPagination.page >= reviewsPagination.pages} onClick={() => setReviewsPagination((p) => ({ ...p, page: p.page + 1 }))}>Siguiente</button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      <AdminConfirmModal
        open={confirmDelete !== null}
        title="Eliminar reseña"
        message={confirmDelete ? `¿Eliminar la reseña de "${confirmDelete.restaurantName}" permanentemente?` : ""}
        onConfirm={handleConfirmDeleteReview}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
      />
    </motion.main>
  );
}

export default AdminPanel;
