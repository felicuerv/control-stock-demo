import React, { useState, useEffect, useRef } from "react";
import {
  Box, Input, Button, Textarea, Heading, VStack, HStack, Grid,
  FormLabel, Text, useToast, Select, Drawer, DrawerBody,
  DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, Flex, useDisclosure, SimpleGrid, Badge,
  IconButton, Tooltip, Checkbox, Spinner
} from "@chakra-ui/react";
import { AddIcon, ViewIcon, ViewOffIcon, DownloadIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Clientes = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const clientesRef = collection(db, "clientes");

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [vistaLista, setVistaLista] = useState(true);
  const [pagina, setPagina] = useState(1);
  const clientesPorPagina = 10;
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);


  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    observacion: ""
  });

  const obtenerClientes = async () => {
    const data = await getDocs(clientesRef);
    const docs = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setClientes(docs);
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda) ||
    c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clientesPaginados = clientesFiltrados.slice(0, pagina * clientesPorPagina);
  const hayMasClientes = clientesFiltrados.length > clientesPaginados.length;

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setNuevoCliente({ ...nuevoCliente, [name]: value });
  };

  const limpiarFormulario = () => {
    setNuevoCliente({
      nombre: "",
      telefono: "",
      email: "",
      direccion: "",
      observacion: ""
    });
    setClienteEditandoId(null);
    onClose();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (clienteEditandoId) {
        await updateDoc(doc(db, "clientes", clienteEditandoId), nuevoCliente);
        toast({ title: "Cliente actualizado", status: "success" });
      } else {
        await addDoc(clientesRef, nuevoCliente);
        toast({ title: "Cliente agregado", status: "success" });
      }
      limpiarFormulario();
      obtenerClientes();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const editarCliente = (cliente) => {
    setNuevoCliente(cliente);
    setClienteEditandoId(cliente.id);
    onOpen();
  };

  const eliminarCliente = async (id) => {
    await deleteDoc(doc(db, "clientes", id));
    toast({ title: "Cliente eliminado", status: "info" });
    obtenerClientes();
  };

  const exportarClientesExcel = () => {
    const data = clientes.map((c) => ({
      Nombre: c.nombre,
      Telefono: c.telefono,
      Email: c.email,
      Direccion: c.direccion,
      Observacion: c.observacion,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "clientes.xlsx");
  };

  const toggleSeleccionCliente = (id) => {
    setClientesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const eliminarSeleccionados = async () => {
    setEliminandoMasivo(true);
    try {
      const eliminar = clientesSeleccionados.map((id) => deleteDoc(doc(db, "clientes", id)));
      await Promise.all(eliminar);
      toast({ title: "Clientes eliminados", status: "success" });
      obtenerClientes();
      setClientesSeleccionados([]);
      setModoSeleccion(false);
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
    setEliminandoMasivo(false);
  };

  const procesarExcelMasivo = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const clientesExcel = XLSX.utils.sheet_to_json(sheet);
  
        for (const cliente of clientesExcel) {
          const clienteFormateado = {
            nombre: cliente.nombre || "",
            telefono: cliente.telefono || "",
            email: cliente.email || "",
            direccion: cliente.direccion || "",
            observacion: cliente.observacion || ""
          };
  
          await addDoc(clientesRef, clienteFormateado);
        }
  
        toast({
          title: "Importación exitosa",
          description: `${clientesExcel.length} clientes importados correctamente.`,
          status: "success",
          duration: 4000,
          isClosable: true
        });
  
        obtenerClientes();
      } catch (error) {
        toast({
          title: "Error al importar",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const importarClientes = async (clientesExcel) => {
    setCargandoMasivo(true); // ⬅️ Mostrar spinner
  
    try {
      for (const cliente of clientesExcel) {
        const clienteFormateado = {
          nombre: cliente.nombre || "",
          telefono: cliente.telefono || "",
          email: cliente.email || "",
          direccion: cliente.direccion || "",
          observacion: cliente.observacion || "",
        };
        await addDoc(clientesRef, clienteFormateado);
      }
  
      toast({ title: "Clientes importados", status: "success" });
      await obtenerClientes();
    } catch (error) {
      console.error("Error al importar:", error);
      toast({ title: "Error al importar clientes", status: "error" });
    } finally {
      setCargandoMasivo(false); // ⬅️ Ocultar spinner
    }
  };
  
  
  

  return (
    <Box minH="100vh" bg="gray.900" color="white" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🧑 Clientes</Heading>
        <HStack spacing={2}>
          <Tooltip label="Vista tarjetas / lista">
            <IconButton icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />} onClick={() => setVistaLista(!vistaLista)} colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Agregar producto">
            <IconButton
                icon={<AddIcon />}
                onClick={() => {
                  limpiarFormulario();
                  onOpen();
                }}
                aria-label="Agregar producto"
                colorScheme="teal"
              />
          </Tooltip>
          <Tooltip label="Exportar a Excel">
            <IconButton icon={<DownloadIcon />} onClick={exportarClientesExcel} colorScheme="teal"/>
          </Tooltip>
          <Button
                leftIcon={<DownloadIcon />}
                colorScheme="teal"
                variant="outline"
                size="sm"
                as="label"
                cursor="pointer"
                >
                Importar desde Excel
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    hidden
                    onChange={(e) => {
                    if (e.target.files[0]) procesarExcelMasivo(e.target.files[0]);
                    }}
                />
                </Button>

          <Tooltip label="Seleccion múltiple">
            <IconButton icon={<ViewIcon />} onClick={() => {
              setModoSeleccion((prev) => !prev);
              setClientesSeleccionados([]);
            }} colorScheme={modoSeleccion ? "yellow" : "red"} />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input placeholder="Buscar cliente..." mb={4} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox
              isChecked={clientesSeleccionados.length === clientesFiltrados.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const todosIds = clientesFiltrados.map((c) => c.id);
                  setClientesSeleccionados(todosIds);
                } else {
                  setClientesSeleccionados([]);
                }
              }}
            >
              Seleccionar todos
            </Checkbox>
            {clientesSeleccionados.length > 0 && (
              <Button
                colorScheme="red"
                isLoading={eliminandoMasivo}
                onClick={eliminarSeleccionados}
              >
                Eliminar {clientesSeleccionados.length} seleccionados
              </Button>
            )}
          </HStack>
        )}

            {cargandoMasivo && (
            <Flex justify="center" align="center" mb={6}>
                <Spinner size="lg" color="teal.300" mr={3} />
                <Text fontSize="md" color="gray.300">Importando Clientes...</Text>
            </Flex>
            )}

        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
              {clientesPaginados.map((c, index) => (
                <motion.div
                  key={c.id || index}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {modoSeleccion && (
                    <Checkbox
                      isChecked={clientesSeleccionados.includes(c.id)}
                      onChange={() => toggleSeleccionCliente(c.id)}
                      colorScheme="teal"
                    />
                  )}

                  <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                  <Heading size="md">{c.nombre}</Heading>
                    <Text>📞 Tel: {c.telefono}</Text>
                    <Text>📧 Email: {c.email}</Text>
                    <Text>🏠 Dirección: {c.direccion}</Text>
                    <Text>📝 Observación: {c.observacion}</Text>
                    <HStack mt={3} spacing={2}>
                      <Button size="sm" onClick={() => editarCliente(c)} colorScheme="blue">Editar</Button>
                      <Button size="sm" onClick={() => eliminarCliente(c.id)} colorScheme="red">Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <AnimatePresence mode="wait">
            {clientesPaginados.map((c, index) => (
                <motion.div
                    key={c.id || index}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                {modoSeleccion && (
                    <Checkbox
                      isChecked={clientesSeleccionados.includes(c.id)}
                      onChange={() => toggleSeleccionCliente(c.id)}
                      colorScheme="teal"
                    />
                  )}
              <Box key={c.id || index} p={4} bg="gray.800" borderRadius="md" shadow="md">
                  <Heading size="lg">{c.nombre}</Heading>
                    <Text>📞 Tel: {c.telefono}</Text>
                    <Text>📧 Email: {c.email}</Text>
                    <Text>🏠 Dirección: {c.direccion}</Text>
                    <Text>📝 Observación: {c.observacion}</Text>
                <HStack mt={3} spacing={2}>
                  <Button size="sm" onClick={() => editarCliente(c)} colorScheme="blue">Editar</Button>
                  <Button size="sm" onClick={() => eliminarCliente(c.id)} colorScheme="red">Eliminar</Button>
                </HStack>
              </Box>
              </motion.div>
            ))}
            </AnimatePresence>
          </SimpleGrid>
        )}

        {hayMasClientes && (
          <Flex justify="center" mt={6}>
            <Button onClick={() => setPagina(pagina + 1)} colorScheme="teal">
              Cargar más clientes
            </Button>
          </Flex>
        )}
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader>{clienteEditandoId ? "✏️ Editar cliente" : "➕ Agregar cliente"}</DrawerHeader>
          <DrawerBody>
            <form id="formCliente" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
              <Input name="nombre" placeholder="Nombre" value={nuevoCliente.nombre} onChange={manejarCambio} />
                <Input name="telefono" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={manejarCambio} />
                <Input name="email" placeholder="Email" value={nuevoCliente.email} onChange={manejarCambio} />
                <Input name="direccion" placeholder="Dirección" value={nuevoCliente.direccion} onChange={manejarCambio} />
                <Textarea name="observacion" placeholder="Observación" value={nuevoCliente.observacion} onChange={manejarCambio} />
              </Grid>
            </form>
          </DrawerBody>
          <DrawerFooter>
          <Button
              variant="outline"
              mr={3}
              onClick={limpiarFormulario}
              bg="gray.700"
              color="white"
              _hover={{ bg: "gray.600" }}
            >
              Cancelar
            </Button>
            <Button colorScheme="teal" type="submit" form="formCliente">Guardar</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Clientes;

