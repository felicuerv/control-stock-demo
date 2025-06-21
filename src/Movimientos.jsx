// MovimientosSemanal.jsx (solo egresos + botón eliminar)
import React, { useEffect, useState } from "react";
import {
  Box, Heading, VStack, Text, Button, SimpleGrid, Input, Flex, Tooltip, HStack,
  useToast, IconButton
} from "@chakra-ui/react";
import { DeleteIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { startOfWeek, format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AnimatePresence, motion } from "framer-motion";

const agruparPorSemana = (movimientos) => {
  const semanas = {};
  movimientos.forEach((mov) => {
    const fecha = new Date(mov.fecha);
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
    const clave = format(inicioSemana, "yyyy-MM-dd");
    if (!semanas[clave]) semanas[clave] = [];
    semanas[clave].push(mov);
  });
  return semanas;
};

const MovimientosSemanal = () => {
  const [movimientosPorSemana, setMovimientosPorSemana] = useState({});
  const [productosData, setProductosData] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vistaLista, setVistaLista] = useState(true);
  const toast = useToast();

  const obtenerMovimientos = async () => {
    const snap = await getDocs(collection(db, "productos"));
    const productos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProductosData(productos);

    const movimientos = productos.flatMap((producto) =>
      (producto.movimientos || [])
        .filter((mov) => mov.tipo === "egreso")
        .map((mov, index) => ({
          ...mov,
          productoId: producto.id,
          productoDoc: doc(db, "productos", producto.id),
          movimientoIndex: index,
          nombre: producto.nombre,
          codigo: producto.codigo,
          precioUnitario: producto.precioCosto || 0,
          total: (producto.precioCosto || 0) * mov.cantidad,
        }))
    );

    const agrupado = agruparPorSemana(movimientos);
    setMovimientosPorSemana(agrupado);
  };

  useEffect(() => {
    obtenerMovimientos();
  }, []);

  const eliminarMovimiento = async (productoId, movimientoIndex) => {
    const producto = productosData.find((p) => p.id === productoId);
    if (!producto) return;

    const nuevosMovimientos = [...(producto.movimientos || [])];
    nuevosMovimientos.splice(movimientoIndex, 1);

    try {
      await updateDoc(doc(db, "productos", productoId), {
        movimientos: nuevosMovimientos,
      });
      toast({ title: "Movimiento eliminado", status: "info" });
      obtenerMovimientos();
    } catch (error) {
      toast({ title: "Error al eliminar movimiento", status: "error" });
    }
  };

  const exportarSemana = (fechaClave, movimientos) => {
    const data = movimientos.map((m) => ({
      Fecha: new Date(m.fecha).toLocaleDateString(),
      Producto: m.nombre,
      Código: m.codigo,
      Tipo: m.tipo,
      Cantidad: m.cantidad,
      "Precio Unitario": m.precioUnitario,
      "Total (egreso)": m.total,
      Observación: m.observacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Movimientos_Semana`);
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `movimientos_${fechaClave}.xlsx`);

    toast({ title: "Reporte exportado", status: "success" });
  };

  const imprimirSemana = (fechaClave, movimientos) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Movimientos de stock - Semana del ${format(new Date(fechaClave), "dd/MM/yyyy")}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Producto", "Código", "Cantidad", "Precio U.", "Total", "Fecha"]],
      body: movimientos.map((m) => [
        m.nombre,
        m.codigo,
        m.cantidad,
        `$${m.precioUnitario}`,
        `$${m.total}`,
        new Date(m.fecha).toLocaleDateString()
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [54, 162, 235] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    const totalSemana = movimientos.reduce((acc, m) => acc + m.total, 0);
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Total egresado: $${totalSemana.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`movimientos_${fechaClave}.pdf`);
    toast({ title: "Listado impreso en PDF", status: "success" });
  };

  return (
    <Box maxW="1000px" mx="auto" px={4} py={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading fontSize="2xl" color="teal.300">📊 Movimientos de Stock (Egresos)</Heading>
      </Flex>

      <Flex mb={4} justify="space-between">
        <Input
          placeholder="Buscar producto o código..."
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
        </HStack>
      </Flex>

      <VStack spacing={6} align="stretch">
        {Object.entries(movimientosPorSemana).map(([fechaClave, lista]) => {
          const listaFiltrada = lista.filter(m =>
            m.nombre.toLowerCase().includes(busqueda) || m.codigo.toLowerCase().includes(busqueda)
          );
          if (listaFiltrada.length === 0) return null;

          return (
            <Box key={fechaClave} p={4} bg="gray.800" borderRadius="md" shadow="md">
              <Heading size="md" mb={2} color="teal.200">
                Semana del {format(new Date(fechaClave), "dd/MM/yyyy")}
              </Heading>

              {vistaLista ? (
                <VStack spacing={3} align="stretch">
                  <AnimatePresence>
                    {listaFiltrada.map((mov, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                      >
                        <Box p={3} bg="gray.700" borderRadius="md" position="relative">
                          <Text fontSize="sm"><strong>{mov.nombre}</strong> ({mov.codigo})</Text>
                          <Text fontSize="sm">🔴 Egreso — {mov.cantidad} unidades</Text>
                          <Text fontSize="sm">💲 {mov.precioUnitario} x {mov.cantidad} = ${mov.total}</Text>
                          <Text fontSize="xs" color="gray.400">
                            {new Date(mov.fecha).toLocaleString()} — {mov.observacion || "Sin nota"}
                          </Text>
                          <IconButton
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            aria-label="Eliminar movimiento"
                            position="absolute"
                            top={2}
                            right={2}
                            onClick={() => eliminarMovimiento(mov.productoId, mov.movimientoIndex)}
                          />
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {listaFiltrada.map((mov, idx) => (
                    <Box key={idx} p={3} bg="gray.700" borderRadius="md" position="relative">
                      <Text fontSize="sm"><strong>{mov.nombre}</strong> ({mov.codigo})</Text>
                      <Text fontSize="sm">🔴 Egreso — {mov.cantidad} unidades</Text>
                      <Text fontSize="sm">💲 {mov.precioUnitario} x {mov.cantidad} = ${mov.total}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {new Date(mov.fecha).toLocaleString()} — {mov.observacion || "Sin nota"}
                      </Text>
                      <IconButton
                        icon={<DeleteIcon />}
                        size="xs"
                        colorScheme="red"
                        aria-label="Eliminar movimiento"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={() => eliminarMovimiento(mov.productoId, mov.movimientoIndex)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}

              <HStack mt={4} spacing={3}>
                <Button size="sm" colorScheme="teal" onClick={() => exportarSemana(fechaClave, listaFiltrada)}>
                  Exportar semana
                </Button>
                <Button size="sm" colorScheme="blue" onClick={() => imprimirSemana(fechaClave, listaFiltrada)}>
                  Imprimir listado
                </Button>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export default MovimientosSemanal;

