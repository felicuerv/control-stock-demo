import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChakraProvider, extendTheme, Box, Flex } from "@chakra-ui/react";
import Layout from "./Layout";
import Login from "./Login";

// Theme personalizado
const theme = extendTheme({
  styles: {
    global: {
      "html, body": {
        overflowX: "hidden",
      },
      "::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "::-webkit-scrollbar-track": {
        background: "gray.700",
      },
      "::-webkit-scrollbar-thumb": {
        background: "teal.500",
        borderRadius: "4px",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: "teal.400",
      },
      "::-webkit-scrollbar:horizontal": {
        height: "0px",
        display: "none",
      },
    },
  },
});

// 🛡️ Componente que protege rutas
const RutaPrivada = ({ usuario, children }) => {
  const location = useLocation();
  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (usuarioGuardado) {
      try {
        const datos = JSON.parse(usuarioGuardado);
        const timestamp = new Date(datos.timestamp);
        const ahora = new Date();
        const diferencia = ahora - timestamp;

        if (diferencia < 30 * 60 * 1000) {
          setUsuario(datos);
        } else {
          localStorage.removeItem("usuario");
          setUsuario(null);
        }
      } catch (e) {
        console.error("Error cargando usuario:", e);
        setUsuario(null);
      }
    }

    setCargando(false); // Siempre marcamos que terminó de cargar
  }, []);
  

  if (cargando) return null; // o un spinner si querés
  

  return (

<ChakraProvider theme={theme}>
  <Router>
    <Routes>
      {/* Login sin protección */}
      <Route path="/login" element={<Login setUsuario={setUsuario} />} />

      {/* Todas las demás rutas están protegidas */}
      <Route
        path="/"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/clientes"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/compras"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/movimientos"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/servicios"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/servicios-cobrados"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/proveedores"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
      <Route
        path="/empleados"
        element={
          <RutaPrivada usuario={usuario}>
            <Layout usuario={usuario} setUsuario={setUsuario} />
          </RutaPrivada>
        }
      />
    </Routes>
  </Router>
</ChakraProvider>

  );
}

export default App;


