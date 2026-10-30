/* eslint-disable react/prop-types */
import { Component } from "react";

import { ErrorState } from "../components/StateViews";
import { t } from "../i18n";

/**
 * Si una sección se rompe al pintarse, antes la pantalla se quedaba en blanco
 * (sin cabecera ni navegación). Ahora queda el aviso de error con el rayo
 * desenchufado, la navegación sigue funcionando y un botón recarga la página.
 *
 * `resetKey` (la sección): al cambiar de sección se vuelve a intentar.
 */
export class SectionErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info?.componentStack);
  }

  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorState
        title={t("layout.crash.title")}
        description={t("layout.crash.body")}
        retryLabel={t("layout.crash.reload")}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

export default SectionErrorBoundary;
