// src/NotificacionesStock.jsx
import {
    Box,
    IconButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverHeader,
    PopoverBody,
    PopoverCloseButton,
    Badge,
    VStack,
    Text,
    HStack,
  } from "@chakra-ui/react";
  import { FiBell } from "react-icons/fi";
  import { useEffect, useState } from "react";
  import { generarAlertas } from "./alertas"; // Asegurate de tener esta función
  
  const NotificacionesStock = () => {
    const [alertas, setAlertas] = useState([]);
  
    useEffect(() => {
      const cargarAlertas = async () => {
        const resultado = await generarAlertas();
        setAlertas(resultado);
      };
      cargarAlertas();
    }, []);
  
    return (
      <Popover placement="bottom-end">
        <PopoverTrigger>
          <Box position="relative">
            <IconButton
              icon={<FiBell />}
              aria-label="Ver notificaciones"
              bg="gray.800"
              color="white"
              _hover={{ bg: "gray.700" }}
              size="md"
            />
            {alertas.length > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-1"
                right="-1"
                fontSize="0.7em"
                px={2}
              >
                {alertas.length}
              </Badge>
            )}
          </Box>
        </PopoverTrigger>
  
        <PopoverContent bg="gray.900" color="white" border="1px solid #444">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader borderBottom="1px solid #444">🔔 Notificaciones</PopoverHeader>
          <PopoverBody>
            {alertas.length === 0 ? (
                <Text color="gray.400">No hay alertas por el momento.</Text>
            ) : (
                <VStack align="start" spacing={3}>
                {alertas.map((alerta, idx) => (
                    <HStack key={idx} align="start" justify="space-between" w="100%">
                    <Text fontSize="sm">⚠️ {alerta}</Text>
                    <IconButton
                        size="xs"
                        icon={<span>✖</span>}
                        aria-label="Eliminar alerta"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                        setAlertas(prev => prev.filter((_, i) => i !== idx));
                        }}
                    />
                    </HStack>
                ))}
                </VStack>
            )}
            </PopoverBody>

        </PopoverContent>
      </Popover>
    );
  };
  
  export default NotificacionesStock;
  