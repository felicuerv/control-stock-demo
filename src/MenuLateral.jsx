import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  IconButton,
  useDisclosure,
  VStack,
  Text,
  Divider,
  Button,
  Box,
} from "@chakra-ui/react";
import { FiMenu, FiDollarSign, FiSmartphone, FiLogOut, FiTruck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MenuLateral = ({ usuario, setUsuario }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    navigate("/login");
  };

  return (
    <>
      <IconButton
        icon={<FiMenu />}
        aria-label="Abrir menú lateral"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="999"
        onClick={onOpen}
        bg="gray.800"
        color="white"
        _hover={{ bg: "gray.700" }}
        size="md"
      />

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900" color="white">
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid #444">📋 Menú</DrawerHeader>

          {usuario && (
            <Box px={4} pt={2} pb={4} borderBottom="1px solid #444">
              <Text fontSize="sm" color="gray.400">
                Sesión iniciada como:
              </Text>
              <Text fontWeight="bold" color="teal.300">
                {usuario.email}
              </Text>
            </Box>
          )}

          <DrawerBody>
            <VStack spacing={4} align="start">
              <Box
                w="100%"
                p={3}
                borderRadius="md"
                _hover={{ bg: "gray.700", cursor: "pointer" }}
                onClick={() => handleNavigate("/servicios-cobrados")}
              >
                <FiDollarSign style={{ marginRight: "8px", display: "inline" }} />
                <Text display="inline">Servicios Cobrados</Text>
              </Box>
              <Box
                w="100%"
                p={3}
                borderRadius="md"
                _hover={{ bg: "gray.700", cursor: "pointer" }}
                onClick={() => handleNavigate("/proveedores")}
              >
                <FiSmartphone style={{ marginRight: "8px", display: "inline" }} />
                <Text display="inline">Proveedores</Text>
              </Box>
              <Divider borderColor="gray.600" />
                            <Box
                w="100%"
                p={3}
                borderRadius="md"
                _hover={{ bg: "gray.700", cursor: "pointer" }}
                onClick={() => handleNavigate("/empleados")}
              >
                <FiTruck style={{ marginRight: "8px", display: "inline" }} />
                <Text display="inline">Empleados</Text>
              </Box>

            <Button
              leftIcon={<FiLogOut />}
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={cerrarSesion}
              alignSelf="start"
            >
              Cerrar sesión
            </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};


export default MenuLateral;

