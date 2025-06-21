// Empleados.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Box, Input, Button, Heading, VStack, HStack, Grid, Text, Select,
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, useDisclosure, Flex, IconButton,
  Tooltip, Checkbox, Spinner, SimpleGrid, Badge, useToast, AlertDialog,
  AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, List, ListItem
} from "@chakra-ui/react";
import { AddIcon, ViewIcon, ViewOffIcon, DownloadIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Empleados = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [empleados, setEmpleados] = useState([]);
  const [vistaLista, setVistaLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [editandoId, setEditandoId] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  const empleadosRef = collection(db, "empleados");

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    observacion: ""
  });

  const cancelRef = useRef();
  const { isOpen: isOpenDialog, onOpen: onOpenDialog, onClose: onCloseDialog } = useDisclosure();
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);

  const obtenerEmpleados = async () => {
    const data = await getDocs(empleadosRef);
    setEmpleados(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    obtenerEmpleados();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setNuevoEmpleado({ ...nuevoEmpleado, [name]: value });
  };

  const limpiarFormulario = () => {
    setNuevoEmpleado({ nombre: "", telefono: "", email: "", direccion: "", observacion: "" });
    setEditandoId(null);
    onClose();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await updateDoc(doc(db, "empleados", editandoId), nuevoEmpleado);
        toast({ title: "Empleado actualizado", status: "success" });
      } else {
        await addDoc(empleadosRef, nuevoEmpleado);
        toast({ title: "Empleado agregado", status: "success" });
      }
      limpiarFormulario();
      obtenerEmpleados();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const editarEmpleado = (empleado) => {
    setNuevoEmpleado(empleado);
    setEditandoId(empleado.id);
    onOpen();
  };

  const solicitarEliminacion = (Empleado) => {
    setEmpleadoAEliminar(empleado);
    onOpenDialog();
  };

  const confirmarEliminacion = async () => {
    try {
      if (empleadoAEliminar) {
        await deleteDoc(doc(db, "empleados", empleadoAEliminar.id));
        toast({ title: "Empleado eliminado", status: "info" });
      } else if (empleadosSeleccionados.length > 0) {
        for (const id of empleadosSeleccionados) {
          await deleteDoc(doc(db, "empleados", id));
        }
        toast({ title: "Empleados eliminados", status: "info" });
        setEmpleadosSeleccionados([]);
        setModoSeleccion(false);
      }
      obtenerEmpleados();
      onCloseDialog();
      setEmpleadoAEliminar(null);
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const empleadosFiltrados = empleados.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda) ||
    e.telefono.includes(busqueda) ||
    e.email.toLowerCase().includes(busqueda)
  );

  const empleadosOrdenados = [...empleadosFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const exportarAExcel = () => {
    const data = empleados.map((e) => ({
      Nombre: e.nombre,
      Teléfono: e.telefono,
      Email: e.email,
      Dirección: e.direccion,
      Observación: e.observacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empleados");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `empleados_${new Date().toLocaleDateString()}.xlsx`);
  };

  const importarEmpleados = async (empleadosExcel) => {
    setCargandoMasivo(true);
    try {
      for (const e of empleadosExcel) {
        const empleadoFormateado = {
          nombre: e.nombre || "",
          telefono: e.telefono || "",
          email: e.email || "",
          direccion: e.direccion || "",
          observacion: e.observacion || ""
        };
        await addDoc(empleadosRef, empleadoFormateado);
      }
      toast({ title: "Empleados importados", status: "success" });
      obtenerEmpleados();
    } catch (error) {
      toast({ title: "Error al importar", status: "error" });
    } finally {
      setCargandoMasivo(false);
    }
  };

  const procesarExcelMasivo = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const empleadosExcel = XLSX.utils.sheet_to_json(sheet);
      if (empleadosExcel.length > 0) {
        importarEmpleados(empleadosExcel);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleSeleccionEmpleado = (id) => {
    setEmpleadosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <Box minH="100vh" bg="gray.900" color="white" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🏢 Empleados</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />} onClick={() => setVistaLista(!vistaLista)} aria-label="Cambiar vista" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Agregar empleado">
            <IconButton icon={<AddIcon />} onClick={() => { limpiarFormulario(); onOpen(); }} aria-label="Agregar empleado" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Exportar a Excel">
            <IconButton icon={<DownloadIcon />} onClick={exportarAExcel} aria-label="Exportar" colorScheme="teal" />
          </Tooltip>
          <Button leftIcon={<DownloadIcon />} colorScheme="teal" variant="outline" size="sm" as="label" cursor="pointer">
            Importar desde Excel
            <input type="file" accept=".xlsx, .xls" hidden onChange={(e) => { if (e.target.files[0]) procesarExcelMasivo(e.target.files[0]); }} />
          </Button>
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <IconButton icon={<ViewIcon />} aria-label="Modo selección múltiple" onClick={() => { setModoSeleccion((prev) => !prev); setEmpleadosSeleccionados([]); }} colorScheme={modoSeleccion ? "yellow" : "red"} />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input placeholder="Buscar empleado..." mb={4} value={busqueda} onChange={(e) => setBusqueda(e.target.value.toLowerCase())} />

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox isChecked={empleadosSeleccionados.length === empleadosOrdenados.length} onChange={(e) => {
              if (e.target.checked) {
                const todosIds = empleadosOrdenados.map((e) => e.id);
                setEmpleadosSeleccionados(todosIds);
              } else {
                setEmpleadosSeleccionados([]);
              }
            }}>
              Seleccionar todos
            </Checkbox>
            {empleadosSeleccionados.length > 0 && (
              <Button colorScheme="red" isLoading={eliminandoMasivo} onClick={() => { setEmpleadoAEliminar(null); onOpenDialog(); }}>
                Eliminar {empleadosSeleccionados.length} seleccionados
              </Button>
            )}
          </HStack>
        )}

        {cargandoMasivo && (
          <Flex justify="center" align="center" mb={6}>
            <Spinner size="lg" color="teal.300" mr={3} />
            <Text fontSize="md" color="gray.300">Importando empleados...</Text>
          </Flex>
        )}

        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
              {empleadosOrdenados.map((e, index) => (
                <motion.div key={e.id || index} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                  {modoSeleccion && (
                    <Checkbox isChecked={empleadosSeleccionados.includes(e.id)} onChange={() => toggleSeleccionEmpleado(e.id)} colorScheme="teal" />
                  )}
                  <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                    <Heading size="md" mb={1}>{e.nombre}</Heading>
                    <Text fontSize="sm" color="gray.400">📞 Teléfono: {e.telefono}</Text>
                    <Text fontSize="sm" color="gray.400">📧 Email: {e.email}</Text>
                    <Text fontSize="sm" color="gray.400">🏠 Dirección: {e.direccion}</Text>
                    <Text fontSize="sm" color="gray.400">📝 Observación: {e.observacion}</Text>
                    <HStack mt={3} spacing={2}>
                      <Button size="sm" colorScheme="blue" onClick={() => editarEmpleado(e)}>Editar</Button>
                      <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(e)}>Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {empleadosOrdenados.map((e, index) => (
              <motion.div key={e.id || index} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                {modoSeleccion && (
                  <Checkbox isChecked={empleadosSeleccionados.includes(e.id)} onChange={() => toggleSeleccionEmpleado(e.id)} colorScheme="teal" />
                )}
                <Box p={4} bg="gray.800" borderRadius="md" shadow="lg">
                  <Heading size="lg">{e.nombre}</Heading>
                  <Text fontSize="sm" color="gray.400">📞 Teléfono: {e.telefono}</Text>
                  <Text fontSize="sm" color="gray.400">📧 Email: {e.email}</Text>
                  <Text fontSize="sm" color="gray.400">🏠 Dirección: {e.direccion}</Text>
                  <Text fontSize="sm" color="gray.400">📝 Observación: {e.observacion}</Text>
                  <HStack mt={3} spacing={2}>
                    <Button size="sm" colorScheme="blue" onClick={() => editarEmpleado(e)}>Editar</Button>
                    <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(e)}>Eliminar</Button>
                  </HStack>
                </Box>
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader>{editandoId ? "✏️ Editar empleado" : "➕ Agregar empleado"}</DrawerHeader>
          <DrawerBody>
            <form id="formEmpleado" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
                <Input name="nombre" placeholder="Nombre" value={nuevoEmpleado.nombre} onChange={manejarCambio} />
                <Input name="telefono" placeholder="Teléfono" value={nuevoEmpleado.telefono} onChange={manejarCambio} />
                <Input name="email" placeholder="Email" value={nuevoEmpleado.email} onChange={manejarCambio} />
                <Input name="direccion" placeholder="Dirección" value={nuevoEmpleado.direccion} onChange={manejarCambio} />
                <Input name="observacion" placeholder="Observación" value={nuevoEmpleado.observacion} onChange={manejarCambio} />
              </Grid>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={limpiarFormulario} bg="gray.700" color="white" _hover={{ bg: "gray.600" }}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" form="formEmpleado">{editandoId ? "Guardar cambios" : "Agregar empleado"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog isOpen={isOpenDialog} leastDestructiveRef={cancelRef} onClose={onCloseDialog}>
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Eliminar empleado</AlertDialogHeader>
            <AlertDialogBody>
              {empleadoAEliminar ? (
                <>¿Estás seguro que querés eliminar <strong>{empleadoAEliminar?.nombre}</strong>? Esta acción no se puede deshacer.</>
              ) : (
                <>¿Estás seguro que querés eliminar <strong>{empleadosSeleccionados.length}</strong> empleados seleccionados? Esta acción no se puede deshacer.</>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDialog}>Cancelar</Button>
              <Button colorScheme="red" onClick={confirmarEliminacion} ml={3}>Eliminar</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Empleados;