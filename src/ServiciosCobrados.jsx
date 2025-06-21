import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  Box, Flex, Text, Heading, VStack, HStack, Button, Checkbox, Tooltip,
  Input, Badge, SimpleGrid, Spinner, Drawer, DrawerOverlay, DrawerContent,
  DrawerCloseButton, DrawerHeader, DrawerBody, Grid, Select, useDisclosure, useToast
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { AnimatePresence, motion } from "framer-motion";

const ServiciosCobrados = () => {
  const [servicios, setServicios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vistaLista, setVistaLista] = useState(true);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [totalCobrado, setTotalCobrado] = useState(0);
  const [editandoServicio, setEditandoServicio] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const serviciosRef = collection(db, "servicios");

  const obtenerServicios = async () => {
    const data = await getDocs(serviciosRef);
    const cobrados = data.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(s => s.estado === "cobrado");
    setServicios(cobrados);
    const total = cobrados.reduce((acc, s) => acc + (s.importe || 0), 0);
    setTotalCobrado(total);
  };

  useEffect(() => {
    obtenerServicios();
  }, []);

  const eliminarSeleccionados = async () => {
    try {
      const eliminar = seleccionados.map(id => deleteDoc(doc(db, "servicios", id)));
      await Promise.all(eliminar);
      toast({ title: "Servicios eliminados", status: "success" });
      setSeleccionados([]);
      setModoSeleccion(false);
      obtenerServicios();
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
  };

  const serviciosFiltrados = servicios.filter(s =>
    s.cliente.toLowerCase().includes(busqueda) ||
    s.equipo.toLowerCase().includes(busqueda) ||
    s.codigo.toLowerCase().includes(busqueda) ||
    s.descripcion?.toLowerCase().includes(busqueda)
  );

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setEditandoServicio({ ...editandoServicio, [name]: value });
  };

  const guardarCambios = async () => {
    try {
      await updateDoc(doc(db, "servicios", editandoServicio.id), editandoServicio);
      toast({ title: "Servicio actualizado", status: "success" });
      setEditandoServicio(null);
      onClose();
      obtenerServicios();
    } catch (err) {
      toast({ title: "Error al actualizar", status: "error" });
    }
  };

  return (
    <Box maxW="1000px" mx="auto" px={4} py={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading fontSize="2xl" color="teal.300">💰 Servicios Cobrados</Heading>
        <Text color="teal.200" fontWeight="bold">Total cobrado: ${totalCobrado}</Text>
      </Flex>

      <Flex mb={4} justify="space-between">
        <Input
          placeholder="Buscar servicio..."
          value={busqueda}
          color="white"
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
          maxW="300px"
        />
        <HStack>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <Button onClick={() => setVistaLista(!vistaLista)} colorScheme="teal">
              {vistaLista ? <ViewOffIcon /> : <ViewIcon />}
            </Button>
          </Tooltip>
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <Button
              onClick={() => {
                setModoSeleccion(!modoSeleccion);
                setSeleccionados([]);
              }}
              colorScheme={modoSeleccion ? "yellow" : "red"}
            >
              <ViewIcon />
            </Button>
          </Tooltip>
        </HStack>
      </Flex>

      {modoSeleccion && (
        <HStack mb={4}>
          <Checkbox
            color="white"
            isChecked={seleccionados.length === serviciosFiltrados.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSeleccionados(serviciosFiltrados.map(s => s.id));
              } else {
                setSeleccionados([]);
              }
            }}
          >
            Seleccionar todos
          </Checkbox>
          {seleccionados.length > 0 && (
            <Button colorScheme="red" onClick={eliminarSeleccionados}>
              Eliminar {seleccionados.length} seleccionados
            </Button>
          )}
        </HStack>
      )}

      {vistaLista ? (
        <VStack spacing={4} align="stretch">
          <AnimatePresence>
            {serviciosFiltrados.map((s, index) => (
              <motion.div
                key={s.id || index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                {modoSeleccion && (
                  <Checkbox
                    isChecked={seleccionados.includes(s.id)}
                    onChange={() => toggleSeleccion(s.id)}
                    colorScheme="teal"
                  />
                )}
                <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                  <Heading size="sm" color="white" mb={1}>{s.cliente}</Heading>
                  <Text fontSize="sm" color="gray.400">🛠️ Equipo: {s.equipo}</Text>
                  <Text fontSize="sm" color="gray.400">🛠️ Codigo: {s.codigo}</Text>
                  <Text fontSize="sm" color="gray.400">💰 Importe: ${s.importe}</Text>
                  <Text fontSize="sm" color="gray.400">📆 Entrega: {s.fechaFinalizacion}</Text>
                  <Text fontSize="sm" color="gray.400">🧾 Método: {s.metodoPago}</Text>
                  <HStack mt={3}>
                    <Button size="sm" colorScheme="blue" onClick={() => { setEditandoServicio(s); onOpen(); }}>Editar</Button>
                    <Button size="sm" colorScheme="red" onClick={() => eliminarSeleccionados([s.id])}>Eliminar</Button>
                  </HStack>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {serviciosFiltrados.map((s, index) => (
            <motion.div
              key={s.id || index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              {modoSeleccion && (
                <Checkbox
                  isChecked={seleccionados.includes(s.id)}
                  onChange={() => toggleSeleccion(s.id)}
                  colorScheme="teal"
                />
              )}
              <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                <Heading size="sm" color="white" mb={1}>{s.cliente}</Heading>
                <Text fontSize="sm" color="gray.400">🛠️ Equipo: {s.equipo}</Text>
                <Text fontSize="sm" color="gray.400">💰 Importe: ${s.importe}</Text>
                <Text fontSize="sm" color="gray.400">📆 Entrega: {s.fechaFinalizacion}</Text>
                <Text fontSize="sm" color="gray.400">🧾 Método: {s.metodoPago}</Text>
                <HStack mt={3}>
                  <Button size="sm" colorScheme="blue" onClick={() => { setEditandoServicio(s); onOpen(); }}>Editar</Button>
                  <Button size="sm" colorScheme="red" onClick={() => eliminarSeleccionados([s.id])}>Eliminar</Button>
                </HStack>
              </Box>
            </motion.div>
          ))}
        </SimpleGrid>
      )}

      {/* Drawer para editar */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader>Editar servicio</DrawerHeader>
          <DrawerBody>
            {editandoServicio && (
              <Grid templateColumns="1fr" gap={4}>
                <Input
                  name="cliente"
                  placeholder="Cliente"
                  value={editandoServicio.cliente}
                  onChange={manejarCambio}
                />
                <Input
                  name="equipo"
                  placeholder="Equipo"
                  value={editandoServicio.equipo}
                  onChange={manejarCambio}
                />
                <Input
                  name="importe"
                  type="number"
                  placeholder="Importe"
                  value={editandoServicio.importe}
                  onChange={manejarCambio}
                />
                <Input
                  name="fechaFinalizacion"
                  type="date"
                  value={editandoServicio.fechaFinalizacion}
                  onChange={manejarCambio}
                />
                <Select
                  name="metodoPago"
                  value={editandoServicio.metodoPago}
                  onChange={manejarCambio}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>

                </Select>
                <Button colorScheme="teal" onClick={guardarCambios}>
                  Guardar cambios
                </Button>
              </Grid>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ServiciosCobrados;
