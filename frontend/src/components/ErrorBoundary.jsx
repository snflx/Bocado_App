import { motion } from "framer-motion";
import { Component } from "react";

function ErrorFallback({ error, onReload }) {
  return (
    <motion.main className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <motion.section className="auth-panel" style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="brand-logo" style={{ justifyContent: "center", marginBottom: 16 }}>
          <div className="brand-logo-mark">B</div>
          <div>
            <div className="brand-logo-text">Bocado</div>
          </div>
        </div>
        <p className="eyebrow">Error</p>
        <h1>Algo salió mal</h1>
        <p className="intro" style={{ marginBottom: 20 }}>
          {error?.message || "Ocurrió un error inesperado"}
        </p>
        <motion.button
          className="primary-button"
          onClick={onReload}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Recargar página
        </motion.button>
      </motion.section>
    </motion.main>
  );
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReload={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}
