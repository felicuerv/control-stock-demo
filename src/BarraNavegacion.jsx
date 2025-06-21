import { Flex, IconButton, HStack, Center } from "@chakra-ui/react";
import { FiBox, FiUsers, FiCreditCard, FiSettings, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

const BarraNavegacion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Flex
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="gray.800"
      borderTop="1px solid #444"
      zIndex="1000"
    >
      <Flex w="100%">
        <IconButton
          icon={<FiBox />}
          aria-label="Productos"
          colorScheme={location.pathname === "/" ? "gray" : "warning"}
          color={location.pathname === "/" ? "white" : "gray.300"}
          onClick={() => navigate("/")}
          fontSize="2xl"
          flex="1"
          borderRadius="0" // <- sin bordes entre ellos
          borderLeftRadius="md" // <- borde izquierdo redondeado
          height="60px" // <- más altura
        />
        <IconButton
          icon={<FiUsers />}
          aria-label="Clientes"
          colorScheme={location.pathname === "/clientes" ? "gray" : "warning"}
          color={location.pathname === "/clientes" ? "white" : "gray.300"}
          onClick={() => navigate("/clientes")}
          fontSize="2xl"
          flex="1"
          borderRadius="0"
          height="60px"
        />
        <IconButton
          icon={<FiCreditCard />}
          aria-label="Compras"
          colorScheme={location.pathname === "/compras" ? "gray" : "warning"}
          color={location.pathname === "/compras" ? "white" : "gray.300"}
          onClick={() => navigate("/compras")}
          fontSize="2xl"
          flex="1"
          borderRadius="0"
          height="60px"
        />
        <IconButton
          icon={<FiRefreshCw />}
          aria-label="Movimientos"
          colorScheme={location.pathname === "/movimientos" ? "gray" : "warning"}
          color={location.pathname === "/movimientos" ? "white" : "gray.300"}
          onClick={() => navigate("/movimientos")}
          fontSize="2xl"
          flex="1"
          borderRadius="0"
          height="60px"
        />
        <IconButton
          icon={<FiSettings />}
          aria-label="Servicios"
          colorScheme={location.pathname === "/servicios" ? "gray" : "warning"}
          color={location.pathname === "/servicios" ? "white" : "gray.300"}
          onClick={() => navigate("/servicios")}
          fontSize="2xl"
          flex="1"
          borderRadius="0"
          borderRightRadius="md" // <- borde derecho redondeado
          height="60px"
        />
      </Flex>
    </Flex>



  );
};

export default BarraNavegacion;

