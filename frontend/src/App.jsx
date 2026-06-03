import { Warning, Pencil, SignOut, Plus, ArrowsClockwise, MagnifyingGlass, Shield, FadersHorizontal, Star, Trash, ForkKnife, WifiSlash, X } from "phosphor-react";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, clearSession, getStoredSession, saveSession } from "./api.js";
import AdminPanel from "./components/AdminPanel.jsx";

const Decorative3D = lazy(() => import("./components/Decorative3D.jsx"));

const emptyReview = {
  restaurantName: "",
  city: "",
  rating: 5,
  comment: "",
  visitDate: ""
};

function useHashRoute() {
  const getRoute = () => window.location.hash.slice(1) || "/";
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const navigate = useCallback((hash) => { window.location.hash = hash; }, []);
  return [route, navigate];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

function LoadingSkeleton() {
  return (
    <div className="review-list">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-meta" />
          <div className="skeleton-line skeleton-body" />
          <div className="skeleton-line skeleton-body short" />
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
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

  if (!open) return null;
  return (
    <motion.div
      className="modal-overlay"
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="modal-header">
          <Warning weight="thin" size={20} className="modal-icon" />
          <h2 id="modal-title">{title}</h2>
        </div>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="danger-button" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando…" : <><Trash weight="thin" size={15} /> Eliminar</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BrandLogo({ compact }) {
  return (
    <div className={`brand-logo${compact ? " compact" : ""}`}>
      <motion.div
        className="brand-logo-mark"
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        B
      </motion.div>
      <div>
        <div className="brand-logo-text">Bocado</div>
        {!compact && <div className="brand-logo-tagline">Reseñas de restaurantes</div>}
      </div>
    </div>
  );
}

export default function App() {
  const storedSession = useMemo(() => getStoredSession(), []);
  const [token, setToken] = useState(storedSession.token);
  const [user, setUser] = useState(storedSession.user);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [ratingFilter, setRatingFilter] = useState(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pageInput, setPageInput] = useState("");
  const [route, navigate] = useHashRoute();
  const messageTimer = useRef(null);
  const searchTimer = useRef(null);
  const listRef = useRef(null);

  const authenticated = Boolean(token && user);
  const adminMode = route.startsWith("/admin");

  const adminTab = useMemo(() => {
    if (!adminMode) return "dashboard";
    const parts = route.split("/");
    const allowed = ["dashboard", "users", "reviews"];
    return allowed.includes(parts[2]) ? parts[2] : "dashboard";
  }, [route, adminMode]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const showMessage = useCallback((msg, type = "error") => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage({ text: msg, type });
    messageTimer.current = setTimeout(() => setMessage(null), 4000);
  }, []);

  const run = useCallback(async (action, fallback = "Ocurrió un error") => {
    try {
      setLoading(true);
      return await action();
    } catch (error) {
      showMessage(error.message || fallback);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const queryParams = useMemo(() => {
    const params = { limit: 10 };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (sort) params.sort = sort;
    if (ratingFilter) params.rating = ratingFilter;
    if (mineOnly) params.mine = "true";
    return params;
  }, [debouncedSearch, sort, ratingFilter, mineOnly]);

  const loadReviews = useCallback(async (page = 1) => {
    return run(async () => {
      const data = await api.listReviews(token, { ...queryParams, page });
      setReviews(data.items);
      setPagination({ page: data.page, pages: data.pages || 1, total: data.total });
      if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [run, token, queryParams]);

  useEffect(() => {
    if (authenticated) {
      loadReviews(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, queryParams]);

  function handleResetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setRatingFilter(null);
    setMineOnly(false);
  }

  const hasActiveFilters = sort !== "newest" || ratingFilter !== null || mineOnly || debouncedSearch.trim() !== "";

  function validateAuthField(name, value) {
    if (name === "name" && authMode === "register") {
      if (!value.trim()) return "El nombre es obligatorio";
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
    }
    if (name === "email") {
      if (!value.trim()) return "El correo es obligatorio";
      if (!/\S+@\S+\.\S+/.test(value)) return "Correo inválido";
    }
    if (name === "password") {
      if (!value) return "La contraseña es obligatoria";
      if (authMode === "register" && value.length < 8) return "Mínimo 8 caracteres";
    }
    return null;
  }

  function validateAuthForm() {
    const errors = {};
    if (authMode === "register" && !authForm.name.trim()) errors.name = "El nombre es obligatorio";
    if (!authForm.email.trim()) errors.email = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(authForm.email)) errors.email = "Correo inválido";
    if (!authForm.password) errors.password = "La contraseña es obligatoria";
    else if (authMode === "register" && authForm.password.length < 8) errors.password = "Mínimo 8 caracteres";
    return errors;
  }

  function validateReviewField(name, value) {
    if (name === "restaurantName" && !value.trim()) return "El nombre del restaurante es obligatorio";
    if (name === "city" && !value.trim()) return "La ciudad es obligatoria";
    if (name === "comment") {
      if (!value.trim()) return "El comentario es obligatorio";
      if (value.trim().length < 10) return "Mínimo 10 caracteres";
    }
    return null;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const errors = validateAuthForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = authMode === "register"
      ? authForm
      : { email: authForm.email, password: authForm.password };

    const data = await run(() => api[authMode](payload));

    if (data) {
      saveSession(data);
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      setFieldErrors({});
      window.location.hash = "/";
    }
  }

  function getOptimisticReview(payload) {
    return {
      id: `temp_${Date.now()}`,
      restaurantName: payload.restaurantName,
      city: payload.city,
      rating: payload.rating,
      comment: payload.comment,
      visitDate: payload.visitDate,
      owner: { id: user?.id, name: user?.name },
      canEdit: true,
      createdAt: new Date().toISOString()
    };
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!reviewForm.restaurantName.trim()) errors.restaurantName = "El nombre del restaurante es obligatorio";
    if (!reviewForm.city.trim()) errors.city = "La ciudad es obligatoria";
    if (!reviewForm.visitDate) errors.visitDate = "La fecha de visita es obligatoria";
    if (!reviewForm.comment.trim()) errors.comment = "El comentario es obligatorio";
    else if (reviewForm.comment.trim().length < 10) errors.comment = "Mínimo 10 caracteres";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = { ...reviewForm, rating: Number(reviewForm.rating) };
    const formSnapshot = { ...reviewForm };
    const wasEditing = editingId;

    setReviewForm(emptyReview);
    setEditingId(null);
    setFieldErrors({});
    setPageInput("");

    if (wasEditing) {
      const original = reviews.find(r => r.id === wasEditing);
      setReviews(prev => prev.map(r =>
        r.id === wasEditing ? { ...r, ...payload } : r
      ));
      try {
        const data = await api.updateReview(token, wasEditing, payload);
        setReviews(prev => prev.map(r =>
          r.id === wasEditing ? data.review : r
        ));
        showMessage("Reseña actualizada", "success");
      } catch (error) {
        if (original) setReviews(prev => prev.map(r => r.id === wasEditing ? original : r));
        setReviewForm(formSnapshot);
        setEditingId(wasEditing);
        showMessage(error.message || "No se pudo guardar");
      }
    } else {
      const optimistic = getOptimisticReview(payload);
      setReviews(prev => [optimistic, ...prev]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      try {
        const data = await api.createReview(token, payload);
        setReviews(prev => prev.map(r =>
          r.id === optimistic.id ? data.review : r
        ));
        showMessage("Reseña publicada", "success");
      } catch (error) {
        setReviews(prev => prev.filter(r => r.id !== optimistic.id));
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        setReviewForm(formSnapshot);
        showMessage(error.message || "No se pudo publicar");
      }
    }
  }

  const startEdit = useCallback((review) => {
    setEditingId(review.id);
    setReviewForm({
        restaurantName: review.restaurantName,
        city: review.city,
        rating: review.rating,
        comment: review.comment,
        visitDate: review.visitDate
      });
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setReviewForm(emptyReview);
    setFieldErrors({});
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setConfirmLoading(true);
    const deletedReview = { ...confirmDelete };
    setReviews(prev => prev.filter(r => r.id !== confirmDelete.id));
    setConfirmDelete(null);
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    try {
      await api.deleteReview(token, deletedReview.id);
      showMessage("Reseña eliminada", "success");
    } catch (error) {
      setReviews(prev => {
        const idx = prev.findIndex(r => new Date(r.createdAt) < new Date(deletedReview.createdAt));
        const copy = [...prev];
        if (idx === -1) copy.push(deletedReview);
        else copy.splice(idx, 0, deletedReview);
        return copy;
      });
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      showMessage(error.message || "No se pudo eliminar");
    } finally {
      setConfirmLoading(false);
    }
  }, [token, confirmDelete, showMessage]);

  const handleCancelDelete = useCallback(() => setConfirmDelete(null), []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setReviews([]);
    window.location.hash = "/";
  }, []);

  const commentRemaining = 1000 - reviewForm.comment.length;

  function handleTextareaChange(event) {
    setReviewForm(prev => ({ ...prev, comment: event.target.value }));
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.max(100, el.scrollHeight)}px`;
  }

  function handlePageJump(event) {
    event.preventDefault();
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= pagination.pages) {
      loadReviews(page);
      setPageInput("");
    }
  }

  if (!authenticated) {
    return (
      <main className="auth-shell">
        <Suspense fallback={null}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
            <Decorative3D />
          </motion.div>
        </Suspense>
        <motion.section
          className="auth-panel"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <BrandLogo />
          <h1>Descubre y comparte</h1>
          <p className="intro">Inicia sesión para consultar reseñas y administrar tus propias opiniones culinarias.</p>

          <div className="segmented" role="tablist" aria-label="Modo de autenticación">
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
              Iniciar sesión
            </button>
            <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
              Registrarse
            </button>
          </div>

          <motion.form
            className="form"
            onSubmit={handleAuthSubmit}
            noValidate
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {authMode === "register" && (
              <motion.label key="name-field" variants={fadeUp}>
                Nombre
                <input
                  value={authForm.name}
                  onChange={(e) => { setAuthForm(f => ({ ...f, name: e.target.value })); setFieldErrors(p => ({ ...p, name: validateAuthField("name", e.target.value) })); }}
                  onBlur={() => setFieldErrors(p => ({ ...p, name: validateAuthField("name", authForm.name) }))}
                  minLength="2" maxLength="80" required
                  className={fieldErrors.name ? "field-error" : ""}
                />
                {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
              </motion.label>
            )}
            <motion.label variants={fadeUp}>
              Correo
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => { setAuthForm(f => ({ ...f, email: e.target.value })); setFieldErrors(p => ({ ...p, email: validateAuthField("email", e.target.value) })); }}
                onBlur={() => setFieldErrors(p => ({ ...p, email: validateAuthField("email", authForm.email) }))}
                maxLength="120" required
                className={fieldErrors.email ? "field-error" : ""}
              />
              {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
            </motion.label>
            <motion.label variants={fadeUp}>
              Contraseña
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => { setAuthForm(f => ({ ...f, password: e.target.value })); setFieldErrors(p => ({ ...p, password: validateAuthField("password", e.target.value) })); }}
                onBlur={() => setFieldErrors(p => ({ ...p, password: validateAuthField("password", authForm.password) }))}
                minLength={authMode === "register" ? 8 : 1} required
                className={fieldErrors.password ? "field-error" : ""}
              />
              {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
            </motion.label>
            <motion.button
              className="primary-button"
              disabled={loading}
              variants={fadeUp}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Procesando…" : authMode === "login" ? "Entrar" : "Crear cuenta"}
            </motion.button>
          </motion.form>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {offline && (
        <div className="offline-banner" role="alert">
          <WifiSlash weight="thin" size={16} />
          Sin conexión — los cambios podrían no guardarse
        </div>
      )}

      <header className="topbar">
        <BrandLogo compact />
        <div className="user-menu">
          {user?.role === "admin" && (
            <motion.button
              className="admin-link"
              onClick={() => navigate("/admin")}
              title="Panel de administración"
              aria-label="Panel de administración"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield weight="thin" size={18} />
              <span>Admin</span>
            </motion.button>
          )}
          <motion.div
            className="user-avatar"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {(user.name || "U").charAt(0).toUpperCase()}
          </motion.div>
          <span className="user-name">{user.name}</span>
          <motion.button
            className="logout-btn"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <SignOut weight="thin" size={16} />
            Salir
          </motion.button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {adminMode ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, display: "flex" }}
          >
            <AdminPanel token={token} user={user} tab={adminTab} onTabChange={(t) => navigate(`/admin/${t}`)} onBack={() => navigate("/")} />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            className="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.aside
              className="editor-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="panel-heading">
                <h2>{editingId ? "Editar reseña" : "Nueva reseña"}</h2>
                {editingId && (
                  <motion.button
                    className="icon-button"
                    onClick={cancelEdit}
                    title="Cancelar edición"
                    aria-label="Cancelar edición"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X weight="thin" size={18} />
                  </motion.button>
                )}
              </div>

              <form className="form" onSubmit={handleReviewSubmit} noValidate>
                <label>
                  Restaurante
                  <input
                    value={reviewForm.restaurantName}
                    onChange={(e) => { setReviewForm(f => ({ ...f, restaurantName: e.target.value })); setFieldErrors(p => ({ ...p, restaurantName: validateReviewField("restaurantName", e.target.value) })); }}
                    onBlur={() => setFieldErrors(p => ({ ...p, restaurantName: validateReviewField("restaurantName", reviewForm.restaurantName) }))}
                    minLength="2" maxLength="120" required placeholder="Nombre del restaurante"
                    className={fieldErrors.restaurantName ? "field-error" : ""}
                  />
                  {fieldErrors.restaurantName && <span className="field-error-text">{fieldErrors.restaurantName}</span>}
                </label>
                <label>
                  Ciudad
                  <input
                    value={reviewForm.city}
                    onChange={(e) => { setReviewForm(f => ({ ...f, city: e.target.value })); setFieldErrors(p => ({ ...p, city: validateReviewField("city", e.target.value) })); }}
                    onBlur={() => setFieldErrors(p => ({ ...p, city: validateReviewField("city", reviewForm.city) }))}
                    minLength="2" maxLength="80" required placeholder="Ciudad"
                    className={fieldErrors.city ? "field-error" : ""}
                  />
                  {fieldErrors.city && <span className="field-error-text">{fieldErrors.city}</span>}
                </label>
                <label>
                  <div className="rating-wrap">
                    <span>Calificación</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`star-btn${n <= reviewForm.rating ? " active" : ""}`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                          aria-label={`${n} de 5`}
                        >
                          <Star weight="thin" size={20} fill={n <= reviewForm.rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                      <span className="rating-label">{reviewForm.rating}</span>
                    </div>
                  </div>
                </label>
                <label>
                  Fecha de visita
                  <input
                    type="date"
                    value={reviewForm.visitDate}
                    onChange={(e) => setReviewForm(f => ({ ...f, visitDate: e.target.value }))}
                    required
                    className={fieldErrors.visitDate ? "field-error" : ""}
                  />
                  {fieldErrors.visitDate && <span className="field-error-text">{fieldErrors.visitDate}</span>}
                </label>
                <label>
                  <div className="textarea-header">
                    <span>Comentario</span>
                    <span className={`char-counter${commentRemaining < 100 ? " warn" : ""}${commentRemaining < 20 ? " danger" : ""}`}>
                      {commentRemaining}
                    </span>
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={handleTextareaChange}
                    onBlur={() => setFieldErrors(p => ({ ...p, comment: validateReviewField("comment", reviewForm.comment) }))}
                    minLength="10" maxLength="1000" required placeholder="Cuenta tu experiencia…"
                    className={fieldErrors.comment ? "field-error" : ""}
                  />
                  {fieldErrors.comment && <span className="field-error-text">{fieldErrors.comment}</span>}
                </label>
                <motion.button
                  className="primary-button"
                  disabled={loading && !editingId}
                  whileTap={{ scale: 0.98 }}
                >
                  {editingId ? <Pencil weight="thin" size={18} /> : <Plus weight="thin" size={18} />}
                  {editingId ? "Guardar cambios" : "Publicar reseña"}
                </motion.button>
              </form>
            </motion.aside>

            <section className="reviews-panel">
              <div className="toolbar">
                <div className="search-box">
                  <MagnifyingGlass weight="thin" size={18} className="search-icon" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar restaurante o ciudad"
                  />
                  {search && (
                    <button className="search-clear" onClick={() => { setSearch(""); setDebouncedSearch(""); }} aria-label="Limpiar búsqueda">
                      <X weight="thin" size={16} />
                    </button>
                  )}
                </div>
                <motion.button
                  className={`icon-button${hasActiveFilters ? " active-filter" : ""}`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filtros" aria-label="Alternar filtros"
                  whileTap={{ scale: 0.9 }}
                >
                  <FadersHorizontal weight="thin" size={18} />
                </motion.button>
                <motion.button
                  className="icon-button"
                  onClick={() => loadReviews(pagination.page)}
                  title="Actualizar" aria-label="Actualizar"
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowsClockwise weight="thin" size={18} className={loading ? "spin" : ""} />
                </motion.button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    className="filter-bar"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="filter-group">
                      <label className="filter-label">Ordenar</label>
                      <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
                        <option value="newest">Más recientes</option>
                        <option value="oldest">Más antiguos</option>
                        <option value="highest">Mejor calificados</option>
                        <option value="lowest">Peor calificados</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Calificación</label>
                      <div className="filter-rating-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n} type="button"
                            className={`star-filter-btn${ratingFilter === n ? " active" : ""}`}
                            onClick={() => setRatingFilter(ratingFilter === n ? null : n)}
                            aria-label={`Filtrar por ${n} estrellas`}
                          >
                            <Star weight="thin" size={16} fill={n <= (ratingFilter || 5) ? "currentColor" : "none"} />
                          </button>
                        ))}
                        {ratingFilter && (
                          <button className="filter-chip-remove" onClick={() => setRatingFilter(null)} aria-label="Quitar filtro de calificación">
                            <X weight="thin" size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Autor</label>
                      <button className={`toggle-btn${mineOnly ? " active" : ""}`} onClick={() => setMineOnly(!mineOnly)}>
                        {mineOnly ? "Mis reseñas" : "Todas"}
                      </button>
                    </div>

                    {hasActiveFilters && (
                      <motion.button
                        className="clear-filters-btn"
                        onClick={handleResetFilters}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <X weight="thin" size={14} /> Limpiar filtros
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="summary-line">
                <span>{pagination.total} reseña{pagination.total !== 1 ? "s" : ""}</span>
                {pagination.pages > 1 && (
                  <span>Página {pagination.page} de {pagination.pages}</span>
                )}
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div
                    className={`message-toast ${message.type}`}
                    role="alert"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="review-list"
                ref={listRef}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {loading && reviews.length === 0 ? (
                  <LoadingSkeleton />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {reviews.map((review, index) => (
                      <motion.article
                        className="review-card"
                        key={review.id}
                        variants={cardVariants}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        whileHover={{ y: -3 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <div className="review-header">
                          <div>
                            <h3>{review.restaurantName}</h3>
                            <p className="review-meta">
                              {review.city}
                              {review.owner?.name && ` · ${review.owner.name}`}
                            </p>
                          </div>
                          <div className="stars" aria-label={`${review.rating} de 5`}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} weight="thin" size={16} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                        <p className="comment">{review.comment}</p>
                        <div className="review-footer">
                          <span className="review-date">
                            {review.visitDate
                              ? `Visitado el ${new Date(review.visitDate).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}`
                              : new Date(review.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          {review.canEdit && (
                            <div className="card-actions">
                              <motion.button
                                className="secondary-button"
                                onClick={() => startEdit(review)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <Pencil weight="thin" size={15} /> Editar
                              </motion.button>
                              <motion.button
                                className="danger-button"
                                onClick={() => setConfirmDelete(review)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <Trash weight="thin" size={15} /> Eliminar
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                )}

                {!loading && reviews.length === 0 && (
                  <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ForkKnife weight="thin" size={36} />
                    <h3>No hay reseñas para mostrar</h3>
                    <p>
                      {hasActiveFilters
                        ? "Intenta con otros filtros o términos de búsqueda."
                        : "Crea la primera reseña para comenzar."}
                    </p>
                    {hasActiveFilters && (
                      <button className="secondary-button" onClick={handleResetFilters} style={{ marginTop: 12 }}>
                        Limpiar filtros
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <span>Página {pagination.page} de {pagination.pages}</span>
                  <form className="page-jump" onSubmit={handlePageJump}>
                    <label>
                      Ir a
                      <input
                        type="number" min="1" max={pagination.pages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="page-input" placeholder="nº"
                      />
                    </label>
                    <button type="submit" className="secondary-button" disabled={!pageInput || loading}>
                      Ir
                    </button>
                  </form>
                  <div className="pagination-buttons">
                    <motion.button
                      className="secondary-button"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => loadReviews(pagination.page - 1)}
                      whileTap={{ scale: 0.97 }}
                    >
                      Anterior
                    </motion.button>
                    <motion.button
                      className="secondary-button"
                      disabled={pagination.page >= pagination.pages || loading}
                      onClick={() => loadReviews(pagination.page + 1)}
                      whileTap={{ scale: 0.97 }}
                    >
                      Siguiente
                    </motion.button>
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete !== null && (
          <ConfirmModal
            open={confirmDelete !== null}
            title="Eliminar reseña"
            message={confirmDelete ? `¿Estás seguro de eliminar la reseña de "${confirmDelete.restaurantName}"? Esta acción no se puede deshacer.` : ""}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            loading={confirmLoading}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
