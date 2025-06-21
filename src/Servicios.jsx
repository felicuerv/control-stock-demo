import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter
} from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import { doc, deleteDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Box, Input, Button, Textarea, Heading, VStack, HStack, Grid,
  FormLabel, Text, Badge, useToast, Select, List, ListItem, Flex,
  IconButton, Tooltip, SimpleGrid,
  Drawer, DrawerBody, DrawerFooter, ChakraProvider, extendTheme, DrawerHeader, DrawerOverlay, DrawerContent, Checkbox, Spinner, DrawerCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { AddIcon, ViewIcon, ViewOffIcon, DownloadIcon } from "@chakra-ui/icons";
import { collection, addDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


// Add this to your Chakra theme or global styles
const theme = extendTheme({
  components: {
    Input: {
      variants: {
        date: {
          field: {
            "&::-webkit-datetime-edit": { color: "white", padding: "0.3em" },
            "&::-webkit-datetime-edit-fields-wrapper": { color: "white" },
            "&::-webkit-datetime-edit-text": { 
              color: "teal.300",
              padding: "0 0.2em" 
            },
            "&::-webkit-calendar-picker-indicator": { 
              filter: "invert(1)",
              cursor: "pointer",
              padding: "4px"
            },
            // Calendar dropdown styles
            "&::-webkit-date-and-time-value": { textAlign: "left" },
            "&::-webkit-inner-spin-button": { display: "none" },
          },
        },
      },
    },
  },
  styles: {
    global: {
      // Calendar dropdown styling (WebKit only)
      "::-webkit-datetime-edit-month-field": { color: "teal.300" },
      "::-webkit-datetime-edit-day-field": { color: "teal.300" },
      "::-webkit-datetime-edit-year-field": { color: "teal.300" },
      // Calendar popup
      "::-webkit-datetime-picker": {
        backgroundColor: "gray.800",
        color: "white",
        border: "1px solid",
        borderColor: "gray.600",
        borderRadius: "md",
      },
      "::-webkit-datetime-picker-indicator": { display: "none" },
    },
  },
});




const Servicios = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [servicios, setServicios] = useState([]);
  const [pagina, setPagina] = useState(1);
  const serviciosPorPagina = 15;
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [vistaLista, setVistaLista] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);
  const cancelRef = useRef();
  const {
    isOpen: isOpenDialog,
    onOpen: onOpenDialog,
    onClose: onCloseDialog,
  } = useDisclosure();
  
  const [nuevoServicio, setNuevoServicio] = useState({
    cliente: "",
    equipo: "",
    descripcion: "",
    fechaIngreso: "",
    fechaFinalizacion: "",
    importe: "",
    metodoPago: "",
    estado: "presupuesto",
    codigoInterno: ""
  });

  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const {
    isOpen: isOpenHistorial,
    onClose: onCloseHistorial,
  } = useDisclosure();

  const serviciosRef = collection(db, "servicios");

  const obtenerServicios = async () => {
    const data = await getDocs(serviciosRef);
    const serviciosCargados = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setServicios(serviciosCargados);
  };

  useEffect(() => {
    obtenerServicios();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setNuevoServicio((prev) => ({ ...prev, [name]: value }));
  };

  const exportarAExcel = () => {
    const data = servicios.map((s) => ({
      Cliente: s.cliente,
      Equipo: s.equipo,
      Descripcion: s.descripcion,
      "Fecha de ingreso": s.fechaIngreso,
      "Fecha de Finalizacion": s.fechaFinalizacion,
      Importe: s.importe,
      "Metodo de Pago": s.metodoPago,
      Estado: s.estado,
      codigo: s.codigoInterno,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Servicios");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  
    saveAs(blob, `lista_servicios_${new Date().toLocaleDateString()}.xlsx`);
  };

  const limpiarFormulario = () => {
    setNuevoServicio({
      cliente: "",
      equipo: "",
      descripcion: "",
      fechaIngreso: "",
      fechaFinalizacion: "",
      importe: "",
      metodoPago: "",
      codigoInterno: "",
      estado: "presupuesto"
    });
    setEditandoId(null);
    setMostrarSugerencias(false);
    onClose();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const { cliente, equipo, fechaIngreso, importe, metodoPago, estado, codigoInterno } = nuevoServicio;

    if (!cliente || !equipo || !fechaIngreso || !importe || !metodoPago || !estado || !codigoInterno) {
      toast({ title: "Faltan campos", status: "warning", duration: 3000 });
      return;
    }
    
    const servicioData = {
      cliente: nuevoServicio.cliente,
      equipo: nuevoServicio.equipo,
      estado: nuevoServicio.estado,
      codigo: nuevoServicio.codigoInterno,
      descripcion: nuevoServicio.descripcion,
      fechaIngreso: nuevoServicio.fechaIngreso,
      fechaFinalizacion: nuevoServicio.fechaFinalizacion,
      importe: Number(nuevoServicio.importe),
      metodoPago: nuevoServicio.metodoPago
    };
    
    try {
      if (editandoId) {
        await updateDoc(doc(db, "servicios", editandoId), servicioData);
        toast({ title: "Servicio actualizado", status: "success" });
      } else {
        servicioData.fechaAlta = new Date().toISOString();
        await addDoc(serviciosRef, servicioData);
        toast({ title: "Servicio agregado", status: "success" });
      }
      limpiarFormulario();
      obtenerServicios();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

const editarServicio = (servicio) => {
  setNuevoServicio({
    cliente: servicio.cliente || "",
    equipo: servicio.equipo || "",
    estado: servicio.estado || "",
    codigoInterno: servicio.codigo || servicio.codigoInterno || "",
    descripcion: servicio.descripcion || "",
    fechaIngreso: servicio.fechaIngreso || "",
    fechaFinalizacion: servicio.fechaFinalizacion || "",
    importe: servicio.importe?.toString() || "",
    metodoPago: servicio.metodoPago || ""
  });
  setEditandoId(servicio.id);
  onOpen();
};

const [busquedaCliente, setBusquedaCliente] = useState("");



  const solicitarEliminacion = (servicio) => {
    setServicioAEliminar(servicio);
    onOpenDialog();
  };

  const confirmarEliminacion = async () => {
    try {
      if (servicioAEliminar) {
        await deleteDoc(doc(db, "servicios", servicioAEliminar.id));
        toast({ title: "Servicio eliminado", status: "error" });
      } else if (serviciosSeleccionados.length > 0) {
        for (const id of serviciosSeleccionados) {
          await deleteDoc(doc(db, "servicios", id));
        }
        toast({
          title: "Servicios eliminados",
          description: `${serviciosSeleccionados.length} servicios eliminados correctamente.`,
          status: "error",
        });
        setServiciosSeleccionados([]);
        setModoSeleccion(false);
      }

      obtenerServicios();
      onCloseDialog();
      setServicioAEliminar(null);
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const serviciosFiltrados = servicios
    .filter((s) => s.estado !== "cobrado")
    .filter((s) =>
    s.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.estado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.codigo.toLowerCase().includes(busqueda) ||
    s.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const serviciosOrdenados = [...serviciosFiltrados].sort((a, b) => {
    if (orden === "cliente") return a.cliente.localeCompare(b.cliente);
    if (orden === "estado") return a.estado.localeCompare(b.estado);
    if (orden === "codigo") return a.codigoInterno.localeCompare(b.codigoInterno);
    if (orden === "importeDesc") return b.importe - a.importe;
    if (orden === "importeAsc") return a.importe - b.importe;
    if (orden === "fechaDesc") return new Date(b.fechaIngreso || 0) - new Date(a.fechaIngreso || 0);
    return 0;
  });

  const serviciosPaginados = serviciosOrdenados.slice(0, pagina * serviciosPorPagina);
  const hayMasServicios = serviciosOrdenados.length > serviciosPaginados.length;


  const [clientes, setClientes] = useState([]);

  // Add this useEffect to fetch clients
  useEffect(() => {
    const fetchClientes = async () => {
      const querySnapshot = await getDocs(collection(db, "clientes"));
      const clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);
    };
  
    fetchClientes();
  }, []);


  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);
  const [mostrarFormularioMovimiento, setMostrarFormularioMovimiento] = useState(false);

  const toggleSeleccionServicio = (id) => {
    setServiciosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const importarServicios = async (serviciosExcel) => {
    setCargandoMasivo(true);
    try {
      for (const servicio of serviciosExcel) {
        const servicioFormateado = {
          cliente: servicio.cliente || "",
          equipo: servicio.equipo || "",
          estado: servicio.estado || "presupuesto",
          descripcion: servicio.descripcion || "",
          importe: Number(servicio.importe) || 0,
          metodoPago: servicio.metodoPago || "efectivo",
          fechaIngreso: servicio.fechaIngreso || "",
          fechaFinalizacion: servicio.fechaFinalizacion || "",
          codigoInterno: servicio.codigoInterno || "",
        };

        await addDoc(serviciosRef, servicioFormateado);
      }
      toast({ title: "Servicios importados", status: "success" });
      obtenerServicios();
    } catch (error) {
      console.error("Error al importar servicios:", error);
      toast({ title: "Error al importar servicios", status: "error" });
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
      const serviciosExcel = XLSX.utils.sheet_to_json(sheet);
      if (serviciosExcel.length > 0) {
        importarServicios(serviciosExcel);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const eliminarSeleccionados = async () => {
    setEliminandoMasivo(true);
    try {
      const eliminar = serviciosSeleccionados.map(id => {
        return deleteDoc(doc(db, "servicios", id));
      });
      await Promise.all(eliminar);
      toast({ title: "Servicios eliminados", status: "success" });
      obtenerServicios();
      setServiciosSeleccionados([]);
      setModoSeleccion(false);
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
    setEliminandoMasivo(false);
  };

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🛠️ Servicios</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton
              icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setVistaLista(!vistaLista)}
              aria-label="Cambiar vista"
              colorScheme="teal"
            />
          </Tooltip>
          <Tooltip label="Agregar servicio">
            <IconButton
              icon={<AddIcon />}
              onClick={() => {
                limpiarFormulario();
                onOpen();
              }}
              aria-label="Agregar servicio"
              colorScheme="teal"
            />
          </Tooltip>

          <Tooltip label="Exportar a Excel">
            <IconButton
              icon={<DownloadIcon />}
              onClick={exportarAExcel}
              aria-label="Exportar"
              colorScheme="teal"
            />
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
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <IconButton
              icon={<ViewIcon />}
              aria-label="Modo selección múltiple"
              onClick={() => {
                setModoSeleccion((prev) => !prev);
                setServiciosSeleccionados([]);
              }}
              colorScheme={modoSeleccion ? "yellow" : "red"}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input
          placeholder="Buscar servicio..."
          mb={4}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
        />

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox
              isChecked={serviciosSeleccionados.length === serviciosOrdenados.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const todosIds = serviciosOrdenados.map((s) => s.id);
                  setServiciosSeleccionados(todosIds);
                } else {
                  setServiciosSeleccionados([]);
                }
              }}
            >
              Seleccionar todos
            </Checkbox>

            {serviciosSeleccionados.length > 0 && (
              <Button
                colorScheme="red"
                isLoading={eliminandoMasivo}
                onClick={eliminarSeleccionados}
              >
                Eliminar {serviciosSeleccionados.length} seleccionados
              </Button>
            )}
          </HStack>
        )}

        {cargandoMasivo && (
          <Flex justify="center" align="center" mb={6}>
            <Spinner size="lg" color="teal.300" mr={3} />
            <Text fontSize="md" color="gray.300">Importando servicios...</Text>
          </Flex>
        )}

        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
              {serviciosPaginados.map((s, index) => (
                <motion.div
                  key={s.id || `servicio-${index}`}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {modoSeleccion && (
                    <Checkbox
                      isChecked={serviciosSeleccionados.includes(s.id)}
                      onChange={() => toggleSeleccionServicio(s.id)}
                      colorScheme="teal"
                    />
                  )}

                  <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                    <Heading size="lg" mb={1}>{s.cliente}</Heading>
                    <Text fontSize="sm" color="gray.400">🛠️ Equipo: {s.equipo}</Text>
                    <Text fontSize="sm" color="gray.400">🛠️ Codigo: {s.codigo}</Text>
                    <Text fontSize="sm" color="gray.400">💰 Importe: ${s.importe}</Text>
                    <Text fontSize="sm" color="gray.400">📆 Entrega: {s.fechaFinalizacion}</Text>
                    <Text fontSize="sm" color="gray.400">🧾 Método: {s.metodoPago}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Ingresado el {new Date(s.fechaIngreso).toLocaleDateString()}
                    </Text>
                    <HStack spacing={8} mt={2}>
                      <Badge colorScheme={
                        s.estado === "presupuesto" ? "yellow"
                        : s.estado === "proceso" ? "blue"
                        : s.estado === "finalizado" ? "green"
                        : "purple"
                      }>
                        {s.estado?.toUpperCase()}
                      </Badge>
                    </HStack>
                    <HStack mt={3}>
                      <Button size="sm" colorScheme="blue" onClick={() => editarServicio(s)}>Editar</Button>
                      <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(s)}>Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <AnimatePresence mode="wait">
              {serviciosPaginados.map((s, index) => (
                <motion.div
                  key={s.id || `servicio-${index}`}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {modoSeleccion && (
                    <Checkbox
                      isChecked={serviciosSeleccionados.includes(s.id)}
                      onChange={() => toggleSeleccionServicio(s.id)}
                      colorScheme="teal"
                    />
                  )}
                  <Box p={4} bg="gray.800" borderRadius="md" shadow="lg">
                    <Heading size="lg">{s.cliente}</Heading>
                    <Text fontSize="sm" color="gray.400">🛠️ Equipo: {s.equipo}</Text>
                    <Text fontSize="sm" color="gray.400">🛠️ Codigo: {s.codigo}</Text>
                    <Text fontSize="sm" color="gray.400">💰 Importe: ${s.importe}</Text>
                    <Text fontSize="sm" color="gray.400">📆 Entrega: {s.fechaFinalizacion}</Text>
                    <Text fontSize="sm" color="gray.400">🧾 Método: {s.metodoPago}</Text>
                    <HStack spacing={2} mt={2}>
                      <Badge colorScheme={
                        s.estado === "presupuesto" ? "yellow"
                        : s.estado === "proceso" ? "blue"
                        : s.estado === "finalizado" ? "green"
                        : "purple"
                      }>
                        {s.estado?.toUpperCase()}
                      </Badge>
                    </HStack>
                    <HStack mt={3}>
                      <Button size="sm" colorScheme="blue" onClick={() => editarServicio(s)}>Editar</Button>
                      <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(s)}>Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </SimpleGrid>
        )}

        {hayMasServicios && (
          <Flex justify="center" mt={6}>
            <Button onClick={() => setPagina(pagina + 1)} colorScheme="teal">
              Cargar más servicios
            </Button>
          </Flex>
        )}
      </Box>

      {/* DRAWER: FORMULARIO */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.600">
            {editandoId ? "✏️ Editar servicio" : "➕ Agregar servicio"}
          </DrawerHeader>
          <DrawerBody>
            <form id="formServicio" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
            <Input
              placeholder="Buscar cliente..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value.toLowerCase())}
              mb={2}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
            />

            <Select
              name="cliente"
              placeholder="Seleccionar cliente"
              value={nuevoServicio.cliente}
              onChange={manejarCambio}
              required
              bg="gray.700"
              color="white"
              borderColor="gray.600"
              _hover={{ borderColor: "teal.400" }}
              _focus={{ borderColor: "teal.500", boxShadow: "none" }}
            >
              {clientes
                .filter(c =>
                  c.nombre?.toLowerCase().includes(busquedaCliente)
                )
                .map(cliente => (
                  <option
                    key={cliente.id}
                    value={cliente.nombre}
                    style={{ backgroundColor: "#2D3748", color: "white" }}
                  >
                    {cliente.nombre}
                  </option>
                ))}
            </Select>

                <Input name="equipo" placeholder="Equipo" value={nuevoServicio.equipo} onChange={manejarCambio} />
                <Input
                  placeholder="Código Interno"
                  name="codigoInterno"
                  value={nuevoServicio.codigoInterno}
                  onChange={manejarCambio}
                  bg="gray.700"
                />
                <Textarea name="descripcion" placeholder="Descripción" value={nuevoServicio.descripcion} onChange={manejarCambio} />
                <Box position="relative" zIndex="dropdown">
                  <FormLabel htmlFor="fechaIngreso" color="teal.300" mb={1}>
                    Fecha de ingreso
                  </FormLabel>
                  <Input
                    name="fechaIngreso"
                    type="date"
                    variant="date"
                    value={nuevoServicio.fechaIngreso}
                    onChange={manejarCambio}
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                    _hover={{ borderColor: "teal.400" }}
                    _focus={{ 
                      borderColor: "teal.500", 
                      boxShadow: "0 0 0 1px teal.500",
                      "&::-webkit-calendar-picker-indicator": {
                        filter: "invert(1) brightness(1.5)",
                      }
                    }}
                    css={{
                      // Force calendar popup styling
                      "&::-webkit-calendar-picker-indicator": {
                        filter: "invert(1)",
                        "&:hover": {
                          filter: "invert(1) brightness(1.2)",
                        }
                      },
                    }}
                  />
                </Box>

              <Box position="relative" mt={4}>
                <FormLabel htmlFor="fechaFinalizacion" color="teal.300" mb={1}>
                  Fecha de finalización
                </FormLabel>
                <Input
                  name="fechaFinalizacion"
                  type="date"
                  value={nuevoServicio.fechaFinalizacion}
                  onChange={manejarCambio}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  _hover={{ borderColor: "teal.400" }}
                  _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                  css={{
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      fontSize: "1.2rem",
                      padding: "4px",
                      cursor: "pointer",
                    },
                    "&::-webkit-datetime-edit": {
                      padding: "0.5em",
                    },
                    "&::-webkit-datetime-edit-fields-wrapper": {
                      color: "white",
                    },
                    "&::-webkit-datetime-edit-text": {
                      color: "teal.300",
                      padding: "0 0.2em",
                    },
                  }}
                />
              </Box>
                <Input name="importe" type="number" placeholder="Importe" value={nuevoServicio.importe} onChange={manejarCambio} />
                <Select 
                name="metodoPago" 
                placeholder="Método de pago"
                value={nuevoServicio.metodoPago} 
                onChange={manejarCambio} 
                bg="gray.700" // Background color
                color="white" // Text color
                borderColor="gray.600" // Border color
                _hover={{ borderColor: "teal.400" }} // Hover state
                _focus={{ borderColor: "teal.500", boxShadow: "none" }} // Focus state
                >
                  <option value="Efectivo" style={{ backgroundColor: "#2D3748", color: "white" }}>Efectivo</option>
                  <option value="Transferencia" style={{ backgroundColor: "#2D3748", color: "white" }}>Transferencia</option>
                  <option value="Tarjeta" style={{ backgroundColor: "#2D3748", color: "white" }}>Tarjeta</option>
                  <option value="Cuenta Corriente" style={{ backgroundColor: "#2D3748", color: "white" }}>Cuenta Corriente</option>
                  <option value="Otro" style={{ backgroundColor: "#2D3748", color: "white" }}>Otro</option>
                </Select>
                <Select 
                  name="estado" 
                  placeholder="Estado" 
                  value={nuevoServicio.estado} 
                  onChange={manejarCambio}
                  bg="gray.700" // Background color
                  color="white" // Text color
                  borderColor="gray.600" // Border color
                  _hover={{ borderColor: "teal.400" }} // Hover state
                  _focus={{ borderColor: "teal.500", boxShadow: "none" }} // Focus state
                  >
                  <option value="presupuesto" style={{ backgroundColor: "#2D3748", color: "white" }}>Presupuesto</option>
                  <option value="proceso" style={{ backgroundColor: "#2D3748", color: "white" }}>En proceso</option>
                  <option value="finalizado" style={{ backgroundColor: "#2D3748", color: "white" }}>Finalizado</option>
                  <option value="cobrado" style={{ backgroundColor: "#2D3748", color: "white" }}>Cobrado</option>
                </Select>
              </Grid>
            </form>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor="gray.600">
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
            <Button colorScheme="teal" type="submit" form="formServicio">
              {editandoId ? "Guardar cambios" : "Agregar servicio"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        isOpen={isOpenDialog}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar servicio
            </AlertDialogHeader>

            <AlertDialogBody>
              {servicioAEliminar ? (
                <>¿Estás seguro que querés eliminar <strong>{servicioAEliminar?.cliente}</strong>? Esta acción no se puede deshacer.</>
              ) : (
                <>¿Estás seguro que querés eliminar <strong>{serviciosSeleccionados.length}</strong> servicios seleccionados? Esta acción no se puede deshacer.</>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDialog}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmarEliminacion} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Drawer isOpen={isOpenHistorial} placement="right" onClose={onCloseHistorial} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.900" color="white">
          <DrawerCloseButton />
          <DrawerHeader>📊 Historial de {servicioSeleccionado?.cliente}</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Text color="gray.500">Historial de servicio</Text>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor="gray.700">
            <Button colorScheme="teal" onClick={() => setMostrarFormularioMovimiento(true)}>
              ➕ Agregar nota
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Servicios;

