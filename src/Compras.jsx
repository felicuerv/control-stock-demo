import React, { useState, useEffect, useRef } from "react";
import {
  Box, Input, Button, Textarea, Heading, VStack, HStack, Grid,
  Text, useToast, Select, Drawer, DrawerBody, DrawerFooter,
  DrawerHeader, DrawerOverlay, DrawerContent, extendTheme, FormLabel, useDisclosure, DrawerCloseButton,
  Flex, IconButton, Tooltip, Checkbox, SimpleGrid, Spinner, Badge
} from "@chakra-ui/react";
import { AddIcon, ViewIcon, ViewOffIcon, DownloadIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "./firebase";
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";




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


const Compras = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const comprasRef = collection(db, "compras");

  const [compras, setCompras] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("fechaDesc");
  const [vistaLista, setVistaLista] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [comprasSeleccionadas, setComprasSeleccionadas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const comprasPorPagina = 15;
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  const [nuevaCompra, setNuevaCompra] = useState({
    fecha: "",
    producto: "",
    cantidad: "",
    precioUnitario: "",
    total: "",
    metodoPago: "",
    observaciones: ""
  });

  const obtenerCompras = async () => {
    const data = await getDocs(comprasRef);
    setCompras(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    obtenerCompras();
  }, []);

const manejarCambio = (e) => {
  const { name, value } = e.target;

  setNuevaCompra((prev) => {
    let nuevoEstado = {
      ...prev,
      [name]: value,
    };

    // Si cambia el producto, buscá el precio y actualizalo
    if (name === "producto") {
      const productoSeleccionado = productosProveedor.find((p) => p.id === value);
      const precioUnitario = productoSeleccionado?.precioCosto || 0;

      nuevoEstado.precioUnitario = precioUnitario;
      nuevoEstado.total = precioUnitario * prev.cantidad;

    } else if (name === "cantidad" || name === "precioUnitario") {
      const cantidad = name === "cantidad" ? value : prev.cantidad;
      const precioUnitario = name === "precioUnitario" ? value : prev.precioUnitario;
      nuevoEstado.total = parseFloat(cantidad || 0) * parseFloat(precioUnitario || 0);
    }

    return nuevoEstado;
  });
};


    const [productos, setProductos] = useState([]);
    const obtenerProductos = async () => {
      const data = await getDocs(collection(db, "productos"));
      const productosCargados = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosCargados);
    };
  
    useEffect(() => {
      obtenerProductos();
    }, []);
    

    const [proveedores, setProveedores] = useState([]);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    
    useEffect(() => {
      if (proveedorSeleccionado) {
        const productosDelProveedor = productos.filter(
          (prod) => prod.proveedorId === proveedorSeleccionado
        );
        setProductosFiltrados(productosDelProveedor);
        setProductosProveedor(productosDelProveedor);
      } else {
        setProductosFiltrados([]); // Limpiar si no hay proveedor seleccionado
      }
    }, [proveedorSeleccionado, productos]);
    

    
  
    const obtenerProveedores = async () => {
      const proveedoresSnapshot = await getDocs(collection(db, "proveedores"));
      const proveedoresCargados = proveedoresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProveedores(proveedoresCargados);
    };
    
    useEffect(() => {
      obtenerCompras();
      obtenerProveedores(); // Asegurate de llamarla aquí
    }, []);

  const limpiarFormulario = () => {
    setNuevaCompra({
      fecha: "",
      proveedor: "",
      producto: "",
      cantidad: "",
      precioUnitario: "",
      total: "",
      metodoPago: "",
      observaciones: ""
    });
    setEditandoId(null);
    onClose();
  };

  const manejarSubmit = async (c) => {
    c.preventDefault();
  
    const { fecha, producto, cantidad, precioUnitario, total, metodoPago, observaciones } = nuevaCompra;
  
    if (!producto || !cantidad || !precioUnitario || !metodoPago || !total || !fecha || !proveedorSeleccionado) {
      toast({ title: "Faltan campos", status: "warning", duration: 3000 });
      return;
    }
  
    // Obtener nombre del proveedor a partir del ID seleccionado
    const proveedor = proveedores.find((p) => p.id === proveedorSeleccionado);
  
    const compraData = {
      fecha,
      producto,
      cantidad: Number(cantidad),
      precioUnitario: Number(precioUnitario),
      total: Number(total),
      metodoPago,
      observaciones,
      proveedorId: proveedor?.id || "",
      proveedorNombre: proveedor?.nombre || "",
    };
  
    try {
      if (editandoId) {
        await updateDoc(doc(db, "compras", editandoId), compraData);
        toast({ title: "Compra actualizada", status: "success" });
      } else {
        compraData.fechaAlta = new Date().toISOString();
        await addDoc(comprasRef, compraData);
        // Paso 1: Buscar el producto relacionado
        const productoQuery = query(
          collection(db, "productos"),
          where("nombre", "==", compraData.producto),
          where("proveedorNombre", "==", compraData.proveedorNombre)
        );

        const productoSnapshot = await getDocs(productoQuery);

        if (!productoSnapshot.empty) {
          const productoDoc = productoSnapshot.docs[0];
          const productoData = productoDoc.data();

          // Paso 2: Calcular el nuevo stock
          const nuevoStock = (productoData.stock || 0) + compraData.cantidad;

          // Paso 3: Actualizar en Firestore
          await updateDoc(doc(db, "productos", productoDoc.id), {
            stock: nuevoStock,
          });

          toast({ title: "Stock actualizado", status: "success" });
        } else {
          toast({ title: "Producto no encontrado para actualizar stock", status: "warning" });
        }

        toast({ title: "Compra agregada", status: "success" });
      }
      limpiarFormulario();
      obtenerCompras();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };
  
  const importarCompras = async (comprasExcel) => {
    setCargandoMasivo(true);
    try {
      for (const compra of comprasExcel) {
        const compraFormateada = {
          fecha: compra.fecha || "",
          proveedor: compra.proveedorNombre || "",
          producto: compra.producto || "",
          marca: compra.marca || "",
          cantidad: Number(compra.cantidad) || 0,
          precioUnitario: Number(compra.precioUnitario) || 0,
          total: Number(compra.total) || 0,
          metodoPago: compra.ubicacion || "",
          observacion: compra.observacion || "",
        };
        await addDoc(comprasRef, compraFormateada);
      }
      toast({ title: "Compras importadas", status: "success" });
      obtenerCompras();
    } catch (error) {
      console.error("Error al importar:", error);
      toast({ title: "Error al importar compras", status: "error" });
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
      const comprasExcel = XLSX.utils.sheet_to_json(sheet);
      if (comprasExcel.length > 0) {
        importarCompras(comprasExcel);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const editarCompra = (compra) => {
    setNuevaCompra(compra);
    setEditandoId(compra.id);
    onOpen();
  };

  const solicitarEliminacion = async (compra) => {
    await deleteDoc(doc(db, "compras", compra.id));
    toast({ title: "Compra eliminada", status: "info" });
    obtenerCompras();
  };

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [productosProveedor, setProductosProveedor] = useState([]);



  const eliminarSeleccionados = async () => {
    setEliminandoMasivo(true);
    try {
      const eliminar = comprasSeleccionadas.map((id) => deleteDoc(doc(db, "compras", id)));
      await Promise.all(eliminar);
      toast({ title: "Compras eliminadas", status: "success" });
      obtenerCompras();
      setComprasSeleccionadas([]);
      setModoSeleccion(false);
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
    setEliminandoMasivo(false);
  };

  const exportarAExcel = () => {
    const data = compras.map((c) => ({
      Fecha: c.fecha,
      Proveedor: c.proveedorNombre,
      Producto: c.producto,
      Cantidad: c.cantidad,
      "Precio Unitario": c.precioUnitario,
      Total: c.total,
      "Método de Pago": c.metodoPago,
      Observaciones: c.observaciones
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Compras");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `compras_${new Date().toLocaleDateString()}.xlsx`);
  };

  const comprasFiltradas = compras.filter((c) =>
    (c.producto || "").toLowerCase().includes(busqueda) ||
    (c.proveedorNombre || "").toLowerCase().includes(busqueda)

  );

  const comprasOrdenadas = [...comprasFiltradas].sort((a, b) => {
    if (orden === "fechaDesc") return new Date(b.fecha) - new Date(a.fecha);
    if (orden === "proveedor") return a.proveedor.localeCompare(b.proveedor);
    if (orden === "totalDesc") return b.total - a.total;
    return 0;
  });

  const comprasPaginadas = comprasOrdenadas.slice(0, pagina * comprasPorPagina);
  const hayMasCompras = comprasOrdenadas.length > comprasPaginadas.length;

  const totalGastadoMes = compras
    .filter((c) => new Date(c.fecha).getMonth() === new Date().getMonth())
    .reduce((acc, c) => acc + c.total, 0);

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🛒 Compras</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton
              icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setVistaLista(!vistaLista)}
              aria-label="Cambiar vista"
              colorScheme="teal"
            />
          </Tooltip>
          <Tooltip label="Agregar compra">
            <IconButton icon={<AddIcon />} onClick={onOpen} aria-label="Agregar compra" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Exportar a Excel">
            <IconButton icon={<DownloadIcon />} onClick={exportarAExcel} aria-label="Exportar" colorScheme="teal" />
          </Tooltip>
                    {/* <Button
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
                    </Button> */}
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <IconButton
              icon={<ViewIcon />}
              aria-label="Modo selección múltiple"
              onClick={() => {
                setModoSeleccion((prev) => !prev);
                setComprasSeleccionadas([]);
              }}
              colorScheme={modoSeleccion ? "yellow" : "red"}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input placeholder="Buscar por proveedor o producto..." mb={4} value={busqueda} onChange={(e) => setBusqueda(e.target.value.toLowerCase())} />
        <Select mb={6} value={orden} onChange={(e) => setOrden(e.target.value)} bg="gray.800" color="white" borderColor="gray.600">
          <option style={{ background: "#1A202C" }} value="fechaDesc">📅 Más recientes</option>
          <option style={{ background: "#1A202C" }} value="proveedor">🔤 Proveedor (A-Z)</option>
          <option style={{ background: "#1A202C" }} value="totalDesc">💰 Total Descendente</option>
        </Select>

        <Text mb={4} color="teal.300">💸 Total gastado este mes: ${totalGastadoMes}</Text>

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox
              isChecked={comprasSeleccionadas.length === comprasOrdenadas.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const todosIds = comprasOrdenadas.map((c) => c.id);
                  setComprasSeleccionadas(todosIds);
                } else {
                  setComprasSeleccionadas([]);
                }
              }}
            >
              Seleccionar todos
            </Checkbox>

            {comprasSeleccionadas.length > 0 && (
              <Button colorScheme="red" isLoading={eliminandoMasivo} onClick={eliminarSeleccionados}>
                Eliminar {comprasSeleccionadas.length} seleccionadas
              </Button>
            )}
          </HStack>
        )}

        {cargandoMasivo && (
          <Flex justify="center" align="center" mb={6}>
            <Spinner size="lg" color="teal.300" mr={3} />
            <Text fontSize="md" color="gray.300">Procesando compras...</Text>
          </Flex>
        )}

        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
              {comprasPaginadas.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {modoSeleccion && (
                    <Checkbox
                      isChecked={comprasSeleccionadas.includes(c.id)}
                      onChange={() => setComprasSeleccionadas((prev) => prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id])}
                      colorScheme="teal"
                    />
                  )}
                  <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                    <Heading size="md" mb={2}>{c.producto}</Heading>
                    <Text>📦 Proveedor: {c.proveedorNombre || "Sin proveedor"}</Text>
                    <Text>📅 Fecha: {c.fecha}</Text>
                    <Text>💰 Total: ${c.total}</Text>
                    <Badge mt={2} colorScheme="teal">{c.metodoPago}</Badge>
                    <HStack mt={3}>
                      <Button size="sm" colorScheme="blue" onClick={() => editarCompra(c)}>Editar</Button>
                      <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(c)}>Eliminar</Button>
                    </HStack>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {comprasPaginadas.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
                  <Heading size="lg" mb={1}>{c.producto}</Heading>
                  <Text>📦 Proveedor: {c.proveedorNombre || "Sin proveedor"}</Text>
                  <Text>📅 Fecha: {c.fecha}</Text>
                  <Text>💰 Total: ${c.total}</Text>
                  <Badge mt={2} colorScheme="teal">{c.metodoPago}</Badge>
                  <HStack mt={3}>
                    <Button size="sm" colorScheme="blue" onClick={() => editarCompra(c)}>Editar</Button>
                    <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(c)}>Eliminar</Button>
                  </HStack>
                </Box>
              </motion.div>
            ))}
          </SimpleGrid>
        )}

        {hayMasCompras && (
          <Flex justify="center" mt={6}>
            <Button onClick={() => setPagina(pagina + 1)} colorScheme="teal">
              Cargar más compras
            </Button>
          </Flex>
        )}
      </Box>

      {/* Drawer para el formulario */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.600">
            {editandoId ? "✏️ Editar compra" : "➕ Agregar compra"}
          </DrawerHeader>
          <DrawerBody>
            <form id="formCompra" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
                                <Box position="relative" zIndex="dropdown">
                                  <FormLabel htmlFor="fecha" color="teal.300" mb={1}>
                                    Fecha de ingreso
                                  </FormLabel>
                                  <Input
                                    name="fecha"
                                    type="date"
                                    variant="date"
                                    value={nuevaCompra.fecha}
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
                                <Select
                                  placeholder="Seleccionar proveedor"
                                  value={proveedorSeleccionado}
                                  onChange={(e) => setProveedorSeleccionado(e.target.value)}
                                >
                                  {proveedores.map((prov) => (
                                    <option key={prov.id} value={prov.id} style={{ background: "#1A202C" }}>
                                      {prov.nombre}
                                    </option>
                                  ))}
                                </Select>


                    <Input
                      placeholder="Buscar producto por nombre o código..."
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value.toLowerCase())}
                      isDisabled={!proveedorSeleccionado}
                      bg="gray.700"
                      borderColor="gray.600"
                      color="white"
                      mb={2}
                    />

                    <Select
                      placeholder="Seleccionar producto"
                      value={nuevaCompra.producto}
                      name="producto"
                      onChange={manejarCambio}
                      isDisabled={!proveedorSeleccionado}
                    >
                      {productosFiltrados
                        .filter((prod) =>
                          prod.nombre.toLowerCase().includes(busquedaProducto) ||
                          (prod.codigo || '').toLowerCase().includes(busquedaProducto)
                        )
                        .map((prod) => (
                        <option value={prod.id} style={{ background: "#1A202C" }}>
                          {prod.nombre} ({prod.codigo})
                        </option>
                        ))}
                    </Select>

                <HStack>
                  <Input name="cantidad" type="number" placeholder="Cantidad" value={nuevaCompra.cantidad} onChange={manejarCambio} />
                  <Input
                    name="precioUnitario"
                    type="number"
                    value={nuevaCompra.precioUnitario}
                    onChange={manejarCambio}
                    bg="gray.700"
                    color="white"
                    borderColor="gray.600"
                  />
                </HStack>
                <Input name="total" type="number" placeholder="Total" value={nuevaCompra.total} readOnly />
                <Select name="metodoPago" value={nuevaCompra.metodoPago} onChange={manejarCambio}>
                  <option value="" hidden>Método de pago</option>
                  <option style={{ background: "#1A202C" }} value="efectivo">Efectivo</option>
                  <option style={{ background: "#1A202C" }} value="tarjeta">Tarjeta</option>
                  <option style={{ background: "#1A202C" }} value="transferencia">Transferencia</option>
                </Select>
                <Textarea name="observaciones" placeholder="Observaciones" value={nuevaCompra.observaciones} onChange={manejarCambio} />
              </Grid>
            </form>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor="gray.600">
            <Button               variant="outline"
              mr={3}
              onClick={limpiarFormulario}
              bg="gray.700"
              color="white"
              _hover={{ bg: "gray.600" }}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" form="formCompra">{editandoId ? "Guardar cambios" : "Agregar compra"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Compras;
