import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter
} from "@chakra-ui/react";


import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";




import { useEffect, useState, useRef } from "react";

import {
  Box, Input, Button, Textarea, Heading, VStack, HStack, Grid,
  FormLabel, Text, Badge, useToast, Select, List, ListItem, Flex,
  IconButton, Tooltip, SimpleGrid,
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent,Checkbox,Spinner, DrawerCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { AddIcon, ViewIcon, ViewOffIcon, DownloadIcon } from "@chakra-ui/icons";

import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Productos = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const productosPorPagina = 15;
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [vistaLista, setVistaLista] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  // const [categorias, setCategorias] = useState(["Motores", "Compresores", "Gas", "Filtros"]);
  const [ setMostrarSugerencias] = useState(false);
  const [categoriasFirebase, setCategoriasFirebase] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  const cargarCategorias = async () => {
    const snapshot = await getDocs(collection(db, "categorias"));
    const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategoriasFirebase(lista);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);
  

  const [proveedores, setProveedores] = useState([]);


  const obtenerProveedores = async () => {
    const proveedoresSnapshot = await getDocs(collection(db, "proveedores"));
    const proveedoresCargados = proveedoresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProveedores(proveedoresCargados);
  };
  
  useEffect(() => {
    obtenerProductos();
    obtenerProveedores(); // Asegurate de llamarla aquí
  }, []);
  

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const cancelRef = useRef();
  const {
    isOpen: isOpenDialog,
    onOpen: onOpenDialog,
    onClose: onCloseDialog,
  } = useDisclosure();
  

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "", codigo: "", categoria: "", marca: "",
    stock: "", stockMinimo: "", precioCosto: "",
    precioVenta: "", ubicacion: "", descripcion: ""
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
const {
  isOpen: isOpenHistorial,
  onOpen: onOpenHistorial,
  onClose: onCloseHistorial,
} = useDisclosure();


  const productosRef = collection(db, "productos");

// Paso 2: Cargar productos con paginación local
const obtenerProductos = async () => {
  const data = await getDocs(productosRef);
  const productosCargados = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  setProductos(productosCargados);
};

useEffect(() => {
  obtenerProductos();
}, []);

  const exportarAExcel = () => {
    const data = productos.map((prod) => ({
      Nombre: prod.nombre,
      Código: prod.codigo,
      Categoría: prod.categoria,
      Marca: prod.marca,
      Stock: prod.stock,
      "Stock mínimo": prod.stockMinimo,
      "Precio costo": prod.precioCosto,
      "Precio venta": prod.precioVenta,
      Ubicación: prod.ubicacion,
      Descripción: prod.descripcion,
      "Fecha alta": prod.fechaAlta ? new Date(prod.fechaAlta).toLocaleDateString() : "",
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  
    saveAs(blob, `inventario_productos_${new Date().toLocaleDateString()}.xlsx`);
  };

  // useEffect(() => {
  //   obtenerProductos();
  
  //   const categoriasGuardadas = localStorage.getItem("categorias");
  //   if (categoriasGuardadas) {
  //     setCategorias(JSON.parse(categoriasGuardadas));
  //   }
  // }, []);
  

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setNuevoProducto({ ...nuevoProducto, [name]: value });
  };

  const [mostrarFormularioMovimiento, setMostrarFormularioMovimiento] = useState(false);


  const limpiarFormulario = () => {
    setNuevoProducto({
      nombre: "", codigo: "", categoria: "", marca: "",
      stock: "", stockMinimo: "", precioCosto: "",
      precioVenta: "", ubicacion: "", descripcion: ""
    });
    setEditandoId(null);
    // setMostrarSugerencias(false);
    onClose();
  };

  const guardarMovimiento = async () => {
    if (!productoSeleccionado || !nuevoMovimiento.tipo || !nuevoMovimiento.cantidad) return;
  
    const nuevoMov = {
      fecha: new Date().toISOString(),
      ...nuevoMovimiento
    };
  
    const actualizado = {
      ...productoSeleccionado,
      movimientos: [...(productoSeleccionado.movimientos || []), nuevoMov],
      stock:
        nuevoMovimiento.tipo === "ingreso"
          ? productoSeleccionado.stock + nuevoMovimiento.cantidad
          : productoSeleccionado.stock - nuevoMovimiento.cantidad
    };
  
    await updateDoc(doc(db, "productos", productoSeleccionado.id), actualizado);
    toast({ title: "Movimiento registrado", status: "success" });
  
    setNuevoMovimiento({ tipo: "cantidad: 0, observacion: " });
    setMostrarFormularioMovimiento(false);
    obtenerProductos();
    setProductoSeleccionado(actualizado); // actualizar drawer en vivo
  };
  


  const manejarSubmit = async (e) => {
    e.preventDefault();

    const { nombre, codigo, categoria, marca, stock, stockMinimo, precioCosto, precioVenta, ubicacion, descripcion } = nuevoProducto;

    if (!nombre || !codigo || !categoria) {
      toast({ title: "Faltan campos", status: "warning", duration: 3000 });
      return;
    }

    // if (!categorias.includes(categoria)) {
    //   const nuevasCategorias = [...categorias, categoria];
    //   setCategorias(nuevasCategorias);
    //   localStorage.setItem("categorias", JSON.stringify(nuevasCategorias));
    // }
    
    const productoData = {
      nombre, codigo, categoria, marca,
      stock: Number(stock), stockMinimo: Number(stockMinimo),
      precioCosto: Number(precioCosto), precioVenta: Number(precioVenta),
      ubicacion, descripcion,
      proveedorId: nuevoProducto.proveedorId || "",
      proveedorNombre: nuevoProducto.proveedorNombre || ""
    };



    try {
      if (editandoId) {
        await updateDoc(doc(db, "productos", editandoId), productoData);
        toast({ title: "Producto actualizado", status: "success" });
      } else {
        productoData.fechaAlta = new Date().toISOString();
        await addDoc(productosRef, productoData);
        toast({ title: "Producto agregado", status: "success" });
      }
      limpiarFormulario();
      obtenerProductos();
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  const editarProducto = (producto) => {
    setNuevoProducto({
      ...producto,
      stock: producto.stock.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      precioCosto: producto.precioCosto.toString(),
      precioVenta: producto.precioVenta.toString(),
      proveedorId: producto.proveedorId || "",
      proveedorNombre: producto.proveedorNombre || ""
    });
    setEditandoId(producto.id);
    onOpen();
  };

  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "",
    cantidad: 0,
    observacion: ""
  });
  
  const solicitarEliminacion = (producto) => {
    setProductoAEliminar(producto);
    onOpenDialog();
  };
  
  const confirmarEliminacion = async () => {
    try {
      if (productoAEliminar) {
        await deleteDoc(doc(db, "productos", productoAEliminar.id));
        toast({ title: "Producto eliminado", status: "error" });
      } else if (productosSeleccionados.length > 0) {
        for (const id of productosSeleccionados) {
          await deleteDoc(doc(db, "productos", id));
        }
        toast({
          title: "Productos eliminados",
          description: `${productosSeleccionados.length} productos eliminados correctamente.`,
          status: "error",
        });
        setProductosSeleccionados([]);
        setModoSeleccion(false);
      }
  
      obtenerProductos();
      onCloseDialog();
      setProductoAEliminar(null);
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };
  
  
  

// Paso 3: Calcular productos paginados y renderizados
const productosFiltrados = productos.filter((prod) =>
  prod.nombre.toLowerCase().includes(busqueda) ||
  prod.codigo.toLowerCase().includes(busqueda) ||
  prod.categoria.toLowerCase().includes(busqueda) ||
  prod.ubicacion.toLowerCase().includes(busqueda)
);

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
    if (orden === "stock") return b.stock - a.stock;
    if (orden === "precioDesc") return b.precioVenta - a.precioVenta;
    if (orden === "precioAsc") return a.precioVenta - b.precioVenta;
    if (orden === "fechaDesc") return new Date(b.fechaAlta || 0) - new Date(a.fechaAlta || 0);
    return 0;
  });

  const productosPaginados = productosOrdenados.slice(0, pagina * productosPorPagina);
const hayMasProductos = productosOrdenados.length > productosPaginados.length;

  const manejarImportacion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const productos = XLSX.utils.sheet_to_json(sheet);
  
      // Validación básica (nombre y código son obligatorios)
      const productosValidos = productos.filter(p => p.nombre && p.codigo);
  
      for (const producto of productosValidos) {
        const docData = {
          ...producto,
          stock: Number(producto.stock || 0),
          stockMinimo: Number(producto.stockMinimo || 0),
          precioCosto: Number(producto.precioCosto || 0),
          precioVenta: Number(producto.precioVenta || 0),
          fechaAlta: new Date().toISOString()
        };
  
        await addDoc(productosRef, docData);
      }
  
      toast({
        title: "Importación completada",
        description: `${productosValidos.length} productos cargados correctamente.`,
        status: "success",
        duration: 5000,
        isClosable: true
      });
  
      obtenerProductos(); // refrescar lista
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
  
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  const toggleSeleccionProducto = (id) => {
    setProductosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };
  
  // Paso 2: Estados
  const [cargandoMasivo, setCargandoMasivo] = useState(false);

  // Paso 3: Función de importación masiva
const importarProductos = async (productosExcel) => {
  setCargandoMasivo(true);
  try {
    for (const producto of productosExcel) {
      const productoFormateado = {
        nombre: producto.nombre || "",
        codigo: producto.codigo || "",
        categoria: producto.categoria || "",
        marca: producto.marca || "",
        stock: Number(producto.stock) || 0,
        stockMinimo: Number(producto.stockMinimo) || 0,
        precioCosto: Number(producto.precioCosto) || 0,
        precioVenta: Number(producto.precioVenta) || 0,
        ubicacion: producto.ubicacion || "",
        descripcion: producto.descripcion || "",
        fechaAlta: new Date().toISOString(),
      };
      await addDoc(productosRef, productoFormateado);
    }
    toast({ title: "Productos importados", status: "success" });
    obtenerProductos();
  } catch (error) {
    console.error("Error al importar:", error);
    toast({ title: "Error al importar productos", status: "error" });
  } finally {
    setCargandoMasivo(false);
  }
};

// Paso 4: Función para procesar el archivo Excel
const procesarExcelMasivo = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const productosExcel = XLSX.utils.sheet_to_json(sheet);
    if (productosExcel.length > 0) {
      importarProductos(productosExcel);
    }
  };
  reader.readAsArrayBuffer(file);
};

// ... (dentro del componente Productos)
const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  const eliminarSeleccionados = async () => {
    setEliminandoMasivo(true);
    try {
      const eliminar = productosSeleccionados.map((id) => deleteDoc(doc(db, "productos", id)));
      await Promise.all(eliminar);
      toast({ title: "Productos eliminados", status: "success" });
      obtenerProductos();
      setProductosSeleccionados([]);
      setModoSeleccion(false);
    } catch (err) {
      toast({ title: "Error al eliminar", status: "error" });
    }
    setEliminandoMasivo(false);
  };

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100" px={4} py={6} pb="100px">
      <Flex justify="space-between" align="center" maxW="1000px" mx="auto" mb={4}>
        <Heading fontSize="2xl" color="teal.300">📦 Inventario de productos</Heading>
        <HStack spacing={2}>
          <Tooltip label={vistaLista ? "Vista tarjetas" : "Vista lista"}>
            <IconButton
              icon={vistaLista ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setVistaLista(!vistaLista)}
              aria-label="Cambiar vista"
              colorScheme="teal"
            />
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
            <IconButton
              icon={<DownloadIcon />} // o cualquier icono que uses
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
              icon={<ViewIcon />} // Podés usar otro ícono tipo checkbox múltiple
              aria-label="Modo selección múltiple"
              onClick={() => {
                setModoSeleccion((prev) => !prev);
                setProductosSeleccionados([]);
              }}
              colorScheme={modoSeleccion ? "yellow" : "red"}
            />
          </Tooltip>

        </HStack>
      </Flex>

      <Box maxW="1000px" mx="auto">
        <Input
          placeholder="Buscar producto..."
          mb={4}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
        />
        <Select
          mb={6}
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          bg="gray.800"
          color="white"
          borderColor="gray.600"
        >
          <option style={{ background: "#1A202C" }} value="fechaDesc">📅 Más recientes</option>

          <option style={{ background: "#1A202C" }} value="nombre">🔤 Nombre (A-Z)</option>
          <option style={{ background: "#1A202C" }} value="stock">📦 Stock</option>
          <option style={{ background: "#1A202C" }} value="precioDesc">💲 Precio ↓</option>
          <option style={{ background: "#1A202C" }} value="precioAsc">💲 Precio ↑</option>
        </Select>

        {modoSeleccion && (
          <HStack mb={4}>
            <Checkbox
              isChecked={productosSeleccionados.length === productosOrdenados.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const todosIds = productosOrdenados.map((prod) => prod.id);
                  setProductosSeleccionados(todosIds);
                } else {
                  setProductosSeleccionados([]);
                }
              }}
            >
              Seleccionar todos
            </Checkbox>

            {productosSeleccionados.length > 0 && (
              <Button
                colorScheme="red"
                isLoading={eliminandoMasivo}
                onClick={eliminarSeleccionados}
              >
                Eliminar {productosSeleccionados.length} seleccionados
              </Button>
            )}
          </HStack>
        )}


      {/* // Paso 5: Agregá esto al render, arriba del listado */}
      {cargandoMasivo && (
        <Flex justify="center" align="center" mb={6}>
          <Spinner size="lg" color="teal.300" mr={3} />
          <Text fontSize="md" color="gray.300">Importando productos...</Text>
        </Flex>
      )}
        {vistaLista ? (
          <VStack spacing={4} align="stretch">
            <AnimatePresence mode="wait">
            {productosPaginados.map((prod, index) => (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {modoSeleccion && (
                  <Checkbox
                    isChecked={productosSeleccionados.includes(prod.id)}
                    onChange={() => toggleSeleccionProducto(prod.id)}
                    colorScheme="teal"
                  />
                )}

              <Box key={prod.id || `producto-${index}`} p={4} bg="gray.800" borderRadius="md" shadow="md">
                <Heading size="md" mb={1}>{prod.nombre}</Heading>
                <Text fontSize="sm" color="gray.400">
                  🏢 Proveedor: {prod.proveedorNombre || "Sin proveedor"}
                </Text>
                <Text fontSize="sm" color="gray.400">Código: {prod.codigo}</Text>
                <Text fontSize="sm" color="gray.400">Ubicación: {prod.ubicacion}</Text>
                <Text>💲 ${prod.precioVenta} | Stock: {prod.stock}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                Agregado el {new Date(prod.fechaAlta).toLocaleDateString()}
                </Text>
                <HStack spacing={2} mt={2}>
                  <Badge colorScheme="teal">{prod.categoria}</Badge>
                  {prod.stock < prod.stockMinimo && (
                    <Badge colorScheme="red">⚠️ Bajo stock</Badge>
                  )}
                </HStack>
                <HStack mt={3}>
                  <Button size="sm" colorScheme="blue" onClick={() => editarProducto(prod)}>Editar</Button>
                  <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(prod)}>Eliminar</Button>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={() => {
                      setProductoSeleccionado(prod);
                      onOpenHistorial();
                    }}
                  >
                    📊 Movimientos
                  </Button>
                </HStack>
              </Box>
              </motion.div>
            ))}
            </AnimatePresence>
            {/* {hayMasProductos && (
            <Flex justify="center" mt={6}>
              <Button onClick={() => setPagina(pagina + 1)} colorScheme="teal">
                Cargar más productos
              </Button>
            </Flex>
          )} */}
          </VStack>
          
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {productosPaginados.map((prod, index) => (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}

              >

                {modoSeleccion && (
                  <Checkbox
                    isChecked={productosSeleccionados.includes(prod.id)}
                    onChange={() => toggleSeleccionProducto(prod.id)}
                    colorScheme="teal"
                  />
                )}
                <Box key={prod.id || `producto-${index}`} p={4} bg="gray.800" borderRadius="md" shadow="lg">
                  <Heading size="lg">{prod.nombre}</Heading>
                  <Text fontSize="sm" color="gray.400">Código: {prod.codigo}</Text>
                  <Text fontSize="sm" color="gray.400">Ubicación: {prod.ubicacion}</Text>
                  <Text mt={2}>💲 ${prod.precioVenta} | Stock: {prod.stock}</Text>
                  <HStack spacing={2} mt={2}>
                    <Badge colorScheme="teal">{prod.categoria}</Badge>
                    {prod.stock < prod.stockMinimo && (
                      <Badge colorScheme="red">⚠️ Bajo stock</Badge>
                    )}
                  </HStack>
                  <HStack mt={3}>
                    <Button size="sm" colorScheme="blue" onClick={() => editarProducto(prod)}>Editar</Button>
                    <Button size="sm" colorScheme="red" onClick={() => solicitarEliminacion(prod)}>Eliminar</Button>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => {
                        setProductoSeleccionado(prod);
                        onOpenHistorial();
                      }}
                    >
                      📊 Movimientos
                    </Button>
                  </HStack>
                </Box>
              </motion.div>
            ))}
          </SimpleGrid>
          
        )}

        {hayMasProductos && (
          <Flex justify="center" mt={6}>
            <Button onClick={() => setPagina(pagina + 1)} colorScheme="teal">
              Cargar más productos
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
            {editandoId ? "✏️ Editar producto" : "➕ Agregar producto"}
          </DrawerHeader>
          <DrawerBody>
            <form id="formProducto" onSubmit={manejarSubmit}>
              <Grid templateColumns="1fr" gap={4}>
              <Select
                name="proveedorId"
                placeholder="Seleccionar proveedor"
                value={nuevoProducto.proveedorId}
                onChange={(e) => {
                  const proveedorSeleccionado = proveedores.find((p) => p.id === e.target.value);
                  setNuevoProducto({
                    ...nuevoProducto,
                    proveedorId: e.target.value,
                    proveedorNombre: proveedorSeleccionado?.nombre || "",
                  });
                }}
              >
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "#1A202C" }}>
                    {p.nombre}
                  </option>
                ))}
              </Select>

                <Input name="nombre" placeholder="Nombre" value={nuevoProducto.nombre} onChange={manejarCambio} />
                <Input name="codigo" placeholder="Código" value={nuevoProducto.codigo} onChange={manejarCambio} />
                <VStack align="stretch" spacing={2}>
                  <Select
                    name="categoria"
                    placeholder="Seleccioná una categoría"
                    value={nuevoProducto.categoria}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })
                    }
                    bg="gray.700"
                    color="white"
                  >
                    {categoriasFirebase.map((cat) => (
                      <option key={cat.id} value={cat.nombre} style={{ background: "#1A202C" }}>
                        {cat.nombre}
                      </option>
                    ))}
                  </Select>

                  <HStack>
                    <Input
                      placeholder="Agregar nueva categoría"
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      bg="gray.700"
                      color="white"
                    />
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={async () => {
                        if (nuevaCategoria.trim() === "") return;
                        try {
                          await addDoc(collection(db, "categorias"), { nombre: nuevaCategoria });
                          setNuevaCategoria("");
                          cargarCategorias();
                          toast({ title: "Categoría agregada", status: "success" });
                        } catch (err) {
                          toast({ title: "Error al agregar categoría", status: "error" });
                        }
                      }}
                    >
                      +
                    </Button>
                  </HStack>
                </VStack>

                {/* <Input
                  name="categoria"
                  placeholder="Categoría"
                  value={nuevoProducto.categoria}
                  onChange={(e) => {
                    setNuevoProducto({ ...nuevoProducto, categoria: e.target.value });
                    setMostrarSugerencias(true);
                  }}
                  autoComplete="off"
                />
                {mostrarSugerencias && nuevoProducto.categoria && (
                  <Box bg="gray.700" borderRadius="md" overflow="hidden">
                    <List spacing={0}>
                      {categorias.filter(cat => cat.toLowerCase().includes(nuevoProducto.categoria.toLowerCase())).map((cat) => (
                        <ListItem
                          key={cat}
                          px={3} py={2}
                          _hover={{ bg: "teal.600", cursor: "pointer" }}
                          onClick={() => {
                            setNuevoProducto({ ...nuevoProducto, categoria: cat });
                            setMostrarSugerencias(false);
                          }}
                        >
                          {cat}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )} */}
                <Input name="marca" placeholder="Marca" value={nuevoProducto.marca} onChange={manejarCambio} />
                <HStack>
                  <Input name="stock" type="number" placeholder="Stock" value={nuevoProducto.stock} onChange={manejarCambio} />
                  <Input name="stockMinimo" type="number" placeholder="Mínimo" value={nuevoProducto.stockMinimo} onChange={manejarCambio} />
                </HStack>
                <HStack>
                  <Input name="precioCosto" type="number" placeholder="Costo" value={nuevoProducto.precioCosto} onChange={manejarCambio} />
                  <Input name="precioVenta" type="number" placeholder="Venta" value={nuevoProducto.precioVenta} onChange={manejarCambio} />
                </HStack>
                <Input name="ubicacion" placeholder="Ubicación" value={nuevoProducto.ubicacion} onChange={manejarCambio} />
                <Textarea name="descripcion" placeholder="Descripción" value={nuevoProducto.descripcion} onChange={manejarCambio} />
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

            <Button colorScheme="teal" type="submit" form="formProducto">
              {editandoId ? "Guardar cambios" : "Agregar producto"}
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
            Eliminar producto
          </AlertDialogHeader>

          <AlertDialogBody>
          {productoAEliminar ? (
            <>¿Estás seguro que querés eliminar <strong>{productoAEliminar?.nombre}</strong>? Esta acción no se puede deshacer.</>
          ) : (
            <>¿Estás seguro que querés eliminar <strong>{productosSeleccionados.length}</strong> productos seleccionados? Esta acción no se puede deshacer.</>
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
    <DrawerHeader>📊 Movimientos de {productoSeleccionado?.nombre}</DrawerHeader>

    <DrawerBody>
      <VStack spacing={4} align="stretch">
        {productoSeleccionado?.movimientos?.length > 0 ? (
          productoSeleccionado.movimientos.map((mov, index) => (
            <Box key={index} p={3} bg="gray.800" borderRadius="md">
              <Text fontSize="sm">
                <strong>{mov.tipo === "ingreso" ? "🟢 Ingreso" : "🔴 Egreso"}</strong> — {mov.cantidad} unidades
              </Text>
              <Text fontSize="xs" color="gray.400">
                {new Date(mov.fecha).toLocaleString()} — {mov.observacion || "Sin nota"}
              </Text>
            </Box>
          ))
        ) : (
          <Text color="gray.500">Este producto no tiene movimientos registrados.</Text>
        )}
      </VStack>
          {mostrarFormularioMovimiento && (
            <Box mt={4} p={4} borderRadius="md" bg="gray.800" border="1px solid #444">
            <Heading size="sm" mb={3}>➕ Agregar movimiento</Heading>

            <Select
              bg="gray.700"
              color="white"
              _hover={{ bg: "gray.600" }}
              mb={2}
              onChange={(e) =>
                setNuevoMovimiento((prev) => ({ ...prev, tipo: e.target.value }))
              }
            >
              <option value="" disabled selected hidden>
                Tipo de movimiento
              </option>
              <option style={{ background: "#1A202C" }} value="ingreso">Ingreso</option>
              <option style={{ background: "#1A202C" }} value="egreso">Egreso</option>
            </Select>

        <Input
          type="number"
          placeholder="Cantidad"
          bg="gray.700"
          mb={2}
          onChange={(e) => setNuevoMovimiento(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
        />

        <Textarea
          placeholder="Observación (opcional)"
          bg="gray.700"
          mb={3}
          onChange={(e) => setNuevoMovimiento(prev => ({ ...prev, observacion: e.target.value }))}
        />

        <HStack justify="flex-end">
        <Button
              size="sm"
              variant="outline"
              mr={3}
              onClick={limpiarFormulario}
              bg="gray.700"
              color="white"
              _hover={{ bg: "gray.600" }}
            >
              Cancelar
            </Button>
          <Button size="sm" colorScheme="teal" onClick={guardarMovimiento}>
            Guardar
          </Button>
        </HStack>
      </Box>
    )}

    </DrawerBody>

    <DrawerFooter borderTopWidth="1px" borderColor="gray.700">
      <Button colorScheme="teal" onClick={() => setMostrarFormularioMovimiento(true)}>
        ➕ Agregar movimiento
      </Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>


    </Box>
  );
};

export default Productos;







