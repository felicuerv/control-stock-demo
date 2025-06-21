// Componente Ventas.jsx adaptado completamente de Compras.jsx
// Se incluyen todas las funcionalidades: vistas, exportación Excel, selección múltiple, lógica de stock, estilos coherentes

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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import logo from "./assets/logo.png";



const generarFacturaPDF = (venta) => {
  const doc = new jsPDF();
  const fecha = new Date(venta.fecha).toLocaleDateString("es-AR");

  const img = new Image();
  img.src = logo;

  img.onload = () => {
    // Logo
    doc.addImage(img, "PNG", 14, 10, 30, 30);

    // Encabezado
    doc.setFontSize(18);
    doc.text("Factura B", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text("Ponce Refrigeración", 105, 30, null, null, "center");
    doc.text("CUIT: 30-12345678-9", 105, 38, null, null, "center");
    doc.text("Condición frente al IVA: Responsable Inscripto", 105, 46, null, null, "center");
    doc.text("Dirección: Chile 1178, Villa Carlos Paz", 105, 54, null, null, "center");
    doc.text("Tel: 3541 59-1732", 105, 62, null, null, "center");

    // Datos del cliente
    const yDatos = 75;
    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 14, yDatos);
    doc.text(`Empleado: ${venta.empleadoNombre}`, 14, yDatos + 8);
    doc.text(`Forma de pago: ${venta.formaPago}`, 14, yDatos + 16);
    doc.text(`Condición: ${venta.estado}`, 14, yDatos + 24);

    // Tabla
    autoTable(doc, {
      startY: yDatos + 35,
      head: [["Producto", "Cantidad", "Precio Unitario", "Total"]],
      body: [
        [
          venta.producto,
          venta.cantidad,
          `$${venta.precioUnitario.toFixed(2)}`,
          `$${venta.total.toFixed(2)}`
        ]
      ],
      styles: {
        halign: "center",
        fontSize: 10,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [54, 162, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      theme: "striped"
    });

    // Total final
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL A PAGAR: $${venta.total.toFixed(2)}`, 14, finalY);

    doc.save(`Factura_${venta.empleadoNombre}_${fecha}.pdf`);
  };

  img.onerror = () => {
    console.error("Error al cargar el logo");
  };
};




const Ventas = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const ventasRef = collection(db, "ventas");

  const [ventas, setVentas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("fechaDesc");
  const [vistaLista, setVistaLista] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const ventasPorPagina = 15;
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  const [nuevaVenta, setNuevaVenta] = useState({
    empleadoId: "",
    fecha: "",
    formaPago: "",
    estado: "Presupuesto",
    producto: "",
    cantidad: "",
    precioUnitario: "",
    total: ""
  });

  const [busquedaProductoDrawer, setBusquedaProductoDrawer] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);


  const editarVenta = (venta) => {
  setNuevaVenta({ // o setNuevaVenta si tu estado se llama así
    empleadoId: venta.empleadoId || "",
    producto: venta.producto || "",
    cantidad: venta.cantidad.toString() || "1",
    precioUnitario: venta.precioUnitario.toString() || "0",
    total: (venta.precioUnitario * venta.cantidad).toString(),
    formaPago: venta.formaPago || "",
    estado: venta.estado || "",
    fecha: venta.fecha || ""
  });
  setEditandoId(venta.id);
  onOpen();
};


  const obtenerVentas = async () => {
    const data = await getDocs(ventasRef);
    setVentas(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const obtenerEmpleados = async () => {
    const snap = await getDocs(collection(db, "empleados"));
    setEmpleados(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const obtenerProductos = async () => {
    const snap = await getDocs(collection(db, "productos"));
    setProductos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    obtenerVentas();
    obtenerEmpleados();
    obtenerProductos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    const updated = { ...nuevaVenta, [name]: value };
    if (name === "cantidad" || name === "precioUnitario") {
      const cantidad = name === "cantidad" ? Number(value) : Number(nuevaVenta.cantidad);
      const precio = name === "precioUnitario" ? Number(value) : Number(nuevaVenta.precioUnitario);
      updated.total = cantidad * precio;
    }
    setNuevaVenta(updated);
  };

  const limpiarFormulario = () => {
    setNuevaVenta({
      empleadoId: "",
      fecha: "",
      formaPago: "",
      estado: "Presupuesto",
      producto: "",
      cantidad: "",
      precioUnitario: "",
      total: ""
    });
    setEditandoId(null);
    onClose();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    const { empleadoId, fecha, formaPago, estado, producto, cantidad, precioUnitario, total } = nuevaVenta;
  
    if (!empleadoId || !fecha || !formaPago || !estado || !producto || !cantidad || !precioUnitario) {
      toast({ title: "Faltan campos", status: "warning" });
      return;
    }
  
    try {
      const empleado = empleados.find(c => c.id === empleadoId);
      if (!empleado) {
        toast({ title: "empleado no válido", status: "error" });
        return;
      }
  
      const productoRef = doc(db, "productos", producto); // producto es el ID del producto
      const productoSnap = await getDoc(productoRef);
  
      if (!productoSnap.exists()) {
        toast({ title: "Producto no encontrado", status: "error" });
        return;
      }
  
      const productoData = productoSnap.data();
  
      // Validación de stock si está completada
      if (estado === "Completada" && productoData.stock < Number(cantidad)) {
        toast({ title: "Stock insuficiente", status: "error" });
        return;
      }
  
      const nueva = {
        empleadoId,
        empleadoNombre: empleado.nombre,
        fecha,
        formaPago,
        estado,
        productoId: producto,
        productoNombre: productoData.nombre,
        cantidad: Number(cantidad),
        precioUnitario: Number(precioUnitario),
        total: Number(total),
        fechaAlta: new Date().toISOString(),
      };
  
      await addDoc(collection(db, "ventas"), nueva);
  
      // Actualizar stock solo si está completada
      if (estado === "Completada") {
        await updateDoc(productoRef, {
          stock: productoData.stock - Number(cantidad),
        });
      }
  
      toast({ title: "Venta registrada", status: "success" });
      limpiarFormulario();
      obtenerVentas();
  
    } catch (error) {
      console.error("Error al guardar venta:", error);
      toast({ title: "Error", description: error.message, status: "error" });
    }
  };
  

  const exportarAExcel = () => {
    const data = ventas.map((v) => ({
      Fecha: v.fecha,
      Empleado: v.empleadoNombre,
      Producto: v.producto,
      Cantidad: v.cantidad,
      "Precio Unitario": v.precioUnitario,
      Total: v.total,
      "Forma de Pago": v.formaPago,
      Estado: v.estado
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `ventas_${new Date().toLocaleDateString()}.xlsx`);
  };

  const eliminarSeleccionados = async () => {
    setEliminandoMasivo(true);
    try {
      const eliminar = ventasSeleccionadas.map((id) => deleteDoc(doc(db, "ventas", id)));
      await Promise.all(eliminar);
      toast({ title: "Ventas eliminadas", status: "success" });
      obtenerVentas();
      setVentasSeleccionadas([]);
      setModoSeleccion(false);
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
    setEliminandoMasivo(false);
  };
  const ventasFiltradas = ventas.filter((v) =>
    (v.producto || "").toLowerCase().includes(busqueda) ||
    (v.empleadoNombre || "").toLowerCase().includes(busqueda)
  );
  
  const ventasOrdenadas = [...ventasFiltradas].sort((a, b) => {
    if (orden === "fechaDesc") return new Date(b.fecha) - new Date(a.fecha);
    if (orden === "empleado") return a.empleadoNombre.localeCompare(b.empleadoNombre);
    if (orden === "totalDesc") return b.total - a.total;
    return 0;
  });
  
  const ventasPaginadas = ventasOrdenadas.slice(0, pagina * ventasPorPagina);
  const hayMasVentas = ventasOrdenadas.length > ventasPaginadas.length;
  

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">🧾 Ventas</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton
              icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setVistaLista(!vistaLista)}
              aria-label="Cambiar vista"
              colorScheme="teal"
            />
          </Tooltip>
          <Tooltip label="Agregar venta">
            <IconButton icon={<AddIcon />} onClick={onOpen} aria-label="Agregar venta" colorScheme="teal" />
          </Tooltip>
          <Tooltip label="Exportar a Excel">
            <IconButton icon={<DownloadIcon />} onClick={exportarAExcel} aria-label="Exportar" colorScheme="teal" />
          </Tooltip>
          <Tooltip label={modoSeleccion ? "Salir de selección" : "Seleccionar múltiples"}>
            <IconButton
              icon={<ViewIcon />}
              aria-label="Modo selección múltiple"
              onClick={() => {
                setModoSeleccion((prev) => !prev);
                setVentasSeleccionadas([]);
              }}
              colorScheme={modoSeleccion ? "yellow" : "red"}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input placeholder="Buscar por empleado o producto..." mb={4} value={busqueda} onChange={(e) => setBusqueda(e.target.value.toLowerCase())} />
        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox
              isChecked={ventasSeleccionadas.length === ventas.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const todosIds = ventas.map((c) => c.id);
                  setVentasSeleccionadas(todosIds);
                } else {
                  setVentasSeleccionadas([]);
                }
              }}
            >
              Seleccionar todos
            </Checkbox>
            {ventasSeleccionadas.length > 0 && (
              <Button colorScheme="red" isLoading={eliminandoMasivo} onClick={eliminarSeleccionados}>
                Eliminar {ventasSeleccionadas.length} seleccionadas
              </Button>
            )}
          </HStack>
        )}
      </Box>
      {vistaLista ? (
  <VStack spacing={4} align="stretch" maxW="1000px" mx="auto">
    <AnimatePresence mode="wait">
      {ventasPaginadas.map((v) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
            <Heading size="md" mb={2}>{v.productoNombre}</Heading>
            <Text>🧍 empleado: {v.empleadoNombre || "Sin empleado"}</Text>
            <Text>📅 Fecha: {v.fecha}</Text>
            <Text>💰 Total: ${v.total}</Text>
            <Badge mt={2} colorScheme="teal">{v.formaPago}</Badge>
            <Badge ml={2} colorScheme={v.estado === "Completada" ? "green" : v.estado === "En proceso" ? "yellow" : "gray"}>{v.estado}</Badge>
            <HStack mt={3}>
              <Button size="sm" colorScheme="blue" onClick={() => editarVenta(v)}>Editar</Button>
              <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(v)}>Eliminar</Button>
              {v.estado === "Completada" && (
                <Button size="sm" colorScheme="teal" onClick={() => generarFacturaPDF(v)}>Imprimir Factura</Button>
              )}
            </HStack>
          </Box>
        </motion.div>
      ))}
    </AnimatePresence>
  </VStack>
) : (
  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} maxW="1000px" mx="auto">
    {ventasPaginadas.map((v) => (
      <motion.div
        key={v.id}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Box p={4} bg="gray.800" borderRadius="md" shadow="md">
          <Heading size="lg" mb={1}>{v.productoNombre}</Heading>
          <Text>🧍 Empleado: {v.empleadoNombre || "Sin empleado"}</Text>
          <Text>📅 Fecha: {v.fecha}</Text>
          <Text>💰 Total: ${v.total}</Text>
          <Badge mt={2} colorScheme="teal">{v.formaPago}</Badge>
          <Badge ml={2} colorScheme={v.estado === "Completada" ? "green" : v.estado === "En proceso" ? "yellow" : "gray"}>{v.estado}</Badge>
          <HStack mt={3}>
            <Button size="sm" colorScheme="blue" onClick={() => editarVenta(v)}>Editar</Button>
            <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(v)}>Eliminar</Button>
            {v.estado === "Completada" && (
              <Button size="sm" colorScheme="teal" onClick={() => generarFacturaPDF(v)}>Imprimir Factura</Button>
            )}
          </HStack>
        </Box>
      </motion.div>
    ))}
  </SimpleGrid>
)}
<Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
  <DrawerOverlay />
  <DrawerContent bg="gray.800" color="white">
    <DrawerCloseButton />
    <DrawerHeader borderBottomWidth="1px" borderColor="gray.600">
      {editandoId ? "✏️ Editar venta" : "➕ Agregar venta"}
    </DrawerHeader>

    {/* FORMULARIO CORRECTAMENTE POSICIONADO */}
    <form onSubmit={manejarSubmit}>
      <DrawerBody>
        <Grid templateColumns="1fr" gap={4}>
          <Select
            placeholder="Seleccionar empleado"
            name="empleadoId"
            value={nuevaVenta.empleadoId}
            onChange={manejarCambio}
            bg="gray.700"
            color="white"
          >
            {empleados.map((cli) => (
              <option key={cli.id} value={cli.id} style={{ background: "#1A202C" }}>
                {cli.nombre}
              </option>
            ))}
          </Select>

          <Input
            name="fecha"
            type="date"
            value={nuevaVenta.fecha}
            onChange={manejarCambio}
            bg="gray.700"
            borderColor="gray.600"
          />

          <Select
            name="formaPago"
            value={nuevaVenta.formaPago}
            onChange={manejarCambio}
            bg="gray.700"
            color="white"
          >
            <option value="" disabled hidden>
              Método de pago
            </option>
            <option value="efectivo" style={{ background: "#1A202C" }}>Efectivo</option>
            <option value="tarjeta" style={{ background: "#1A202C" }}>Tarjeta</option>
            <option value="transferencia" style={{ background: "#1A202C" }}>Transferencia</option>
          </Select>

          <Select
            name="estado"
            value={nuevaVenta.estado}
            onChange={manejarCambio}
            bg="gray.700"
            color="white"
          >
            <option value="" disabled hidden>
              Estado de la venta
            </option>
            <option value="Presupuesto" style={{ background: "#1A202C" }}>Presupuesto</option>
            <option value="En proceso" style={{ background: "#1A202C" }}>En proceso</option>
            <option value="Completada" style={{ background: "#1A202C" }}>Completada</option>
          </Select>


        <Input
          placeholder="Buscar producto por nombre o código..."
          value={busquedaProductoDrawer}
          onChange={(e) => setBusquedaProductoDrawer(e.target.value.toLowerCase())}
          bg="gray.700"
          color="white"
        />

        <Select
          name="producto"
          value={nuevaVenta.producto}
          onChange={manejarCambio}
          bg="gray.700"
          color="white"
        >
          <option value="" disabled hidden>
            Seleccionar producto
          </option>
          {productos
            .filter((prod) =>
              prod.nombre.toLowerCase().includes(busquedaProductoDrawer) ||
              (prod.codigo?.toLowerCase().includes(busquedaProductoDrawer))
            )
            .map((prod) => (
              <option key={prod.id} value={prod.id} style={{ background: "#1A202C" }}>
                {prod.nombre}
              </option>
            ))}
        </Select>


          <HStack>
            <Input
              name="cantidad"
              type="number"
              placeholder="Cantidad"
              value={nuevaVenta.cantidad}
              onChange={manejarCambio}
              bg="gray.700"
              borderColor="gray.600"
            />
            <Input
              name="precioUnitario"
              type="number"
              placeholder="Precio Unitario"
              value={nuevaVenta.precioUnitario}
              onChange={manejarCambio}
              bg="gray.700"
              borderColor="gray.600"
            />
          </HStack>

          <Input
            name="total"
            type="number"
            placeholder="Total"
            value={nuevaVenta.total}
            readOnly
            bg="gray.700"
            borderColor="gray.600"
          />
        </Grid>
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

        <Button colorScheme="teal" type="submit">
          {editandoId ? "Guardar cambios" : "Agregar venta"}
        </Button>
      </DrawerFooter>
    </form>
  </DrawerContent>
</Drawer>

    </Box>
  );
};

export default Ventas;

