import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Heading,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { usuarios } from "./usuarios";

const Login = ({ setUsuario }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const manejarLogin = (e) => {
    e.preventDefault();
    const usuarioEncontrado = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (usuarioEncontrado) {
      const usuarioConHora = {
        ...usuarioEncontrado,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("usuario", JSON.stringify(usuarioConHora));
      setUsuario(usuarioConHora);
      toast({ title: "Bienvenido", status: "success" });
      navigate(from);
    } else {
      toast({ title: "Credenciales incorrectas", status: "error" });
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-br, gray.900, gray.800)"
      animation="gradientBG 5s ease infinite"
    >
      <Box
        as="form"
        onSubmit={manejarLogin}
        bg="rgba(255,255,255,0.05)"
        border="1px solid rgba(255,255,255,0.15)"
        borderRadius="xl"
        p={10}
        width={["90%", "400px"]}
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0,0,0,0.37)"
        animation="fadeSlide 0.6s ease"
      >
        <VStack spacing={5}>
          <Heading size="lg" color="teal.300">
            Iniciar Sesión
          </Heading>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <EmailIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              bg="gray.700"
              _hover={{ bg: "gray.600" }}
              _focus={{ bg: "gray.600", borderColor: "teal.400" }}
              color="white"
            />
          </InputGroup>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <LockIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              bg="gray.700"
              _hover={{ bg: "gray.600" }}
              _focus={{ bg: "gray.600", borderColor: "teal.400" }}
              color="white"
            />
          </InputGroup>

          <Button
            type="submit"
            colorScheme="teal"
            w="100%"
            transition="all 0.3s ease"
          >
            Ingresar
          </Button>

          <Text fontSize="sm" color="gray.400" mt={2}>
            Usuarios demo: admin@empresa.com / empleado@empresa.com / Contraseñas: admin123 / empleado123
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;



