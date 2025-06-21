// Proveedores.jsx

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

const Proveedores = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [proveedores, setProveedores] = useState([]);
  const [vistaLista, setVistaLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [editandoId, setEditandoId] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  const proveedoresRef = collection(db, "proveedores");

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    observacion: ""
  });

  const cancelRef = useRef();
  const { isOpen: isOpenDialog, onOpen: onOpenDialog, onClose: onCloseDialog } = useDisclosure();
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  const obtenerProveedores = async () => {
    const data = await getDocs(proveedoresRef);
    setProveedores(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    obtenerProveedores();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setNuevoProveedor({ ...nuevoProveedor, [name]: value });
  };

  const limpiarFormulario = () => {
    setNuevoProveedor({ nombre: "", telefono: "", email: "", direccion: "", observacion: "" });
    setEditandoId(null);
    onClose();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await updateDoc(doc(db, "proveedores", editandoId), nuevoProveedor);
        toast({ title: "Proveedor actualizado", status: "success" });
      } else {
        await addDoc(proveedoresRef, nuevoProveedor);
        toast({ title: "Proveedor agregado", status: "success" });
      }
      limpiarFormulario();
      obtenerProveedores();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const editarProveedor = (proveedor) => {
    setNuevoProveedor(proveedor);
    setEditandoId(proveedor.id);
    onOpen();
  };

  const solicitarEliminacion = (proveedor) => {
    setProveedorAEliminar(proveedor);
    onOpenDialog();
  };

  const confirmarEliminacion = async () => {
    try {
      if (proveedorAEliminar) {
        await deleteDoc(doc(db, "proveedores", proveedorAEliminar.id));
        toast({ title: "Proveedor eliminado", status: "info" });
      } else if (proveedoresSeleccionados.length > 0) {
        for (const id of proveedoresSeleccionados) {
          await deleteDoc(doc(db, "proveedores", id));
        }
        toast({ title: "Proveedores eliminados", status: "info" });
        setProveedoresSeleccionados([]);
        setModoSeleccion(false);
      }
      obtenerProveedores();
      onCloseDialog();
      setProveedorAEliminar(null);
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda) ||
    p.telefono.includes(busqueda) ||
    p.email.toLowerCase().includes(busqueda)
  );

  const proveedoresOrdenados = [...proveedoresFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const exportarAExcel = () => {
    const data = proveedores.map((p) => ({
      Nombre: p.nombre,
      Teléfono: p.telefono,
      Email: p.email,
      Dirección: p.direccion,
      Observación: p.observacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `proveedores_${new Date().toLocaleDateString()}.xlsx`);
  };

  const importarProveedores = async (proveedoresExcel) => {
    setCargandoMasivo(true);
    try {
      for (const p of proveedoresExcel) {
        const proveedorFormateado = {
          nombre: p.nombre || "",
          telefono: p.telefono || "",
          email: p.email || "",
          direccion: p.direccion || "",
          observacion: p.observacion || ""
        };
        await addDoc(proveedoresRef, proveedorFormateado);
      }
      toast({ title: "Proveedores importados", status: "success" });
      obtenerProveedores();
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
      const proveedoresExcel = XLSX.utils.sheet_to_json(sheet);
      if (proveedoresExcel.length > 0) {
        importarProveedores(proveedoresExcel);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleSeleccionProveedor = (id) => {
    setProveedoresSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <Box minH="100vh" bg="gray.900" color="white" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🏢 Proveedores</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />} onClick={() => setVistaLista(!vistaLista)} aria-label="Cambiar vista" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Agregar proveedor">
            <IconButton icon={<AddIcon />} onClick={() => { limpiarFormulario(); onOpen(); }} aria-label="Agregar proveedor" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Exportar a Excel">
            <IconButton icon={<DownloadIcon />} onClick={exportarAExcel} aria-label="Exportar" colorScheme="teal" />
          </Tooltip>
          <Button leftIcon={<DownloadIcon />} colorScheme="teal" variant="outline" size="sm" as="label" cursor="pointer">
            Importar desde Excel
            <input type="file" accept=".xlsx, .xls" hidden onChange={(e) => { if (e.target.files[0]) procesarExcelMasivo(e.target.files[0]); }} />
          </Button>
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <IconButton icon={<ViewIcon />} aria-label="Modo selección múltiple" onClick={() => { setModoSeleccion((prev) => !prev); setProveedoresSeleccionados([]); }} colorScheme={modoSeleccion ? "yellow" : "red"} />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input placeholder="Buscar proveedor..." mb={4} value={busqueda} onChange={(e) => setBusqueda(e.target.value.toLowerCase())} />

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox isChecked={proveedoresSeleccionados.length === proveedoresOrdenados.length} onChange={(e) => {
              if (e.target.checked) {
                const todosIds = proveedoresOrdenados.map((p) => p.id);
                setProveedoresSeleccionados(todosIds);
              } else {
                setProveedoresSeleccionados([]);
              }
            }}>
              Seleccionar todos
            </Checkbox>
            {proveedoresSeleccionados.length > 0 && (
              <Button colorScheme="red" isLoading={eliminandoMasivo} onClick={() => { setProveedorAEliminar(null); onOpenDialog(); }}>
                Eliminar {proveedoresSeleccionados.length} seleccionados
              </Button>
            )}
          </HStack>
        )}

        {cargandoMasivo && (
          <Flex justify="center" align="center" mb={6}>
            <Spinner size="lg" color="teal.300" mr={3} />
            <Text fontSize="md" color="gray.300">Importando proveedores...</Text>
          </Flex>
        )}

        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
              {proveedoresOrdenados.map((p, index) => (
                <motion.div key={p.id || index} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                  {modoSeleccion && (
                    <Checkbox isChecked={proveedoresSeleccionados.includes(p.id)} onChange={() => toggleSeleccionProveedor(p.id)} colorScheme="teal" />
                  )}
                  <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                    <Heading size="md" mb={1}>{p.nombre}</Heading>
                    <Text fontSize="sm" color="gray.400">📞 Teléfono: {p.telefono}</Text>
                    <Text fontSize="sm" color="gray.400">📧 Email: {p.email}</Text>
                    <Text fontSize="sm" color="gray.400">🏠 Dirección: {p.direccion}</Text>
                    <Text fontSize="sm" color="gray.400">📝 Observación: {p.observacion}</Text>
                    <HStack mt={3} spacing={2}>
                      <Button size="sm" colorScheme="blue" onClick={() => editarProveedor(p)}>Editar</Button>
                      <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(p)}>Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {proveedoresOrdenados.map((p, index) => (
              <motion.div key={p.id || index} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                {modoSeleccion && (
                  <Checkbox isChecked={proveedoresSeleccionados.includes(p.id)} onChange={() => toggleSeleccionProveedor(p.id)} colorScheme="teal" />
                )}
                <Box p={4} bg="gray.800" borderRadius="md" shadow="lg">
                  <Heading size="lg">{p.nombre}</Heading>
                  <Text fontSize="sm" color="gray.400">📞 Teléfono: {p.telefono}</Text>
                  <Text fontSize="sm" color="gray.400">📧 Email: {p.email}</Text>
                  <Text fontSize="sm" color="gray.400">🏠 Dirección: {p.direccion}</Text>
                  <Text fontSize="sm" color="gray.400">📝 Observación: {p.observacion}</Text>
                  <HStack mt={3} spacing={2}>
                    <Button size="sm" colorScheme="blue" onClick={() => editarProveedor(p)}>Editar</Button>
                    <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(p)}>Eliminar</Button>
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
          <DrawerHeader>{editandoId ? "✏️ Editar proveedor" : "➕ Agregar proveedor"}</DrawerHeader>
          <DrawerBody>
            <form id="formProveedor" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
                <Input name="nombre" placeholder="Nombre" value={nuevoProveedor.nombre} onChange={manejarCambio} />
                <Input name="telefono" placeholder="Teléfono" value={nuevoProveedor.telefono} onChange={manejarCambio} />
                <Input name="email" placeholder="Email" value={nuevoProveedor.email} onChange={manejarCambio} />
                <Input name="direccion" placeholder="Dirección" value={nuevoProveedor.direccion} onChange={manejarCambio} />
                <Input name="observacion" placeholder="Observación" value={nuevoProveedor.observacion} onChange={manejarCambio} />
              </Grid>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={limpiarFormulario} bg="gray.700" color="white" _hover={{ bg: "gray.600" }}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" form="formProveedor">{editandoId ? "Guardar cambios" : "Agregar proveedor"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog isOpen={isOpenDialog} leastDestructiveRef={cancelRef} onClose={onCloseDialog}>
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Eliminar proveedor</AlertDialogHeader>
            <AlertDialogBody>
              {proveedorAEliminar ? (
                <>¿Estás seguro que querés eliminar <strong>{proveedorAEliminar?.nombre}</strong>? Esta acción no se puede deshacer.</>
              ) : (
                <>¿Estás seguro que querés eliminar <strong>{proveedoresSeleccionados.length}</strong> proveedores seleccionados? Esta acción no se puede deshacer.</>
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

export default Proveedores;
