import React, { useEffect, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonPage,
  IonPopover,
} from "@ionic/react";
import {
  alertCircleOutline,
  bulbOutline,
  closeCircleOutline,
  exitOutline,
  homeOutline,
  informationCircleOutline,
  pauseCircleOutline,
  playCircleOutline,
  refresh,
  time,
} from "ionicons/icons";
import "./Ahorcado.css";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

type AhorcadoProps = {
  nivel?: string;
  categoria?: string;
  onJuegoTerminado?: (data: any) => void;
};

type AhorcadoRuntimeConfig = {
  nivel?: string;
  categoria?: string;
  autor?: string;
  version?: string;
  fecha?: string;
  descripcion?: string;
  palabras?: { word: string; clue: string }[];
  nombreApp?: string;
  plataformas?: string[];
};

const Ahorcado: React.FC<AhorcadoProps> = ({
  nivel = "advanced",
  categoria = "seres",
  onJuegoTerminado,
}) => {
  const configuracionNiveles = {
    basico: { numeroPalabras: 3, puntosPorPalabra: 10, tiempoPorPalabra: 180 },
    intermedio: { numeroPalabras: 4, puntosPorPalabra: 15, tiempoPorPalabra: 240 },
    avanzado: { numeroPalabras: 5, puntosPorPalabra: 20, tiempoPorPalabra: 300 },
  } as const;

  const normalizarNivelConfig = (n: string) =>
    (
      ({
        basico: "basico",
        basic: "basico",
        intermedio: "intermedio",
        intermediate: "intermedio",
        avanzado: "avanzado",
        advanced: "avanzado",
      }) as Record<string, keyof typeof configuracionNiveles>
    )[n?.toLowerCase?.()] || "basico";

  const [nivelConfig, setNivelConfig] = useState<string>(nivel);
  const [categoriaConfig, setCategoriaConfig] = useState<string>(categoria);
  const [configCargada, setConfigCargada] = useState(false);

  const [palabrasDelJuego, setPalabrasDelJuego] = useState<
    { word: string; clue: string }[]
  >([]);
  const [palabrasConfig, setPalabrasConfig] = useState<
    { word: string; clue: string }[]
  >([]);

  const [indicePalabraActual, setIndicePalabraActual] = useState(0);
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [letrasAdivinadas, setLetrasAdivinadas] = useState<string[]>([]);
  const [errores, setErrores] = useState(0);
  const [palabrasCompletadas, setPalabrasCompletadas] = useState(0);
  const [palabrasFalladas, setPalabrasFalladas] = useState(0);
  const [puntuacionTotal, setPuntuacionTotal] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [palabraActualGanada, setPalabraActualGanada] = useState(false);
  const [mostrarVictoria, setMostrarVictoria] = useState(false);
  const [mostrarDerrota, setMostrarDerrota] = useState(false);
  const [mostrarResumenFinal, setMostrarResumenFinal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mostrarPantallaInicio, setMostrarPantallaInicio] =
    useState<boolean>(true);
  const [showInformation, setShowInformation] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [pistaActual, setPistaActual] = useState("");
  const [pistaUsada, setPistaUsada] = useState(false);
  const [appNombreJuego, setAppNombreJuego] = useState<string>("STEAM-G");
  const [appAutor, setAppAutor] = useState<string>("Valeria C. Z.");
  const [appVersion, setAppVersion] = useState<string>("1.0");
  const [appFecha, setAppFecha] = useState<string>("2 de Diciembre del 2025");
  const [appPlataformas, setAppPlataformas] = useState<string>("Android");
  const [appDescripcion, setAppDescripcion] = useState<string>(
    "Juego para el desarrollo de habilidades matemáticas",
  );

  const maxErrores = 6;

  const nivelConfigKey = useMemo(
    () => normalizarNivelConfig(nivelConfig),
    [nivelConfig],
  );
  const config = configuracionNiveles[nivelConfigKey];

  const totalPalabrasPartida = useMemo(() => {
    if (palabrasDelJuego.length > 0) return palabrasDelJuego.length;
    return Math.min(config.numeroPalabras, palabrasConfig.length || 0);
  }, [palabrasDelJuego.length, config.numeroPalabras, palabrasConfig.length]);

  const formatearFechaLarga = (isoDate?: string) => {
    if (!isoDate) return appFecha;
    const [year, month, day] = isoDate.split("-");
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const mesIndex = Number(month) - 1;
    if (mesIndex < 0 || mesIndex > 11) return isoDate;
    return `${Number(day)} de ${meses[mesIndex]} del ${year}`;
  };

  const obtenerNombreNivel = () => {
    const n = normalizarNivelConfig(nivelConfig);
    const nombres: Record<string, string> = {
      basico: "Básico",
      intermedio: "Intermedio",
      avanzado: "Avanzado",
    };
    return nombres[n] || nivelConfig;
  };

  const formatPlataforma = (texto: string): string => {
    const mapa: Record<string, string> = {
      android: "Android",
      ios: "iOS",
      web: "Web",
    };
    return texto
      .split(/,\s*/)
      .map(
        (p) => mapa[p.toLowerCase()] ?? p.charAt(0).toUpperCase() + p.slice(1),
      )
      .join(", ");
  };

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await fetch("/config/ahorcado-config.json");
        if (!res.ok) {
          setConfigCargada(true);
          return;
        }

        const data: AhorcadoRuntimeConfig = await res.json();

        if (data.nivel) setNivelConfig(data.nivel);
        if (data.categoria) setCategoriaConfig(data.categoria);
        if (data.autor) setAppAutor(data.autor);
        if (data.version) setAppVersion(data.version);
        if (data.fecha) setAppFecha(formatearFechaLarga(data.fecha));
        if (data.descripcion) setAppDescripcion(data.descripcion);
        if (data.plataformas) setAppPlataformas(data.plataformas.join(", "));
        if (data.nombreApp) setAppNombreJuego(data.nombreApp);

        if (Array.isArray(data.palabras) && data.palabras.length > 0) {
          setPalabrasConfig(
            data.palabras.map((p) => ({
              word: p.word,
              clue: p.clue,
            })),
          );
        }
      } catch (error) {
        console.error("No se pudo cargar ahorcado-config.json", error);
      } finally {
        setConfigCargada(true);
      }
    };

    cargarConfig();
  }, []);

  useEffect(() => {
    if (!configCargada) return;
    setMostrarPantallaInicio(true);
  }, [configCargada, nivelConfig, categoriaConfig]);

  useEffect(() => {
    if (!showCountdown) return;

    if (countdown > 0) {
      const t = window.setTimeout(() => setCountdown((p) => p - 1), 1000);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => setShowCountdown(false), 500);
    return () => window.clearTimeout(t);
  }, [countdown, showCountdown]);

  useEffect(() => {
    if (mostrarPantallaInicio || !palabraSecreta) return;

    if (juegoTerminado || palabraActualGanada || pausado || showCountdown)
      return;

    if (tiempoRestante <= 0) {
      perderPalabraActual();
      return;
    }

    const timer = window.setTimeout(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    tiempoRestante,
    juegoTerminado,
    palabraActualGanada,
    pausado,
    showCountdown,
    mostrarPantallaInicio,
    palabraSecreta,
  ]);

  useEffect(() => {
    if (palabraSecreta && !juegoTerminado && !palabraActualGanada) {
      verificarEstadoPalabra();
    }
  }, [letrasAdivinadas, errores, palabraSecreta]);

  const iniciarNuevaPalabra = (objetoPalabra: {
    word: string;
    clue: string;
  }) => {
    setPalabraSecreta(objetoPalabra.word.toUpperCase());
    setPistaActual(objetoPalabra.clue);
    setLetrasAdivinadas([]);
    setErrores(0);
    setTiempoRestante(config.tiempoPorPalabra);
    setPalabraActualGanada(false);
    setPistaUsada(false);
  };

  const iniciarJuego = () => {
    if (!palabrasConfig || palabrasConfig.length === 0) {
      setJuegoTerminado(true);
      setMostrarResumenFinal(true);
      return;
    }

    const palabrasMezcladas = [...palabrasConfig].sort(
      () => Math.random() - 0.5,
    );
    const cantidad = Math.min(config.numeroPalabras, palabrasMezcladas.length);
    const palabrasSeleccionadas = palabrasMezcladas.slice(0, cantidad);

    setPalabrasDelJuego(palabrasSeleccionadas);
    setIndicePalabraActual(0);
    setPalabrasCompletadas(0);
    setPalabrasFalladas(0);
    setPuntuacionTotal(0);
    setJuegoTerminado(false);
    setPistaUsada(false);
    setMostrarResumenFinal(false);

    if (palabrasSeleccionadas.length > 0) {
      iniciarNuevaPalabra(palabrasSeleccionadas[0]);
    }
  };

  const verificarEstadoPalabra = () => {
    if (errores >= maxErrores) {
      perderPalabraActual();
      return;
    }

    const todasAdivinadas = palabraSecreta
      .split("")
      .every((letra) => letrasAdivinadas.includes(letra));

    if (todasAdivinadas && palabraSecreta.length > 0) {
      ganarPalabraActual();
    }
  };

  const avanzarSiguientePalabra = (
    completadas: number,
    falladas: number,
    puntuacion: number,
  ) => {
    const siguienteIndice = indicePalabraActual + 1;

    if (siguienteIndice < palabrasDelJuego.length) {
      setIndicePalabraActual(siguienteIndice);
      iniciarNuevaPalabra(palabrasDelJuego[siguienteIndice]);
      return;
    }

    setJuegoTerminado(true);
    setMostrarResumenFinal(true);

    onJuegoTerminado?.({
      completadas,
      falladas,
      puntuacion,
      nivel: nivelConfig,
      categoria: categoriaConfig,
    });
  };

  const ganarPalabraActual = () => {
    setPalabraActualGanada(true);
    setMostrarVictoria(true);

    const nuevasCompletadas = palabrasCompletadas + 1;
    const nuevaPuntuacion = puntuacionTotal + config.puntosPorPalabra;

    setPalabrasCompletadas(nuevasCompletadas);
    setPuntuacionTotal(nuevaPuntuacion);

    window.setTimeout(() => {
      setMostrarVictoria(false);
      avanzarSiguientePalabra(
        nuevasCompletadas,
        palabrasFalladas,
        nuevaPuntuacion,
      );
    }, 2000);
  };

  const perderPalabraActual = () => {
    setPalabraActualGanada(false);
    setMostrarDerrota(true);

    const nuevasFalladas = palabrasFalladas + 1;
    setPalabrasFalladas(nuevasFalladas);

    window.setTimeout(() => {
      setMostrarDerrota(false);
      avanzarSiguientePalabra(
        palabrasCompletadas,
        nuevasFalladas,
        puntuacionTotal,
      );
    }, 2000);
  };

  const manejarLetra = (letra: string) => {
    if (
      juegoTerminado ||
      palabraActualGanada ||
      letrasAdivinadas.includes(letra) ||
      pausado ||
      showCountdown
    ) {
      return;
    }

    const nuevasLetras = [...letrasAdivinadas, letra];
    setLetrasAdivinadas(nuevasLetras);

    if (!palabraSecreta.includes(letra)) {
      setErrores((prev) => prev + 1);
    }
  };

  const usarPista = () => {
    if (
      pistaUsada ||
      juegoTerminado ||
      palabraActualGanada ||
      pausado ||
      showCountdown
    )
      return;

    const restantes = palabraSecreta
      .split("")
      .filter((l) => !letrasAdivinadas.includes(l));

    if (restantes.length === 0) return;

    const letra = restantes[Math.floor(Math.random() * restantes.length)];
    manejarLetra(letra);
    setPistaUsada(true);
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.max(0, segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, "0")}`;
  };

  const mostrarPalabra = () =>
    palabraSecreta.split("").map((letra, index) => (
      <span key={index} className="letra-espacio">
        {letrasAdivinadas.includes(letra) ? letra : "_"}
      </span>
    ));

  const resetGame = () => {
    setCountdown(5);
    setShowCountdown(true);
    setPausado(false);
    setMostrarDerrota(false);
    setMostrarVictoria(false);
    setMostrarResumenFinal(false);
    setShowInstructions(false);
    iniciarJuego();
  };

  const handleStartGame = () => {
    setMostrarPantallaInicio(false);
    resetGame();
  };

  const handleExitToStart = () => {
    setPausado(false);
    setShowCountdown(false);
    setCountdown(5);
    setShowInstructions(false);
    setMostrarDerrota(false);
    setMostrarVictoria(false);
    setMostrarResumenFinal(false);
    setJuegoTerminado(true);
    setMostrarPantallaInicio(true);
  };

  const handlePausar = () => {
    if (
      mostrarPantallaInicio ||
      showCountdown ||
      mostrarResumenFinal ||
      showInstructions ||
      mostrarDerrota ||
      mostrarVictoria ||
      pausado ||
      juegoTerminado ||
      palabraActualGanada
    ) {
      return;
    }
    setPausado(true);
  };

  const handleReanudar = () => {
    setPausado(false);
  };

  const handleSalirDesdePausa = () => {
    handleExitToStart();
  };

  const handleCerrarAplicacion = async () => {
    onJuegoTerminado?.({
      completadas: 0,
      falladas: 0,
      puntuacion: 0,
      nivel: nivelConfig,
      categoria: categoriaConfig,
      cerradoPorUsuario: true,
    });

    try {
      if (Capacitor.isNativePlatform()) {
        await CapacitorApp.exitApp();
        return;
      }
      window.close();
    } catch {
      window.close();
    }
  };

  const handleInformation = () => setShowInformation((v) => !v);

  const DibujoAhorcado: React.FC<{ errores: number }> = ({ errores }) => (
    <svg className="ahorcado-svg" viewBox="0 0 100 140">
      <line x1="6" y1="138" x2="90" y2="138" stroke="#333" strokeWidth="2.5" />
      <line x1="30" y1="138" x2="30" y2="12" stroke="#333" strokeWidth="2.5" />
      <line x1="30" y1="12" x2="78" y2="12" stroke="#333" strokeWidth="2.5" />
      <line x1="78" y1="12" x2="78" y2="30" stroke="#333" strokeWidth="1.2" />

      {errores >= 1 && (
        <circle
          cx="78"
          cy="42"
          r="12"
          stroke="#e74c3c"
          strokeWidth="2"
          fill="none"
        />
      )}
      {errores >= 2 && (
        <line
          x1="78"
          y1="54"
          x2="78"
          y2="90"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      )}
      {errores >= 3 && (
        <line
          x1="78"
          y1="66"
          x2="60"
          y2="78"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      )}
      {errores >= 4 && (
        <line
          x1="78"
          y1="66"
          x2="96"
          y2="78"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      )}
      {errores >= 5 && (
        <line
          x1="78"
          y1="90"
          x2="66"
          y2="114"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      )}
      {errores >= 6 && (
        <line
          x1="78"
          y1="90"
          x2="90"
          y2="114"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      )}
    </svg>
  );

  const Teclado: React.FC = () => {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const fila1 = letras.slice(0, 9);
    const fila2 = letras.slice(9, 18);
    const fila3 = letras.slice(18);

    const letrasEspeciales = ["Ñ", "Á", "É", "Í", "Ó", "Ú"];

    const estaDeshabilitada = (letra: string) =>
      letrasAdivinadas.includes(letra) ||
      juegoTerminado ||
      palabraActualGanada ||
      pausado ||
      showCountdown;

    const colorTecla = (letra: string) =>
      letrasAdivinadas.includes(letra)
        ? palabraSecreta.includes(letra)
          ? "success"
          : "danger"
        : "";

    return (
      <div className="teclado">
        <div className="fila-teclado">
          {fila1.map((letra) => (
            <IonButton
              key={letra}
              onClick={() => manejarLetra(letra)}
              disabled={estaDeshabilitada(letra)}
              color={colorTecla(letra)}
              className="tecla-letra"
            >
              {letra}
            </IonButton>
          ))}
        </div>

        <div className="fila-teclado">
          {fila2.map((letra) => (
            <IonButton
              key={letra}
              onClick={() => manejarLetra(letra)}
              disabled={estaDeshabilitada(letra)}
              color={colorTecla(letra)}
              className="tecla-letra"
            >
              {letra}
            </IonButton>
          ))}
        </div>

        <div className="fila-teclado">
          {fila3.map((letra) => (
            <IonButton
              key={letra}
              onClick={() => manejarLetra(letra)}
              disabled={estaDeshabilitada(letra)}
              color={colorTecla(letra)}
              className="tecla-letra"
            >
              {letra}
            </IonButton>
          ))}
        </div>

        <div className="fila-teclado">
          {letrasEspeciales.map((letra) => (
            <IonButton
              key={letra}
              onClick={() => manejarLetra(letra)}
              disabled={estaDeshabilitada(letra)}
              color={colorTecla(letra)}
              className="tecla-letra"
            >
              {letra}
            </IonButton>
          ))}

          <IonButton
            onClick={usarPista}
            disabled={
              pistaUsada ||
              juegoTerminado ||
              palabraActualGanada ||
              pausado ||
              showCountdown ||
              palabraSecreta
                .split("")
                .every((l) => letrasAdivinadas.includes(l))
            }
            className="tecla-letra tecla-pista"
            title="Usar pista (una vez por partida)"
          >
            <IonIcon icon={bulbOutline} />
          </IonButton>
        </div>
      </div>
    );
  };

  const generarConfeti = (cantidad = 50) => {
    const colores = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    return Array.from({ length: cantidad }, (_, i) => ({
      id: i,
      color: colores[Math.floor(Math.random() * colores.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
    }));
  };

  return (
    <IonPage>
      {showCountdown && countdown > 0 && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
        </div>
      )}

      {showInformation && (
        <div className="info-modal-background">
          <div className="info-modal">
            <div className="header">
              <h2 style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                {appNombreJuego}
              </h2>
              <p
                style={{
                  color: "#8b8b8bff",
                  marginTop: "5px",
                  textAlign: "center",
                }}
              >
                Actividad configurada desde la plataforma Steam-G
              </p>
            </div>

            <div className="cards-info">
              <div className="card">
                <p className="title">VERSIÓN</p>
                <p className="data">{appVersion}</p>
              </div>
              <div className="card">
                <p className="title">FECHA DE CREACIÓN</p>
                <p className="data">{appFecha}</p>
              </div>
              <div className="card">
                <p className="title">PLATAFORMAS</p>
                <p className="data">{formatPlataforma(appPlataformas)}</p>
              </div>
              <div className="card">
                <p className="title">NÚMERO DE EJERCICIOS</p>
                <p className="data">{totalPalabrasPartida}</p>
              </div>
              <div className="card description">
                <p className="title">DESCRIPCIÓN</p>
                <p className="data">{appDescripcion}</p>
              </div>
            </div>

            <div className="button">
              <IonButton expand="full" onClick={handleInformation}>
                Cerrar
              </IonButton>
            </div>
          </div>
        </div>
      )}

      {pausado && (
        <div className="pause-overlay">
          <div className="pause-card">
            <h2>Juego en pausa</h2>
            <p>El tiempo está detenido.</p>

            <IonButton
              id="resume"
              expand="block"
              style={{ marginTop: "16px" }}
              onClick={handleReanudar}
            >
              <IonIcon slot="start" icon={playCircleOutline} />
              Reanudar
            </IonButton>

            <IonButton
              id="finalize"
              expand="block"
              style={{ marginTop: "10px" }}
              onClick={handleSalirDesdePausa}
            >
              <IonIcon slot="start" icon={homeOutline} />
              Finalizar juego
            </IonButton>

            <IonButton
              id="exit"
              expand="block"
              style={{ marginTop: "10px" }}
              onClick={handleCerrarAplicacion}
            >
              <IonIcon slot="start" icon={exitOutline} />
              Cerrar aplicación
            </IonButton>
          </div>
        </div>
      )}

      {mostrarVictoria && (
        <div className="victory-overlay">
          <div className="victory-message">
            <h2>¡Correcto! 🎉</h2>
            <p>
              Palabra: <strong>{palabraSecreta}</strong>
            </p>
            <p>+{config.puntosPorPalabra} puntos</p>
          </div>
          <div className="confetti-container">
            {generarConfeti().map((p) => (
              <div
                key={p.id}
                className="confetti"
                style={{
                  backgroundColor: p.color,
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="ins-overlay" onClick={() => setShowInstructions(false)}>
          <div className="ins-card" onClick={(e) => e.stopPropagation()}>
            <div className="ins-title">
              <h2
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  color: "var(--color-primary)",
                }}
              >
                Reglas Básicas
              </h2>
              <IonIcon
                icon={closeCircleOutline}
                style={{
                  fontSize: "26px",
                  color: "var(--color-primary)",
                }}
                onClick={() => setShowInstructions(false)}
              />
            </div>
            <div className="ins-stats">
              <p style={{ textAlign: "justify" }}>
                <strong>
                  Descubre la palabra y evita completar el ahorcado.
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {mostrarDerrota && (
        <div className="defeat-overlay">
          <div className="defeat-message">
            <h2>¡Palabra perdida! 😢</h2>
            <p>
              La palabra era: <strong>{palabraSecreta}</strong>
            </p>
            {tiempoRestante === 0 && <p>Se acabó el tiempo</p>}
          </div>
        </div>
      )}

      {mostrarResumenFinal && (
        <div className="summary-overlay">
          <div className="summary-message">
            <h2>Juego Terminado</h2>
            <div className="resumen-final">
              <h3>Resultados Finales</h3>
              <p>
                <strong>Palabras completadas:</strong> {palabrasCompletadas} de{" "}
                {Math.max(1, totalPalabrasPartida)}
              </p>
              <p>
                <strong>Palabras incorrectas:</strong> {palabrasFalladas}
              </p>
              <p>
                <strong>Puntuación total:</strong> {puntuacionTotal} puntos
              </p>

              <IonBadge className="badge">
                {palabrasCompletadas === totalPalabrasPartida
                  ? "¡PERFECTO! 🏆"
                  : palabrasCompletadas > palabrasFalladas
                    ? "¡Buen trabajo! 👍"
                    : "¡Sigue intentando! 💪"}
              </IonBadge>
            </div>

            <IonButton id="finalize" expand="block" onClick={handleExitToStart}>
              <IonIcon slot="start" icon={refresh} />
              Jugar de Nuevo
            </IonButton>

            <IonButton
              id="exit"
              expand="block"
              onClick={handleCerrarAplicacion}
            >
              <IonIcon slot="start" icon={exitOutline} />
              Cerrar aplicación
            </IonButton>
          </div>

          <div className="confetti-container">
            {generarConfeti().map((p) => (
              <div
                key={p.id}
                className="confetti"
                style={{
                  backgroundColor: p.color,
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <IonContent className="ion-padding" fullscreen>
        {mostrarPantallaInicio ? (
          <div className="inicio-container">
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles start-page">
                  <h1>{appNombreJuego}</h1>
                </div>
              </div>
            </div>

            <div className="info-juego">
              <div className="info-item">
                <IonChip>
                  <strong>Nivel: {obtenerNombreNivel()}</strong>
                </IonChip>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="page-start-btns"
            >
              <IonButton onClick={handleStartGame} className="play">
                <IonIcon slot="start" icon={playCircleOutline}></IonIcon>
                Iniciar juego
              </IonButton>
              <IonButton onClick={handleInformation} className="info">
                <IonIcon slot="start" icon={informationCircleOutline}></IonIcon>
                Informacion
              </IonButton>
            </div>
          </div>
        ) : (
          <>
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles">
                  <h1>STEAM-G</h1>
                  <IonIcon
                    icon={alertCircleOutline}
                    size="small"
                    id="info-icon"
                  />
                  <IonPopover
                    trigger="info-icon"
                    side="bottom"
                    alignment="center"
                  >
                    <IonCard className="filter-card ion-no-margin">
                      <div className="section header-section">
                        <h2>{appNombreJuego}</h2>
                      </div>
                      <div className="section description-section">
                        <p>{appDescripcion}</p>
                      </div>
                      <div className="section footer-section">
                        <span>{appFecha}</span>
                      </div>
                    </IonCard>
                  </IonPopover>
                </div>
                <span>
                  <strong>{appNombreJuego}</strong>
                </span>
              </div>
            </div>

            <div className="instructions-exercises">
              <div className="num-words">
                <strong>
                  Juego {indicePalabraActual + 1} de{" "}
                  {Math.max(1, totalPalabrasPartida)}
                </strong>
              </div>

              <div className="temporizador">
                <IonIcon icon={time} className="icono-tiempo" />
                <h5 className="tiempo-display">
                  {formatearTiempo(tiempoRestante)}
                </h5>
              </div>

              <div className="num-words">
                <strong>Puntuación: {puntuacionTotal}</strong>
              </div>

              <div className="rules" onClick={() => setShowInstructions(true)}>
                Reglas Básicas
              </div>
            </div>

            <div className="juego-container">
              <IonCard>
                <IonCardContent className="dibujo-container ion-no-margin">
                  <IonCardTitle className="ion-text-center instructions">
                    {pistaActual}
                  </IonCardTitle>
                  <DibujoAhorcado errores={errores} />
                  <div className="palabra-container">{mostrarPalabra()}</div>
                </IonCardContent>
              </IonCard>

              <Teclado />
            </div>

            <div className="button game">
              <IonButton
                shape="round"
                expand="full"
                onClick={handlePausar}
                disabled={
                  juegoTerminado ||
                  palabraActualGanada ||
                  pausado ||
                  showCountdown
                }
              >
                <IonIcon slot="start" icon={pauseCircleOutline} />
                Pausar
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Ahorcado;
