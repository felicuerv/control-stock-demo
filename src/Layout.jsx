import { Box, Flex, CloseButton } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MenuLateral from "./MenuLateral";
import BarraNavegacion from "./BarraNavegacion";
import Productos from "./Productos";
import Clientes from "./Clientes";
import Compras from "./Compras";
import Servicios from "./Servicios";
import Ventas from "./Ventas";
import ServiciosCobrados from "./ServiciosCobrados";
import Proveedores from "./Proveedores";
import { Alert, AlertIcon, VStack } from "@chakra-ui/react";
import { generarAlertas } from "./alertas"; // ajustar path según tu estructura
import NotificacionesStock from "./notificacionesStock";
import InactividadBlur from "./InactividadBlur";
import Empleados from "./Empleados";
import MovimientosSemanal from "./Movimientos";

const Layout = ({ usuario, setUsuario }) => {
  const [setAlertas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const resultado = await generarAlertas();
      setAlertas(resultado);
    };
    cargar();
  }, []);
  const location = useLocation();

  const renderContenido = () => {
    switch (location.pathname) {
      case "/":
        return <Productos />;
      case "/clientes":
        return <Clientes />;
      case "/compras":
        return <Compras />;
      case "/movimientos":
        return <MovimientosSemanal />;
      case "/servicios":
        return <Servicios />;
      case "/servicios-cobrados":
        return <ServiciosCobrados />;
      case "/proveedores":
        return <Proveedores />;
      case "/empleados":
        return <Empleados />;
      default:
        return <Productos />;
    }
  };

  return (
    <>
  <InactividadBlur />
  <Flex
    position="fixed"
    top="0"
    right="0"
    p={4}
    zIndex="999"
    bg="transparent"
  >
    <NotificacionesStock />
  </Flex>

  {/* Alertas visuales fijas al tope del contenido
  {alertas.length > 0 && (
    <VStack spacing={2} px={6} pt={20}>
      {alertas.map((msg, i) => (
        <Alert key={i} status="warning" borderRadius="md">
          <AlertIcon />
          {msg}
        </Alert>
      ))}
    </VStack>
  )} */}
    <Box w="100vw" minH="100vh" bg="gray.900" css={{ overflowX: "clip" }}>
      <Flex minH="100vh">
        <Box
          bg="gray.900"
          position="sticky"
          top={0}
          h="100vh"
          w="250px"
          flexShrink={0}
          borderRight="1px solid"
          borderColor="gray.700"
        >
          <MenuLateral usuario={usuario} setUsuario={setUsuario} />
        </Box>

        <Flex direction="column" flex="1" minH="100vh">
          <Box
            flex="1"
            px={4}
            py={6}
            pb="80px"
            overflowY="auto"
            css={{
              overflowX: "clip",
              "& > *": {
                maxWidth: "100%",
                overflowX: "hidden",
              },
            }}
          >
            {renderContenido()}
          </Box>

          <Box
            position="sticky"
            bottom={0}
            h="80px"
            bg="gray.800"
            borderTop="1px solid"
            borderColor="gray.700"
          >
            <BarraNavegacion />
          </Box>
        </Flex>
      </Flex>
    </Box>
    </>
  );
};

export default Layout;
