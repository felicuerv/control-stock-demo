// src/InactividadBlur.jsx
import {
  Box,
  VStack,
  Text,
  Button,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

const InactividadBlur = () => {
  const [inactivo, setInactivo] = useState(false);
  const [password, setPassword] = useState("");
  const timeoutRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // ✅ Revisar si ya estaba bloqueado al cargar
  useEffect(() => {
    if (localStorage.getItem("bloqueado") === "true") {
      setInactivo(true);
      onOpen();
    }
  }, []);

  const resetInactividad = () => {
    if (!inactivo) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setInactivo(true);
        localStorage.setItem("bloqueado", "true"); // ✅ Persistir bloqueo
        onOpen(); // Mostrar modal
      }, 10 * 60 * 1000); // 15 minutos
    }
  };

  const verificarContraseña = () => {
    if (password === usuario?.password) {
      setInactivo(false);
      setPassword("");
      onClose();
      localStorage.removeItem("bloqueado"); // ✅ Limpiar bloqueo
      resetInactividad();
    } else {
      toast({
        title: "Contraseña incorrecta",
        status: "error",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const eventos = ["mousemove", "keydown", "mousedown", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, resetInactividad));
    resetInactividad();

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, resetInactividad));
      clearTimeout(timeoutRef.current);
    };
  }, [inactivo]);

  if (!inactivo) return null;

  return (
    <>
      {/* Capa de blur */}
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        bg="rgba(0,0,0,0.5)"
        backdropFilter="blur(10px)"
        zIndex={1}
      />

      {/* Modal de contraseña */}
      <Modal isOpen={isOpen} onClose={() => {}} isCentered motionPreset="scale" zIndex={10}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>🔒 Sesión bloqueada</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.300">
                Por seguridad, ingresá tu contraseña para continuar.
              </Text>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg="gray.700"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={verificarContraseña}>
              Desbloquear
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InactividadBlur;

  
